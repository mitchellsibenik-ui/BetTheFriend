import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { senderId, friendshipId, accept } = await request.json()

    if (typeof accept !== 'boolean') {
      return NextResponse.json(
        { error: 'Accept status is required' },
        { status: 400 }
      )
    }

    // Find the friendship request - support both friendshipId and senderId
    let friendship = null
    if (friendshipId) {
      // If friendshipId is provided, use it directly
      friendship = await prisma.friendship.findFirst({
        where: {
          id: friendshipId,
          receiverId: session.user.id,
          status: 'PENDING'
        }
      })
    } else if (senderId) {
      // If senderId is provided, find by senderId
      friendship = await prisma.friendship.findFirst({
        where: {
          senderId: senderId,
          receiverId: session.user.id,
          status: 'PENDING'
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Either senderId or friendshipId is required' },
        { status: 400 }
      )
    }

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    if (accept) {
      // Accept the friend request
      await prisma.friendship.update({
        where: { id: friendship.id },
        data: { status: 'ACCEPTED' }
      })
    } else {
      // Decline the friend request by deleting it
      await prisma.friendship.delete({
        where: { id: friendship.id }
      })
    }

    // Delete the notification for this friend request
    const actualSenderId = friendship.senderId
    await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
        type: 'friend_request',
        data: {
          contains: `"senderId":"${actualSenderId}"`
        }
      }
    })

    return NextResponse.json({
      message: accept ? 'Friend request accepted successfully' : 'Friend request declined'
    })
  } catch (error) {
    console.error('Error responding to friend request:', error)
    return NextResponse.json(
      { error: 'Failed to respond to friend request' },
      { status: 500 }
    )
  }
} 