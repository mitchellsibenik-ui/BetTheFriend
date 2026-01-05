import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface RoomResponse {
  id: string
  name: string
  creator: string
  participants: Array<{
    username: string
    picks: Array<{
      id: string
      gameId: string
      selectedTeam: string
      type: string
      isCorrect: boolean | null
    }>
    score: number
  }>
  entryFee: number
  status: string
  createdAt: Date
}

interface RoomWithRelations {
  id: string
  name: string
  creator: {
    username: string
  }
  participants: Array<{
    user: {
      username: string
    }
    picks: Array<{
      id: string
      gameId: string
      selectedTeam: string
      type: string
      isCorrect: boolean | null
    }>
    score: number
  }>
  entryFee: number
  status: string
  createdAt: Date
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || undefined

    const rooms = await prisma.showdownRoom.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: search } },
              { creator: { username: { contains: search } } }
            ]
          },
          {
            OR: [
              { creatorId: session.user.id },
              {
                participants: {
                  some: {
                    userId: session.user.id
                  }
                }
              }
            ]
          },
          ...(status ? [{ status }] : [])
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, entryFee, sport, sportTitle, gameDate } = await request.json()

    console.log('[Create Room] Received data:', { name, entryFee, sport, sportTitle, gameDate })

    if (!name || !entryFee || !sport || !sportTitle || !gameDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate entry fee
    if (entryFee <= 0) {
      return NextResponse.json(
        { error: 'Entry fee must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if user has enough balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    })

    if (!user || user.balance < entryFee) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Validate that games exist for the selected date and sport
    try {
      const { oddsApi } = await import('@/lib/api/odds')
      
      // Map the sport key to the format expected by oddsApi
      const sportMap: { [key: string]: string } = {
        'baseball_mlb': 'mlb',
        'americanfootball_nfl': 'nfl',
        'americanfootball_ncaaf': 'ncaaf',
        'basketball_nba': 'nba',
        'icehockey_nhl': 'nhl'
      }

      const mappedSport = sportMap[sport] || 'mlb'
      const games = await oddsApi.getOdds(mappedSport)
      
      if (!games || !Array.isArray(games)) {
        return NextResponse.json(
          { error: 'Failed to fetch games data. Please try again later.' },
          { status: 500 }
        )
      }

      // Filter games for the specific date
      const dateFilteredGames = games.filter(game => {
        if (!game.commence_time) return false
        const gameDateStr = game.commence_time.split('T')[0]
        return gameDateStr === gameDate
      })

      if (dateFilteredGames.length === 0) {
        // Get available dates to help user
        const uniqueDates = new Set(games.map(g => g.commence_time?.split('T')[0]).filter(Boolean))
        const availableDates = Array.from(uniqueDates).sort().slice(0, 5) // Show next 5 available dates
        
        return NextResponse.json(
          { 
            error: `No games found for ${sportTitle} on ${gameDate}. Please try selecting a different date.`,
            availableDates: availableDates.length > 0 ? availableDates : null
          },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Error validating games:', error)
      // Don't block room creation if validation fails - let it proceed
      // The user will see the error when they try to view the room
    }

    // Create room and add creator as first participant
    const room = await prisma.$transaction(async (tx) => {
      // Deduct entry fee from creator
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: entryFee } }
      })

      // Create room
      const newRoom = await tx.showdownRoom.create({
        data: {
          name,
          entryFee,
          sport,
          sportTitle,
          gameDate, // Store as YYYY-MM-DD string
          creatorId: session.user.id
        }
      })
      
      console.log('[Create Room] Created room with gameDate:', newRoom.gameDate)

      // Add creator as first participant
      await tx.showdownParticipant.create({
        data: {
          userId: session.user.id,
          roomId: newRoom.id,
          score: 0
        }
      })

      return newRoom
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
} 