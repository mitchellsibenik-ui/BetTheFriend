import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const betId = parseInt(params.id)
    const { gameResult } = await req.json()

    if (!gameResult) {
      return NextResponse.json({ error: 'Game result is required' }, { status: 400 })
    }

    // Find the bet
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        sender: true,
        receiver: true
      }
    })

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    if (bet.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Bet must be accepted before resolving' }, { status: 400 })
    }

    if (bet.resolved) {
      return NextResponse.json({ error: 'Bet is already resolved' }, { status: 400 })
    }

    // Determine winner based on bet type and game result
    let winnerId: number | null = null
    let loserId: number | null = null
    let result: 'win' | 'lose' | 'push' = 'push'

    const gameDetails = JSON.parse(bet.gameDetails)
    const { homeTeam, awayTeam } = gameDetails

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
      where: { id: betId },
      data: {
        status: 'SETTLED',
        resolved: true,
        resolvedAt: new Date(),
        winnerId,
        loserId,
        result
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            wins: true,
            losses: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            wins: true,
            losses: true
          }
        }
      }
    })

    // Update user stats if there's a winner
    if (winnerId && loserId) {
      await prisma.user.update({
        where: { id: winnerId },
        data: {
          wins: { increment: 1 },
          balance: { increment: bet.amount }
        }
      })

      await prisma.user.update({
        where: { id: loserId },
        data: {
          losses: { increment: 1 },
          balance: { decrement: bet.amount }
        }
      })
    }

    return NextResponse.json({ success: true, bet: updatedBet })
  } catch (error) {
    console.error('Error resolving bet:', error)
    return NextResponse.json(
      { error: 'Failed to resolve bet' },
      { status: 500 }
    )
  }
} 