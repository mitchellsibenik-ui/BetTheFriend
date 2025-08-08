import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverId, amount, terms } = await request.json()

    // Validate input
    if (!receiverId || !amount || !terms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: Number(receiverId) }
    })

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      )
    }

    // Check if users are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: Number(session.user.id), user2Id: Number(receiverId) },
          { user1Id: Number(receiverId), user2Id: Number(session.user.id) }
        ],
        status: 'ACCEPTED'
      }
    })

    if (!friendship) {
      return NextResponse.json(
        { error: 'You can only send wagers to friends' },
        { status: 403 }
      )
    }

    // Create the wager
    const wager = await prisma.wager.create({
      data: {
        senderId: Number(session.user.id),
        receiverId: Number(receiverId),
        amount: Number(amount),
        terms,
        status: 'PENDING',
        eventId: 'manual' // For manual wagers between friends
      }
    })

    return NextResponse.json({ wager })
  } catch (error) {
    console.error('Error creating wager:', error)
    return NextResponse.json(
      { error: 'Failed to create wager' },
      { status: 500 }
    )
  }
} 