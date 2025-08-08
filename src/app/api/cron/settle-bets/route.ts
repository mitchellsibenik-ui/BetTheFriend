import { NextResponse } from 'next/server'
import { settleCompletedBets } from '@/lib/betSettlement'

// This endpoint can be called by external cron services like Vercel Cron or Upstash QStash
export async function GET() {
  try {
    console.log('🕐 [CRON] Manual bet settlement triggered')
    
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