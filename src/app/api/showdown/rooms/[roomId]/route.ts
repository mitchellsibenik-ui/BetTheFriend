import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const room = await prisma.showdownRoom.findUnique({
      where: {
        id: params.roomId
      },
      include: {
        creator: {
          select: {
            username: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                username: true
              }
            },
            picks: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user is authorized to view this room
    const isCreator = room.creatorId === session.user.id
    const isParticipant = room.participants.some(p => p.userId === session.user.id)

    if (!isCreator && !isParticipant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      id: room.id,
      name: room.name,
      creatorId: room.creatorId,
      entryFee: room.entryFee,
      status: room.status,
      participants: room.participants.map(p => ({
        id: p.id,
        userId: p.userId,
        username: p.user.username,
        score: p.score,
        picks: p.picks
      }))
    })
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 