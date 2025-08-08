import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gameId = params.id

    // Fetch game result from sports API
    const response = await fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?apiKey=${process.env.NEXT_PUBLIC_ODDS_API_KEY}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch game results')
    }

    const games = await response.json()
    const game = games.find((g: any) => g.id === gameId)

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Extract scores
    const homeScore = game.scores?.[0]?.score || 0
    const awayScore = game.scores?.[1]?.score || 0

    return NextResponse.json({
      gameId,
      homeScore,
      awayScore,
      completed: game.completed || false
    })
  } catch (error) {
    console.error('Error fetching game result:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game result' },
      { status: 500 }
    )
  }
} 