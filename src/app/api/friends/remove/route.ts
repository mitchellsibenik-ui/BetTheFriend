import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string }
    const userId = parseInt(decoded.userId)

    const { friendId } = await request.json()
    if (typeof friendId !== 'number') {
      return NextResponse.json({ error: 'Invalid friend ID' }, { status: 400 })
    }

    // Find the friendship in either direction
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            AND: [
              { user1Id: userId },
              { user2Id: friendId },
              { status: 'ACCEPTED' }
            ]
          },
          {
            AND: [
              { user1Id: friendId },
              { user2Id: userId },
              { status: 'ACCEPTED' }
            ]
          }
        ]
      }
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
    }

    // Delete the friendship
    await prisma.friendship.delete({
      where: { id: friendship.id }
    })

    return NextResponse.json({ message: 'Friend removed successfully' })
  } catch (error) {
    console.error('Error removing friend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 