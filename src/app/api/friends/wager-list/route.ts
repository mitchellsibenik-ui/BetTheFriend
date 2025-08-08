import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

export async function GET(request: Request) {
  try {
    // Get token from header
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = parseInt(decoded.userId)

    // Get all accepted friendships for the user
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'ACCEPTED'
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true
          }
        },
        user2: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    // Transform the data to get friend information
    const friends = friendships.map(friendship => {
      const friend = friendship.user1Id === userId ? friendship.user2 : friendship.user1
      return {
        id: friend.id,
        username: friend.username
      }
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error('Error fetching friends for wager:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 