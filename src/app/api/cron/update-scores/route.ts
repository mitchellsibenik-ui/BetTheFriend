import { NextResponse } from 'next/server'
import { updateGameScores } from '@/lib/gameScoreUpdater'

// This endpoint updates game scores in the database
// Runs frequently to ensure scores are saved as soon as available
export async function GET() {
  try {
    console.log('🔄 [CRON] Game score update triggered')
    
    const result = await updateGameScores()
    
    return NextResponse.json({ 
      success: result.success, 
      message: 'Game score update completed',
      result 
    })
  } catch (error) {
    console.error('❌ [CRON] Error in game score update:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Game score update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  // Allow both GET and POST for flexibility
  return GET()
}

