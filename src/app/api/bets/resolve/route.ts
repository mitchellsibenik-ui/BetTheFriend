import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all active bets
    const activeBets = await prisma.bet.findMany({
      where: {
        status: 'ACCEPTED',
        resolved: false
      },
      include: {
        sender: true,
        receiver: true
      }
    })

    const resolvedBets = []

    // Process each active bet
    for (const bet of activeBets) {
      try {
        // Check if gameDetails exists
        if (!bet.gameDetails) {
          console.log(`Skipping bet ${bet.id} - no game details`)
          continue
        }
        
        const gameDetails = JSON.parse(bet.gameDetails)
        const gameId = gameDetails.gameId

        // Fetch game result
        const response = await fetch(`/api/games/${gameId}/result`)
        if (!response.ok) {
          console.error(`Failed to fetch result for game ${gameId}`)
          continue
        }

        const gameResult = await response.json()
        if (!gameResult.completed) {
          continue
        }

        // Determine winner based on bet type
        let winnerId: string | null = null
        let loserId: string | null = null
        let result: 'win' | 'lose' | 'push' = 'push'

        switch (bet.betType) {
          case 'MONEYLINE': {
            const homeScore = gameResult.homeScore
            const awayScore = gameResult.awayScore
            
            if (homeScore > awayScore) {
              winnerId = bet.senderTeam === 'home' ? bet.senderId : bet.receiverId
              loserId = bet.senderTeam === 'home' ? bet.receiverId : bet.senderId
              result = 'win'
            } else if (awayScore > homeScore) {
              winnerId = bet.senderTeam === 'away' ? bet.senderId : bet.receiverId
              loserId = bet.senderTeam === 'away' ? bet.receiverId : bet.senderId
              result = 'win'
            }
            break
          }
          case 'SPREAD': {
            const homeScore = gameResult.homeScore
            const awayScore = gameResult.awayScore
            
            if (!bet.senderValue) {
              console.log(`Skipping bet ${bet.id} - no spread value`)
              continue
            }
            
            const spread = parseFloat(bet.senderValue)
            
            const homeWithSpread = homeScore + spread
            if (homeWithSpread > awayScore) {
              winnerId = bet.senderTeam === 'home' ? bet.senderId : bet.receiverId
              loserId = bet.senderTeam === 'home' ? bet.receiverId : bet.senderId
              result = 'win'
            } else if (homeWithSpread < awayScore) {
              winnerId = bet.senderTeam === 'away' ? bet.senderId : bet.receiverId
              loserId = bet.senderTeam === 'away' ? bet.receiverId : bet.senderId
              result = 'win'
            }
            break
          }
          case 'TOTAL': {
            const totalScore = gameResult.homeScore + gameResult.awayScore
            
            if (!bet.senderValue) {
              console.log(`Skipping bet ${bet.id} - no total value`)
              continue
            }
            
            const overUnder = parseFloat(bet.senderValue)
            
            if (totalScore > overUnder) {
              winnerId = bet.senderTeam === 'over' ? bet.senderId : bet.receiverId
              loserId = bet.senderTeam === 'over' ? bet.receiverId : bet.senderId
              result = 'win'
            } else if (totalScore < overUnder) {
              winnerId = bet.senderTeam === 'under' ? bet.senderId : bet.receiverId
              loserId = bet.senderTeam === 'under' ? bet.receiverId : bet.senderId
              result = 'win'
            }
            break
          }
        }

        // Update bet with result
        const updatedBet = await prisma.bet.update({
          where: { id: bet.id },
          data: {
            status: 'SETTLED',
            resolved: true,
            resolvedAt: new Date(),
            winnerId,
            loserId,
            result
          }
        })

        // Update user stats if there's a winner
        if (winnerId && loserId) {
          await prisma.user.update({
            where: { id: winnerId },
            data: {
              balance: { increment: bet.amount }
            }
          })

          await prisma.user.update({
            where: { id: loserId },
            data: {
              balance: { decrement: bet.amount }
            }
          })
        }

        resolvedBets.push(updatedBet)
      } catch (error) {
        console.error(`Error resolving bet ${bet.id}:`, error)
      }
    }

    return NextResponse.json({ success: true, resolvedBets })
  } catch (error) {
    console.error('Error resolving bets:', error)
    return NextResponse.json(
      { error: 'Failed to resolve bets' },
      { status: 500 }
    )
  }
} 