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

    const data = await request.json()
    console.log('Received game data:', data)

    const {
      homeTeam,
      awayTeam,
      startTime,
      sport
    } = data

    // Validate required fields
    if (!homeTeam || !awayTeam || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the game
    const game = await prisma.game.create({
      data: {
        homeTeam,
        awayTeam,
        startTime: new Date(startTime),
        status: 'SCHEDULED'
      }
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
} 