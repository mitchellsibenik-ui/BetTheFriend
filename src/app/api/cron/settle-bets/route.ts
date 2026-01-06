import { NextResponse } from 'next/server'
import { settleCompletedBets } from '@/lib/betSettlement'
import { updateGameScores } from '@/lib/gameScoreUpdater'

// This endpoint can be called by external cron services like Vercel Cron or Upstash QStash
export async function GET() {
  try {
    console.log('🕐 [CRON] Bet settlement triggered')
    
    // First, update game scores to ensure we have the latest data
    console.log('🔄 [CRON] Updating game scores before settlement...')
    await updateGameScores()
    
    // Then run settlement
    const result = await settleCompletedBets()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Bet settlement completed successfully',
      result 
    })
  } catch (error) {
    console.error('❌ [CRON] Error in bet settlement:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bet settlement failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  // Allow both GET and POST for flexibility with different cron services
  return GET()
} 