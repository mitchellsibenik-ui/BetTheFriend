import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = Number(session.user.id)

    const body = await req.json()
    const { wagerId, action } = body

    if (!wagerId || !action || !['ACCEPT', 'DENY'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Find the wager and verify the user is the receiver
    const wager = await prisma.wager.findUnique({
      where: { id: wagerId }
    })

    if (!wager) {
      return NextResponse.json({ error: 'Wager not found' }, { status: 404 })
    }

    if (wager.receiverId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (wager.status !== 'PENDING') {
      return NextResponse.json({ error: 'Wager is no longer pending' }, { status: 400 })
    }

    // Update the wager status
    const updatedWager = await prisma.wager.update({
      where: { id: wagerId },
      data: {
        status: action === 'ACCEPT' ? 'ACCEPTED' : 'DENIED'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, wager: updatedWager })
  } catch (error) {
    console.error('Error responding to wager:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 