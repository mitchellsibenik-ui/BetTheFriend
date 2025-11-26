import { NextResponse } from 'next/server'
import { oddsApi } from '@/lib/api/odds'

export async function GET(
  request: Request,
  { params }: { params: { sport: string } }
) {
  try {
    const sport = params.sport.toLowerCase()
    console.log('Fetching odds for sport:', sport)
    
    const games = await oddsApi.getOdds(sport)
    console.log('Fetched games:', games.length)

    if (!games || !Array.isArray(games)) {
      console.error('Invalid API response:', games)
      return NextResponse.json(
        { error: 'Invalid API response format' },
        { status: 500 }
      )
    }

    // Sort games by start time
    const sortedGames = games.sort((a, b) => {
      const timeA = new Date(a.commence_time).getTime()
      const timeB = new Date(b.commence_time).getTime()
      return timeA - timeB
    })

    return NextResponse.json(sortedGames)
  } catch (error: any) {
    console.error('Error fetching odds:', error)
    console.error('Error message:', error.message)
    
    // Check if it's a quota/credits error
    const isQuotaError = error.message?.includes('quota') || 
                        error.message?.includes('credits') ||
                        error.message?.includes('rate limit')
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch odds',
        error_code: isQuotaError ? 'OUT_OF_USAGE_CREDITS' : 'UNKNOWN_ERROR'
      },
      { status: isQuotaError ? 429 : 500 }
    )
  }
} 