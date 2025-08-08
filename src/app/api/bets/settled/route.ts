import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch settled bets where user is either sender or receiver
    const settledBets = await prisma.bet.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          { status: 'RESOLVED' }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true
          }
        },
        winner: {
          select: {
            id: true,
            username: true
          }
        },
        loser: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        resolvedAt: 'desc'
      }
    })

    return NextResponse.json({ bets: settledBets })
  } catch (error) {
    console.error('Error fetching settled bets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settled bets' },
      { status: 500 }
    )
  }
} 