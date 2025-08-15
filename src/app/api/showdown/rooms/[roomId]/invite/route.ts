import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.username) {
      return NextResponse.json({ error: 'Username not found in session' }, { status: 400 })
    }

    const { friendIds } = await request.json()

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return NextResponse.json(
        { error: 'Friend IDs are required' },
        { status: 400 }
      )
    }

    // Verify the user is the creator of the room
    const room = await prisma.showdownRoom.findUnique({
      where: { id: params.roomId },
      include: { creator: true }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only room creator can send invites' },
        { status: 403 }
      )
    }

    // Verify all friendIds are actual friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          {
            AND: [
              { senderId: session.user.id },
              { receiverId: { in: friendIds } },
              { status: 'ACCEPTED' }
            ]
          },
          {
            AND: [
              { receiverId: session.user.id },
              { senderId: { in: friendIds } },
              { status: 'ACCEPTED' }
            ]
          }
        ]
      }
    })

    console.log('Found friendships:', friendships)
    console.log('Original friendIds:', friendIds)

    // Extract the friend IDs from the friendships
    const validFriendIds = []
    for (const friendship of friendships) {
      if (friendship.senderId === session.user.id) {
        validFriendIds.push(friendship.receiverId)
      } else if (friendship.receiverId === session.user.id) {
        validFriendIds.push(friendship.senderId)
      }
    }

    console.log('Valid friend IDs:', validFriendIds)

    if (validFriendIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid friends found' },
        { status: 400 }
      )
    }

    // Create notifications for each friend
    console.log('Creating notifications for friends:', validFriendIds)
    const notifications = await Promise.all(
      validFriendIds.map(async (friendId) => {
        console.log('Creating notification for friend ID:', friendId)
        
        // Verify the friend exists
        const friend = await prisma.user.findUnique({
          where: { id: friendId },
          select: { id: true, username: true }
        })
        console.log('Friend found:', friend)
        
        const notification = await prisma.notification.create({
          data: {
            userId: friendId,
            type: 'room_invite',
            message: `${session.user.username} invited you to join "${room.name}"`,
            data: JSON.stringify({
              roomId: params.roomId,
              roomName: room.name,
              creatorUsername: session.user.username,
              entryFee: room.entryFee
            })
          }
        })
        console.log('Created notification:', { id: notification.id, userId: notification.userId, type: notification.type, message: notification.message })
        return notification
      })
    )

    console.log('Created notifications:', notifications)

    return NextResponse.json({
      message: `Invites sent to ${notifications.length} friends`,
      invitedCount: notifications.length
    })
  } catch (error) {
    console.error('Error sending invites:', error)
    return NextResponse.json(
      { error: 'Failed to send invites' },
      { status: 500 }
    )
  }
} 