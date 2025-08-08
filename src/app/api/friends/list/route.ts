import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get all friendships for the user
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            createdAt: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            createdAt: true
          }
        }
      }
    })

    // Get all resolved bets to calculate head-to-head stats
    const resolvedBets = await prisma.bet.findMany({
      where: { 
        status: 'RESOLVED',
        resolved: true,
        winnerId: { not: null },
        loserId: { not: null }
      },
      select: {
        winnerId: true,
        loserId: true,
        amount: true
      }
    })

    // Separate accepted friends and pending requests
    const friends = friendships
      .filter(friendship => friendship.status === 'ACCEPTED')
      .map(friendship => {
        const friend = friendship.senderId === userId ? friendship.receiver : friendship.sender
        
        // Calculate head-to-head stats between current user and this friend
        const headToHeadBets = resolvedBets.filter(bet => 
          (bet.winnerId === userId && bet.loserId === friend.id) ||
          (bet.winnerId === friend.id && bet.loserId === userId)
        )

        let wins = 0
        let losses = 0
        let profit = 0

        headToHeadBets.forEach(bet => {
          if (bet.winnerId === userId) {
            wins++
            profit += bet.amount * 2 // Winner gets both amounts
          } else {
            losses++
            profit -= bet.amount // Loser loses their amount
          }
        })

        return {
          id: friend.id,
          username: friend.username,
          createdAt: friend.createdAt,
          status: friendship.status,
          stats: {
            wins,
            losses,
            profit,
            totalBets: wins + losses
          }
        }
      })

    const pendingRequests = friendships
      .filter(friendship => 
        friendship.status === 'PENDING' && 
        friendship.receiverId === userId // Only show requests where current user is the receiver
      )
      .map(friendship => ({
        id: friendship.id,
        status: friendship.status,
        sender: friendship.sender,
        receiver: friendship.receiver
      }))

    return NextResponse.json({ friends, pendingRequests })
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 