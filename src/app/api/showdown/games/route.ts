import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Hardcoded games for testing
const games = [
  {
    id: '1',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'San Francisco 49ers',
    startTime: '2024-02-11T23:30:00Z',
    sport: 'Football',
    league: 'NFL'
  },
  {
    id: '2',
    homeTeam: 'Dallas Cowboys',
    awayTeam: 'Green Bay Packers',
    startTime: '2024-02-12T00:30:00Z',
    sport: 'Football',
    league: 'NFL'
  },
  {
    id: '3',
    homeTeam: 'Buffalo Bills',
    awayTeam: 'Baltimore Ravens',
    startTime: '2024-02-12T01:30:00Z',
    sport: 'Football',
    league: 'NFL'
  }
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
} 