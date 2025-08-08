import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch all users with their basic stats
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        balance: true,
        wins: true,
        losses: true,
      },
      orderBy: [
        { balance: 'desc' },
        { wins: 'desc' },
        { losses: 'asc' }
      ]
    })

    // Get all resolved bets to calculate head-to-head records
    const resolvedBets = await prisma.bet.findMany({
      where: { 
        status: 'RESOLVED',
        resolved: true,
        winnerId: { not: null },
        loserId: { not: null }
      },
      select: {
        winnerId: true,
        loserId: true
      }
    })

    // Calculate head-to-head records for each user
    const usersWithHeadToHead = users.map(user => {
      // Find all bets where this user was involved
      const userBets = resolvedBets.filter(bet => 
        bet.winnerId === user.id || bet.loserId === user.id
      )

      // Calculate head-to-head wins and losses
      let headToHeadWins = 0
      let headToHeadLosses = 0

      userBets.forEach(bet => {
        if (bet.winnerId === user.id) {
          headToHeadWins++
        } else if (bet.loserId === user.id) {
          headToHeadLosses++
        }
      })

      const totalGames = headToHeadWins + headToHeadLosses
      const winRate = totalGames > 0 ? (headToHeadWins / totalGames) * 100 : 0
      
      return {
        id: user.id,
        username: user.username,
        balance: user.balance,
        wins: headToHeadWins,
        losses: headToHeadLosses,
        winRate,
        totalGames
      }
    })

    // Sort by head-to-head win rate, then by balance
    const sortedUsers = usersWithHeadToHead.sort((a, b) => {
      if (a.totalGames === 0 && b.totalGames === 0) {
        return b.balance - a.balance
      }
      if (a.totalGames === 0) return 1
      if (b.totalGames === 0) return -1
      
      if (a.winRate !== b.winRate) {
        return b.winRate - a.winRate
      }
      return b.balance - a.balance
    })

    return NextResponse.json({ users: sortedUsers })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
} 