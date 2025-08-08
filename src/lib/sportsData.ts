import { OddsAPI } from '@/lib/oddsApi'

export async function getGameScores(gameId: string) {
  try {
    const oddsApi = new OddsAPI()
    const scores = await oddsApi.getScores(gameId)
    
    if (!scores) {
      return null
    }

    return {
      homeTeamScore: scores.homeTeamScore,
      awayTeamScore: scores.awayTeamScore,
      gameStatus: scores.gameStatus
    }
  } catch (error) {
    console.error('Error fetching game scores:', error)
    return null
  }
} 