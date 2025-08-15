import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🔍 Checking for expired bets and showdown rooms...')
    
    const now = new Date()
    
    // 1. Process expired pending bets
    console.log('Processing expired pending bets...')
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

    // 2. Process expired showdown rooms
    console.log('Processing expired showdown rooms...')
    const expiredRooms = await prisma.showdownRoom.findMany({
      where: {
        status: 'open',
        gameDate: {
          lt: now.toISOString().split('T')[0] // Games that started before today
        }
      },
      include: {
        participants: {
          include: {
            picks: true
          }
        }
      }
    })

    console.log(`Found ${expiredRooms.length} expired rooms`)

    // Process each expired room
    for (const room of expiredRooms) {
      console.log(`Processing expired room: ${room.name} (${room.gameDate})`)
      
      // Check if any participants haven't made picks
      const participantsWithoutPicks = room.participants.filter(p => {
        return p.picks.length === 0
      })

      if (participantsWithoutPicks.length > 0) {
        console.log(`Room ${room.name} has ${participantsWithoutPicks.length} participants without picks`)
        
        // Mark room as expired and refund entry fees
        await prisma.$transaction(async (tx) => {
          // Update room status to expired
          await tx.showdownRoom.update({
            where: { id: room.id },
            data: { status: 'expired' }
          })

          // Refund entry fees to participants without picks
          for (const participant of participantsWithoutPicks) {
            await tx.user.update({
              where: { id: participant.userId },
              data: {
                balance: {
                  increment: room.entryFee
                }
              }
            })
            
            console.log(`Refunded $${room.entryFee} to participant ${participant.userId}`)
          }
        })
      } else {
        // All participants have picks, mark as in_progress
        await prisma.showdownRoom.update({
          where: { id: room.id },
          data: { status: 'in_progress' }
        })
        console.log(`Room ${room.name} marked as in_progress (all picks submitted)`)
      }
    }

    console.log('✅ Expiration processing completed')
    return NextResponse.json({ 
      message: `Processed ${expiredBets.length} expired bets and ${expiredRooms.length} expired rooms`,
      expiredBetsCount: expiredBets.length,
      expiredRoomsCount: expiredRooms.length
    })

  } catch (error) {
    console.error('❌ Error processing expired items:', error)
    return NextResponse.json(
      { error: 'Failed to process expired items' },
      { status: 500 }
    )
  }
} 