import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { manualSettlement } from '@/lib/cron'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Manual bet settlement triggered by:', session.user.username)
    await manualSettlement()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Automated bet settlement completed successfully',
      note: 'This system now fetches real game results from the sports API and grades bets automatically'
    })
  } catch (error) {
    console.error('Error in manual bet settlement:', error)
    return NextResponse.json({ error: 'Failed to settle bets' }, { status: 500 })
  }
} 