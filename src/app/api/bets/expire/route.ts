import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🔍 Checking for expired pending bets...')
    
    const now = new Date()
    
    // Find all pending bets where games have started
    const expiredBets = await prisma.bet.findMany({
      where: {
        status: 'PENDING',
        game: {
          startTime: {
            lt: now // Games that started before now
          }
        }
      },
      include: {
        game: true,
        sender: true,
        receiver: true
      }
    })

    console.log(`Found ${expiredBets.length} expired bets`)

    if (expiredBets.length === 0) {
      return NextResponse.json({ message: 'No expired bets found' })
    }

    // Process each expired bet
    for (const bet of expiredBets) {
      console.log(`Processing expired bet: ${bet.id} for game ${bet.game.homeTeam} vs ${bet.game.awayTeam}`)
      
      // Mark bet as expired and refund the sender
      await prisma.$transaction(async (tx) => {
        // Update bet status to expired
        await tx.bet.update({
          where: { id: bet.id },
          data: { 
            status: 'EXPIRED',
            result: 'Game started before bet was accepted - automatically expired'
          }
        })

        // Refund the sender's amount
        await tx.user.update({
          where: { id: bet.senderId },
          data: {
            balance: {
              increment: bet.amount
            }
          }
        })
        
        console.log(`Refunded $${bet.amount} to sender ${bet.sender.username}`)
      })
    }

    console.log('✅ Expired bets processing completed')
    return NextResponse.json({ 
      message: `Processed ${expiredBets.length} expired bets`,
      expiredCount: expiredBets.length
    })

  } catch (error) {
    console.error('❌ Error processing expired bets:', error)
    return NextResponse.json(
      { error: 'Failed to process expired bets' },
      { status: 500 }
    )
  }
} 