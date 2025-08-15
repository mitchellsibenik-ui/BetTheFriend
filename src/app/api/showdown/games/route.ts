import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { oddsApi } from '@/lib/api/odds'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'baseball_mlb'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    console.log('Fetching games for sport:', sport, 'date:', date)

    // Map the sport key to the format expected by oddsApi
    const sportMap: { [key: string]: string } = {
      'baseball_mlb': 'mlb',
      'americanfootball_nfl': 'nfl',
      'basketball_nba': 'nba',
      'icehockey_nhl': 'nhl'
    }

    const mappedSport = sportMap[sport] || 'mlb'
    console.log('Mapped sport:', mappedSport)

    // Use the exact same pattern as the sportsbook
    const games = await oddsApi.getOdds(mappedSport)
    console.log('Fetched games from oddsApi:', games.length)

    if (!games || !Array.isArray(games)) {
      console.error('Invalid API response:', games)
      return NextResponse.json(
        { error: 'Invalid API response format' },
        { status: 500 }
      )
    }

    // Filter games for the specific date and format them
    const formattedGames = games
      .filter(game => {
        const gameDate = new Date(game.commence_time).toISOString().split('T')[0]
        return gameDate === date
      })
      .map(game => ({
        id: game.id,
        sport_key: sport,
        sport_title: sport.replace('_', ' ').toUpperCase(),
        commence_time: game.commence_time,
        home_team: game.home_team,
        away_team: game.away_team,
        moneyline: game.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h')?.outcomes || []
      }))

    console.log('Formatted games for date', date, ':', formattedGames.length)
    return NextResponse.json(formattedGames)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
} 