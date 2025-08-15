import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface Game {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    markets: Array<{
      key: string
      outcomes: Array<{
        name: string
        price: number
      }>
    }>
  }>
}

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

    // Fetch games from The Odds API
    const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY
    if (!apiKey) {
      console.error('API key not configured')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    console.log('API key found, length:', apiKey.length)

    const apiUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${apiKey}&regions=us&markets=moneyline&dateFormat=iso&oddsFormat=american&date=${date}`
    console.log('Fetching from URL:', apiUrl)

    const response = await fetch(apiUrl, { cache: 'no-store' })

    console.log('API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API response error:', errorText)
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const games: Game[] = await response.json()
    console.log('Received games from API:', games.length)

    // Filter games for the specific date and format them
    const formattedGames = games
      .filter(game => {
        const gameDate = new Date(game.commence_time).toISOString().split('T')[0]
        return gameDate === date
      })
      .map(game => ({
        id: game.id,
        sport_key: game.sport_key,
        sport_title: game.sport_title,
        commence_time: game.commence_time,
        home_team: game.home_team,
        away_team: game.away_team,
        moneyline: game.bookmakers[0]?.markets.find(m => m.key === 'moneyline')?.outcomes || []
      }))

    console.log('Formatted games:', formattedGames.length)
    return NextResponse.json(formattedGames)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
} 