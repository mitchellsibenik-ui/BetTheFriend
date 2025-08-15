import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🔍 Checking for expired showdown rooms...')
    
    const now = new Date()
    
    // Find all open rooms where games have started
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

    if (expiredRooms.length === 0) {
      return NextResponse.json({ message: 'No expired rooms found' })
    }

    // Process each expired room
    for (const room of expiredRooms) {
      console.log(`Processing expired room: ${room.name} (${room.gameDate})`)
      
      // Check if any participants haven't made picks
      const participantsWithoutPicks = room.participants.filter(p => {
        // Count picks for this participant
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

    console.log('✅ Expired rooms processing completed')
    return NextResponse.json({ 
      message: `Processed ${expiredRooms.length} expired rooms`,
      expiredCount: expiredRooms.length
    })

  } catch (error) {
    console.error('❌ Error processing expired rooms:', error)
    return NextResponse.json(
      { error: 'Failed to process expired rooms' },
      { status: 500 }
    )
  }
} 