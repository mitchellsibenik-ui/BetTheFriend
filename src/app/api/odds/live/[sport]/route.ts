import { NextResponse } from 'next/server'
import { oddsApi } from '@/lib/api/odds'

// Map frontend sport keys to API sport keys
const SPORT_KEY_MAP: { [key: string]: string } = {
  'nfl': 'americanfootball_nfl',
  'nba': 'basketball_nba',
  'mlb': 'baseball_mlb',
  'nhl': 'icehockey_nhl',
  'all': 'all'
}

export async function GET(
  request: Request,
  { params }: { params: { sport: string } }
) {
  try {
    const sport = params.sport.toLowerCase()
    console.log('Fetching live games for sport:', sport)
    
    const games = await oddsApi.getOdds(sport)
    console.log('Total games fetched:', games.length)

    if (!games || !Array.isArray(games)) {
      console.error('Invalid API response:', games)
      return NextResponse.json(
        { error: 'Invalid API response format' },
        { status: 500 }
      )
    }

    // Filter for live games
    const liveGames = games.filter(game => {
      const gameTime = new Date(game.commence_time)
      const now = new Date()
      // Consider a game live if it started within the last 4 hours and hasn't ended
      const isLive = gameTime <= now && gameTime > new Date(now.getTime() - 4 * 60 * 60 * 1000)
      return isLive
    })

    console.log('Live games found:', liveGames.length)
    return NextResponse.json(liveGames)
  } catch (error) {
    console.error('Error fetching live games:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch live games' },
      { status: 500 }
    )
  }
} 