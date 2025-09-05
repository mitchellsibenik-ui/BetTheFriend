import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/unread - Get unread message counts for all chat rooms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all chat rooms for the user
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ]
      },
      include: {
        messages: {
          where: {
            senderId: { not: session.user.id }, // Only messages from other users
            readStatus: {
              none: {
                userId: session.user.id
              }
            }
          },
          include: {
            sender: {
              select: { id: true, username: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1 // Get the latest unread message for each room
        }
      }
    })

    // Format the response
    const unreadData = chatRooms
      .filter(room => room.messages.length > 0)
      .map(room => ({
        roomId: room.id,
        unreadCount: room.messages.length,
        latestMessage: room.messages[0],
        otherUser: room.user1Id === session.user.id 
          ? { id: room.user2Id, username: room.user2?.username }
          : { id: room.user1Id, username: room.user1?.username }
      }))

    return NextResponse.json({ unreadMessages: unreadData })
  } catch (error) {
    console.error('Error fetching unread messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
