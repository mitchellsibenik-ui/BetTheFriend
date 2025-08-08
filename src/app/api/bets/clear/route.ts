import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Update all active bets for the user to DECLINED
    const result = await prisma.bet.updateMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          { status: 'ACTIVE' }
        ]
      },
      data: {
        status: 'DECLINED'
      }
    })

    return NextResponse.json({ 
      message: 'Active bets cleared successfully',
      count: result.count 
    })
  } catch (error) {
    console.error('Error clearing active bets:', error)
    return NextResponse.json(
      { error: 'Failed to clear active bets' },
      { status: 500 }
    )
  }
} 