import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const resolvedParams = await Promise.resolve(params)
    const betId = resolvedParams.id
    const { action } = await req.json()

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Find the bet and verify the user is the receiver
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        game: true
      }
    })

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    if (bet.receiverId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (bet.status !== 'PENDING') {
      return NextResponse.json({ error: 'Bet is no longer pending' }, { status: 400 })
    }

    // Check if game has started before allowing acceptance
    if (action === 'accept') {
      const now = new Date()
      let gameStartTime: Date | null = null

      // Try to get start time from game record first
      if (bet.game?.startTime) {
        gameStartTime = new Date(bet.game.startTime)
      } else if (bet.gameDetails) {
        // Fallback to gameDetails if game record doesn't have startTime
        try {
          const gameDetails = JSON.parse(bet.gameDetails)
          if (gameDetails.commence_time) {
            gameStartTime = new Date(gameDetails.commence_time)
          }
        } catch (e) {
          console.error('Error parsing gameDetails:', e)
        }
      }

      // Only block non-live bets on started games
      if (gameStartTime && gameStartTime < now && !bet.isLiveBet) {
        const gameStartTimeStr = gameStartTime.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
        return NextResponse.json(
          { 
            error: `Cannot accept bet on a game that has already started. Game started at ${gameStartTimeStr}.` 
          },
          { status: 400 }
        )
      }
    }

    // Handle bet acceptance/decline with balance updates
    const updatedBet = await prisma.$transaction(async (tx) => {
      if (action === 'accept') {
        // Check if receiver has enough balance
        const receiver = await tx.user.findUnique({
          where: { id: userId },
          select: { balance: true }
        })

        if (!receiver || receiver.balance < bet.amount) {
          throw new Error('Insufficient balance to accept this bet')
        }

        // Deduct balance from receiver
        await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: bet.amount } }
        })

        // Update bet status to ACTIVE
        return await tx.bet.update({
          where: { id: betId },
          data: { status: 'ACTIVE' },
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
            }
          }
        })
      } else {
        // Decline the bet - refund the sender
        await tx.user.update({
          where: { id: bet.senderId },
          data: { balance: { increment: bet.amount } }
        })

        // Update bet status to DECLINED
        return await tx.bet.update({
          where: { id: betId },
          data: { status: 'DECLINED' },
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
            }
          }
        })
      }
    })

    // Mark the notification as read for this bet
    await prisma.notification.updateMany({
      where: {
        userId: userId,
        type: 'bet',
        data: {
          contains: `"betId":"${betId}"`
        }
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({ success: true, bet: updatedBet })
  } catch (error) {
    console.error('Error responding to bet:', error)
    return NextResponse.json(
      { error: 'Failed to respond to bet' },
      { status: 500 }
    )
  }
} 