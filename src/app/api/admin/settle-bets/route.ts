import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Calculate sportsbook payout based on odds
function calculateSportsbookPayout(odds: number, stake: number): number {
  if (odds > 0) {
    return (stake * odds) / 100
  } else {
    return (stake * 100) / Math.abs(odds)
  }
}

// Parse stored value to get line and odds
function parseValueAndOdds(value: string): { line: number; odds: number } {
  if (!value) return { line: 0, odds: -110 }
  const parts = value.split('|')
  const line = parseFloat(parts[0])
  const odds = parts[1] ? parseInt(parts[1]) : -110
  return { line, odds }
}

// Grade a moneyline bet
function gradeMoneylineBet(
  bet: any,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string
) {
  const senderOdds = parseInt(bet.senderValue) || -110
  const receiverOdds = parseInt(bet.receiverValue) || -110
  
  let actualWinner: string
  if (homeScore > awayScore) {
    actualWinner = homeTeam
  } else if (awayScore > homeScore) {
    actualWinner = awayTeam
  } else {
    return {
      result: 'push',
      payout: bet.amount,
      description: `Game tied ${homeScore}-${awayScore}, bet pushed`
    }
  }
  
  if (bet.senderTeam === actualWinner) {
    const winnings = calculateSportsbookPayout(senderOdds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.senderId,
      loserId: bet.receiverId,
      payout: bet.amount + winnings,
      description: `${bet.senderTeam} won ${homeScore}-${awayScore}`
    }
  } else {
    const winnings = calculateSportsbookPayout(receiverOdds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.receiverId,
      loserId: bet.senderId,
      payout: bet.amount + winnings,
      description: `${bet.receiverTeam} won ${homeScore}-${awayScore}`
    }
  }
}

// Grade a spread bet
function gradeSpreadBet(
  bet: any,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string
) {
  const senderData = parseValueAndOdds(bet.senderValue)
  const receiverData = parseValueAndOdds(bet.receiverValue)
  
  const senderPickedHome = bet.senderTeam === homeTeam
  const receiverPickedAway = bet.receiverTeam === awayTeam
  
  let senderScore = senderPickedHome ? homeScore + senderData.line : awayScore + senderData.line
  let receiverScore = receiverPickedAway ? awayScore + receiverData.line : homeScore + receiverData.line
  
  if (senderScore > receiverScore) {
    const winnings = calculateSportsbookPayout(senderData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.senderId,
      loserId: bet.receiverId,
      payout: bet.amount + winnings,
      description: `${bet.senderTeam} covered the spread`
    }
  } else if (receiverScore > senderScore) {
    const winnings = calculateSportsbookPayout(receiverData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.receiverId,
      loserId: bet.senderId,
      payout: bet.amount + winnings,
      description: `${bet.receiverTeam} covered the spread`
    }
  } else {
    return {
      result: 'push',
      payout: bet.amount,
      description: `Spread push: ${bet.senderTeam} vs ${bet.receiverTeam}`
    }
  }
}

// Grade an over/under bet
function gradeOverUnderBet(
  bet: any,
  homeScore: number,
  awayScore: number
) {
  const senderData = parseValueAndOdds(bet.senderValue)
  const receiverData = parseValueAndOdds(bet.receiverValue)
  
  const totalScore = homeScore + awayScore
  const senderPickedOver = bet.senderTeam.toLowerCase().includes('over')
  const receiverPickedUnder = bet.receiverTeam.toLowerCase().includes('under')
  
  const senderLine = senderData.line
  const receiverLine = receiverData.line
  
  if (senderPickedOver && totalScore > senderLine) {
    const winnings = calculateSportsbookPayout(senderData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.senderId,
      loserId: bet.receiverId,
      payout: bet.amount + winnings,
      description: `Over ${senderLine}: Total was ${totalScore}`
    }
  } else if (receiverPickedUnder && totalScore < receiverLine) {
    const winnings = calculateSportsbookPayout(receiverData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.receiverId,
      loserId: bet.senderId,
      payout: bet.amount + winnings,
      description: `Under ${receiverLine}: Total was ${totalScore}`
    }
  } else if (totalScore === senderLine || totalScore === receiverLine) {
    return {
      result: 'push',
      payout: bet.amount,
      description: `Total push: game total exactly ${totalScore}`
    }
  } else {
    if (senderPickedOver && totalScore < senderLine) {
      const winnings = calculateSportsbookPayout(receiverData.odds, bet.amount)
      return {
        result: 'win',
        winnerId: bet.receiverId,
        loserId: bet.senderId,
        payout: bet.amount + winnings,
        description: `Under ${receiverLine}: Total was ${totalScore}`
      }
    } else {
      const winnings = calculateSportsbookPayout(senderData.odds, bet.amount)
      return {
        result: 'win',
        winnerId: bet.senderId,
        loserId: bet.receiverId,
        payout: bet.amount + winnings,
        description: `Over ${senderLine}: Total was ${totalScore}`
      }
    }
  }
}

// Main grading function
function gradeBet(
  bet: any,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string
) {
  switch (bet.betType) {
    case 'moneyline':
      return gradeMoneylineBet(bet, homeScore, awayScore, homeTeam, awayTeam)
    case 'spread':
      return gradeSpreadBet(bet, homeScore, awayScore, homeTeam, awayTeam)
    case 'overUnder':
      return gradeOverUnderBet(bet, homeScore, awayScore)
    default:
      throw new Error(`Unknown bet type: ${bet.betType}`)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, allow any authenticated user (you can restrict to admins later)
    const { gameId, homeScore, awayScore } = await request.json()

    if (!gameId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: 'gameId, homeScore, and awayScore are required' },
        { status: 400 }
      )
    }

    // Find all active bets for this game
    const activeBets = await prisma.bet.findMany({
      where: {
        gameId: gameId,
        OR: [
          { status: 'ACTIVE' },
          { status: 'ACCEPTED' }
        ],
        resolved: false
      },
      include: {
        sender: true,
        receiver: true
      }
    })

    if (activeBets.length === 0) {
      return NextResponse.json({ message: 'No active bets found for this game' })
    }

    // Get game details from first bet
    const gameDetails = JSON.parse(activeBets[0].gameDetails || '{}')
    const homeTeam = gameDetails.home_team
    const awayTeam = gameDetails.away_team

    const results = []

    // Grade each bet
    for (const bet of activeBets) {
      try {
        const betResult = gradeBet(bet, homeScore, awayScore, homeTeam, awayTeam)

        if (betResult.result === 'push') {
          await prisma.$transaction([
            prisma.bet.update({
              where: { id: bet.id },
              data: {
                status: 'RESOLVED',
                resolved: true,
                resolvedAt: new Date(),
                result: betResult.description
              }
            }),
            prisma.user.update({
              where: { id: bet.senderId },
              data: { balance: { increment: bet.amount } }
            }),
            prisma.user.update({
              where: { id: bet.receiverId },
              data: { balance: { increment: bet.amount } }
            })
          ])
        } else {
          await prisma.$transaction([
            prisma.bet.update({
              where: { id: bet.id },
              data: {
                status: 'RESOLVED',
                resolved: true,
                resolvedAt: new Date(),
                winnerId: betResult.winnerId,
                loserId: betResult.loserId,
                result: betResult.description
              }
            }),
            prisma.user.update({
              where: { id: betResult.winnerId! },
              data: {
                balance: { increment: betResult.payout },
                wins: { increment: 1 }
              }
            }),
            prisma.user.update({
              where: { id: betResult.loserId! },
              data: { losses: { increment: 1 } }
            })
          ])
        }

        results.push({
          betId: bet.id,
          result: betResult.result,
          description: betResult.description,
          payout: betResult.payout
        })
      } catch (error) {
        console.error(`Error grading bet ${bet.id}:`, error)
        results.push({
          betId: bet.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Graded ${results.length} bet(s)`,
      results
    })
  } catch (error) {
    console.error('Error in manual bet settlement:', error)
    return NextResponse.json(
      { error: 'Failed to settle bets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

