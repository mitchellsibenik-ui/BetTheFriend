import { NextResponse } from 'next/server'
import { settleCompletedBets } from '@/lib/betSettlement'

export async function POST() {
  try {
    console.log('🚀 [API] Manual bet settlement triggered')
    await settleCompletedBets()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Bet settlement process completed' 
    })
  } catch (error) {
    console.error('❌ [API] Error in bet settlement:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Settlement failed' 
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easy testing
export async function GET() {
  return POST()
} 