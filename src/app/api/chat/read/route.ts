import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/chat/read - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await request.json()

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })
    }

    // Verify user has access to this room
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ]
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get all unread messages in this room for this user
    const unreadMessages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        senderId: { not: session.user.id }, // Only messages from other users
        readStatus: {
          none: {
            userId: session.user.id
          }
        }
      },
      select: { id: true }
    })

    // Mark all unread messages as read
    if (unreadMessages.length > 0) {
      await prisma.chatReadStatus.createMany({
        data: unreadMessages.map(msg => ({
          messageId: msg.id,
          userId: session.user.id
        })),
        skipDuplicates: true
      })
    }

    return NextResponse.json({ 
      success: true, 
      markedAsRead: unreadMessages.length 
    })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
