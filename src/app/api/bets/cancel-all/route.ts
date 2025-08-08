import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update all active bets to DECLINED
    const result = await prisma.bet.updateMany({
      where: {
        status: 'ACTIVE'
      },
      data: {
        status: 'DECLINED'
      }
    })

    return NextResponse.json({ 
      message: 'All active bets have been cancelled',
      count: result.count 
    })
  } catch (error) {
    console.error('Error cancelling all bets:', error)
    return NextResponse.json(
      { error: 'Failed to cancel all bets' },
      { status: 500 }
    )
  }
} 