import axios from 'axios'
import { prisma } from '@/lib/prisma'

const SPORTS_ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY
const SPORTS_ODDS_API_URL = 'https://api.the-odds-api.com/v4'

// Map our sport keys to the API's expected format
const SPORT_KEY_MAP: { [key: string]: string } = {
  'nfl': 'americanfootball_nfl',
  'nba': 'basketball_nba',
  'mlb': 'baseball_mlb',
  'nhl': 'icehockey_nhl',
  'all': 'all'
}

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface Sport {
  key: string
  group: string
  title: string
  details: string
  active: boolean
}

export interface Event {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Bookmaker[]
  scores?: {
    home: number
    away: number
  }
  status: 'scheduled' | 'live' | 'finished'
  period?: string
  clock?: string
}

export interface Bookmaker {
  key: string
  title: string
  markets: Market[]
}

export interface Market {
  key: string
  outcomes: Outcome[]
}

export interface Outcome {
  name: string
  price: number
  point?: number
}

export const oddsApi = {
  getSports: async (): Promise<Sport[]> => {
    console.log('Fetching sports list')
    try {
      const response = await axios.get(`${SPORTS_ODDS_API_URL}/sports`, {
        params: {
          apiKey: SPORTS_ODDS_API_KEY
        }
      })
      console.log('Sports API response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching sports:', error)
      return []
    }
  },

  getOdds: async (sport: string): Promise<Event[]> => {
    try {
      if (sport === 'all') {
        // Fetch all sports with staggered parallel requests to avoid rate limits but be faster
        const allOdds: Event[] = []
        const sportsToFetch = Object.entries(SPORT_KEY_MAP).filter(([_, apiKey]) => apiKey !== 'all')
        
        // Use Promise.allSettled with staggered starts
        const promises = sportsToFetch.map(async ([_, apiKey], index) => {
          // Stagger requests by 200ms each to avoid rate limits
          await delay(index * 200)
          try {
            return await oddsApi.getOddsForSport(apiKey)
          } catch (error) {
            console.error(`Error fetching odds for ${apiKey}:`, error)
            return []
          }
        })
        
        const results = await Promise.allSettled(promises)
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            allOdds.push(...result.value)
          }
        })
        
        return allOdds
      }

      const apiSportKey = SPORT_KEY_MAP[sport.toLowerCase()]
      if (!apiSportKey) {
        throw new Error(`Unknown sport: ${sport}`)
      }

      return oddsApi.getOddsForSport(apiSportKey)
    } catch (error) {
      console.error('Error in getOdds:', error)
      throw error
    }
  },

  getOddsForSport: async (sportKey: string): Promise<Event[]> => {
    try {
      console.log('Fetching odds for sport:', sportKey)
      
      const response = await axios.get(`${SPORTS_ODDS_API_URL}/sports/${sportKey}/odds`, {
        params: {
          apiKey: SPORTS_ODDS_API_KEY,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american'
        }
      })

      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid API response:', response.data)
        return []
      }

      // Transform the response to match our expected format
      const transformedGames = response.data.map((game: any) => {
        const now = new Date()
        const gameTime = new Date(game.commence_time)
        const isLive = gameTime <= now && gameTime > new Date(now.getTime() - 4 * 60 * 60 * 1000)

        // Get the first bookmaker's odds
        const bookmaker = game.bookmakers?.[0]
        const h2hMarket = bookmaker?.markets?.find((m: any) => m.key === 'h2h')
        const spreadMarket = bookmaker?.markets?.find((m: any) => m.key === 'spreads')
        const totalMarket = bookmaker?.markets?.find((m: any) => m.key === 'totals')

        return {
          id: game.id,
          sport_key: game.sport_key,
          commence_time: game.commence_time,
          home_team: game.home_team,
          away_team: game.away_team,
          bookmakers: game.bookmakers.map((bookmaker: any) => ({
            key: bookmaker.key,
            title: bookmaker.title,
            markets: bookmaker.markets.map((market: any) => ({
              key: market.key,
              outcomes: market.outcomes.map((outcome: any) => ({
                name: outcome.name,
                price: outcome.price,
                point: outcome.point
              }))
            }))
          })),
          scores: game.scores ? {
            home: game.scores.home,
            away: game.scores.away
          } : undefined,
          status: isLive ? 'live' : 'scheduled',
          period: game.period || (isLive ? '1' : undefined),
          clock: game.clock || (isLive ? '00:00' : undefined),
          isLive: isLive,
          currentOdds: {
            moneyline: h2hMarket?.outcomes?.reduce((acc: any, outcome: any) => ({
              ...acc,
              [outcome.name]: outcome.price
            }), {}),
            spread: spreadMarket?.outcomes?.reduce((acc: any, outcome: any) => ({
              ...acc,
              [outcome.name]: {
                price: outcome.price,
                point: outcome.point
              }
            }), {}),
            total: totalMarket?.outcomes?.reduce((acc: any, outcome: any) => ({
              ...acc,
              [outcome.name.toLowerCase()]: {
                price: outcome.price,
                point: outcome.point
              }
            }), {})
          }
        }
      })

      console.log(`Received ${transformedGames.length} events for ${sportKey}`)
      return transformedGames
    } catch (error) {
      console.error(`Error fetching odds for ${sportKey}:`, error)
      if (axios.isAxiosError(error)) {
        console.error('API Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        })
      }
      return []
    }
  },

  updateGameStatuses: async () => {
    try {
      const now = new Date()
      
      // Update games that have started but are still marked as SCHEDULED
      await prisma.game.updateMany({
        where: {
          status: 'SCHEDULED',
          startTime: {
            lte: now
          }
        },
        data: {
          status: 'LIVE'
        }
      })

      // Update games that have ended (assuming 4 hours after start time)
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)
      await prisma.game.updateMany({
        where: {
          status: 'LIVE',
          startTime: {
            lte: fourHoursAgo
          }
        },
        data: {
          status: 'FINAL'
        }
      })
    } catch (error) {
      console.error('Error updating game statuses:', error)
    }
  }
} 