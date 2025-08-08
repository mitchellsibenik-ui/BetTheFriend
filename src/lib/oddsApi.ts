export class OddsAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY || ''
    this.baseUrl = 'https://api.the-odds-api.com/v4'
  }

  async getScores(gameId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/sports/americanfootball_nfl/scores`, {
        headers: {
          'x-api-key': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch scores')
      }

      const games = await response.json()
      const game = games.find((g: any) => g.id === gameId)

      if (!game) {
        return null
      }

      return {
        homeTeamScore: game.scores?.home || 0,
        awayTeamScore: game.scores?.away || 0,
        gameStatus: game.status
      }
    } catch (error) {
      console.error('Error in getScores:', error)
      return null
    }
  }
} 