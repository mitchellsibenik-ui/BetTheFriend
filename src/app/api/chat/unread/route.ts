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
        user1: {
          select: { id: true, username: true }
        },
        user2: {
          select: { id: true, username: true }
        },
        messages: {
          where: {
            senderId: { not: session.user.id } // Only messages from other users
          },
          include: {
            sender: {
              select: { id: true, username: true }
            },
            readStatus: {
              where: {
                userId: session.user.id
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Format the response - filter for unread messages
    const unreadData = chatRooms
      .map(room => {
        // Filter messages that haven't been read by current user
        const unreadMessages = room.messages.filter(message => 
          message.readStatus.length === 0
        )
        
        if (unreadMessages.length === 0) return null
        
        return {
          roomId: room.id,
          unreadCount: unreadMessages.length,
          latestMessage: unreadMessages[0], // Most recent unread message
          otherUser: room.user1Id === session.user.id 
            ? { id: room.user2Id, username: room.user2?.username }
            : { id: room.user1Id, username: room.user1?.username }
        }
      })
      .filter(Boolean) // Remove null entries

    return NextResponse.json({ unreadMessages: unreadData })
  } catch (error) {
    console.error('Error fetching unread messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
