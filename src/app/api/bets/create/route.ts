import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const {
      gameId,
      senderTeam,
      receiverTeam,
      betType,
      senderValue,
      receiverValue,
      senderOdds,
      receiverOdds,
      amount,
      receiverId,
      message,
      gameDetails,
      isLiveBet
    } = data

    // Validate required fields
    if (!gameId || !senderTeam || !receiverTeam || !betType || !amount || !receiverId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if game exists, if not create it
    let game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game && gameDetails) {
      game = await prisma.game.create({
        data: {
          id: gameId,
          homeTeam: gameDetails.home_team,
          awayTeam: gameDetails.away_team,
          startTime: new Date(gameDetails.commence_time),
          status: 'SCHEDULED'
        }
      })
    }

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found and could not be created' },
        { status: 400 }
      )
    }

    // Check if game has started
    const gameStartTime = new Date(game.startTime)
    const now = new Date()
    
    // Only block non-live bets on started games
    if (gameStartTime < now && !isLiveBet) {
      return NextResponse.json(
        { error: 'Cannot place bet on a game that has already started' },
        { status: 400 }
      )
    }

    // Check if user has enough balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    })

    if (!user || user.balance < parseInt(amount)) {
      return NextResponse.json(
        { error: 'Insufficient balance to place this bet' },
        { status: 400 }
      )
    }

    // Create the bet and deduct balance from sender
    const bet = await prisma.$transaction(async (tx) => {
      // Prepare values for storage
      const finalSenderValue = betType === 'overUnder' && senderOdds 
        ? `${senderValue}|${senderOdds}` 
        : betType === 'spread' && senderOdds
        ? `${senderValue}|${senderOdds}`
        : senderValue?.toString();
      
      const finalReceiverValue = betType === 'overUnder' && receiverOdds 
        ? `${receiverValue}|${receiverOdds}` 
        : betType === 'spread' && receiverOdds
        ? `${receiverValue}|${receiverOdds}`
        : receiverValue?.toString();

      // Create the bet
      const newBet = await tx.bet.create({
        data: {
          gameId: game.id,
          senderId: session.user.id,
          receiverId,
          senderTeam,
          receiverTeam,
          betType,
          senderValue: finalSenderValue,
          receiverValue: finalReceiverValue,
          amount: parseInt(amount),
          message,
          status: 'PENDING',
          gameDetails: JSON.stringify(gameDetails),
          resolved: false
        }
      })

      // Deduct balance from sender
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: parseInt(amount) } }
      })

      return newBet
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'bet',
        message: `${session.user.username} wants to bet $${amount} on ${gameDetails.away_team} vs ${gameDetails.home_team}`,
        data: JSON.stringify({
          betId: bet.id,
          gameDetails: {
            id: gameDetails.id,
            sport_key: gameDetails.sport_key,
            commence_time: gameDetails.commence_time,
            home_team: gameDetails.home_team,
            away_team: gameDetails.away_team,
            betType: gameDetails.betType,
            selectedTeam: gameDetails.selectedTeam,
            odds: gameDetails.odds,
            point: gameDetails.point,
            isLiveBet: gameDetails.isLiveBet
          }
        })
      }
    })

    return NextResponse.json(bet)
  } catch (error) {
    console.error('Error creating bet:', error)
    return NextResponse.json(
      { error: 'Failed to create bet' },
      { status: 500 }
    )
  }
} 