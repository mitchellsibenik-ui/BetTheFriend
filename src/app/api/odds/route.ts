import { NextResponse } from 'next/server'
import { oddsApi } from '@/lib/api/odds'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport parameter is required' },
        { status: 400 }
      )
    }

    // Validate sport parameter
    const validSports = ['nfl', 'nba', 'mlb', 'nhl', 'all']
    if (!validSports.includes(sport.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid sport parameter' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.NEXT_PUBLIC_ODDS_API_KEY) {
      console.warn('ODDS_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Odds API is not configured' },
        { status: 500 }
      )
    }

    console.log('Fetching odds for sport:', sport)
    const odds = await oddsApi.getOdds(sport)
    console.log('Odds API response:', odds)

    if (!odds || !Array.isArray(odds)) {
      console.error('Invalid API response:', odds)
      return NextResponse.json(
        { error: 'Invalid API response format' },
        { status: 500 }
      )
    }

    return NextResponse.json(odds)
  } catch (error: any) {
    console.error('Error fetching odds:', error)
    
    // Handle specific API errors
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'API rate limit exceeded' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch odds' },
      { status: 500 }
    )
  }
} 