import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get request body
    const { username } = await request.json()
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Find the user to send request to (case-insensitive for SQLite)
    const receiver = await prisma.user.findFirst({
      where: { username: username.toLowerCase() }
    })

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't allow self-friending
    if (receiver.id === userId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 })
    }

    // Check for any existing relationship (pending or accepted) in either direction
    const existingRelationship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            AND: [
              { senderId: userId },
              { receiverId: receiver.id }
            ]
          },
          {
            AND: [
              { senderId: receiver.id },
              { receiverId: userId }
            ]
          }
        ]
      }
    })

    if (existingRelationship) {
      if (existingRelationship.status === 'PENDING') {
        return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 })
      } else if (existingRelationship.status === 'ACCEPTED') {
        return NextResponse.json({ error: "You're already friends" }, { status: 400 })
      }
      // If the relationship was REJECTED, we'll allow a new request
    }

    // Create new friendship request
    const friendship = await prisma.friendship.create({
      data: {
        senderId: userId,
        receiverId: receiver.id,
        status: 'PENDING'
      }
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiver.id,
        type: 'friend_request',
        message: `${session.user.username} sent you a friend request`,
        data: JSON.stringify({
          senderId: userId,
          senderUsername: session.user.username
        })
      }
    })

    return NextResponse.json({ message: 'Friend request sent', friendship })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 