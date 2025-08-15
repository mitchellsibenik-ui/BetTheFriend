import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { picks } = await request.json()
    const { roomId } = params

    if (!picks || !Array.isArray(picks)) {
      return NextResponse.json(
        { error: 'Picks array is required' },
        { status: 400 }
      )
    }

    // Verify user is a participant in this room
    const participant = await prisma.showdownParticipant.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this room' },
        { status: 403 }
      )
    }

    // Verify room is still open for picks
    const room = await prisma.showdownRoom.findUnique({
      where: { id: roomId }
    })

    if (!room || room.status !== 'open') {
      return NextResponse.json(
        { error: 'Room is not open for picks' },
        { status: 400 }
      )
    }

    // Clear existing picks and create new ones
    await prisma.$transaction(async (tx) => {
      // Delete existing picks
      await tx.showdownPick.deleteMany({
        where: { participantId: participant.id }
      })

      // Create new picks
      for (const pick of picks) {
        await tx.showdownPick.create({
          data: {
            participantId: participant.id,
            gameId: pick.gameId,
            selectedTeam: pick.selectedTeam,
            type: 'moneyline'
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting picks:', error)
    return NextResponse.json(
      { error: 'Failed to submit picks' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = params

    // Get all picks for this room
    const picks = await prisma.showdownPick.findMany({
      where: {
        participant: {
          roomId
        }
      },
      include: {
        participant: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(picks)
  } catch (error) {
    console.error('Error fetching picks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch picks' },
      { status: 500 }
    )
  }
} 