import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/rooms - Get all chat rooms for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rooms = await prisma.chatRoom.findMany({
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
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, username: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Error fetching chat rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/chat/rooms - Create or get existing chat room between two users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { friendId } = await request.json()
    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 })
    }

    // Check if users are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: friendId, status: 'ACCEPTED' },
          { senderId: friendId, receiverId: session.user.id, status: 'ACCEPTED' }
        ]
      }
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Users are not friends' }, { status: 403 })
    }

    // Find existing room or create new one
    let room = await prisma.chatRoom.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id, user2Id: friendId },
          { user1Id: friendId, user2Id: session.user.id }
        ]
      },
      include: {
        user1: {
          select: { id: true, username: true }
        },
        user2: {
          select: { id: true, username: true }
        }
      }
    })

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          user1Id: session.user.id,
          user2Id: friendId
        },
        include: {
          user1: {
            select: { id: true, username: true }
          },
          user2: {
            select: { id: true, username: true }
          }
        }
      })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error('Error creating/getting chat room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
