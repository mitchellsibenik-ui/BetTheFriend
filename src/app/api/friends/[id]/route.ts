import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const friendId = params.id

    // Find all friendships between these users (in either direction)
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          {
            AND: [
              { senderId: userId },
              { receiverId: friendId }
            ]
          },
          {
            AND: [
              { senderId: friendId },
              { receiverId: userId }
            ]
          }
        ]
      }
    })

    if (friendships.length === 0) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
    }

    // Delete all friendships between these users
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          {
            AND: [
              { senderId: userId },
              { receiverId: friendId }
            ]
          },
          {
            AND: [
              { senderId: friendId },
              { receiverId: userId }
            ]
          }
        ]
      }
    })

    return NextResponse.json({ message: 'Friend removed successfully' })
  } catch (error) {
    console.error('Error removing friend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 