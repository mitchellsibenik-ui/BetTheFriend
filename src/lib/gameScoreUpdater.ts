import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

interface GameResult {
  id: string
  sport_key: string
  commence_time: string
  completed: boolean
  home_team: string
  away_team: string
  scores: Array<{
    name: string
    score: string
  }> | any
  last_update?: string
}

/**
 * Updates game scores in the database for all active games
 * This runs frequently to ensure scores are saved as soon as they're available
 * This prevents the need for manual score updates
 */
export async function updateGameScores() {
  try {
    console.log('🔄 [GAME SCORE UPDATER] Starting game score update...')
    
    const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY
    if (!apiKey) {
      console.error('❌ No API key configured')
      return { success: false, error: 'No API key' }
    }

    // Get all games that haven't been completed yet
    const activeGames = await prisma.game.findMany({
      where: {
        status: { not: 'completed' },
        startTime: { lte: new Date() } // Games that have started
      },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        sport: true,
        startTime: true,
        status: true
      }
    })

    if (activeGames.length === 0) {
      console.log('[GAME SCORE UPDATER] No active games to update')
      return { success: true, gamesUpdated: 0 }
    }

    console.log(`[GAME SCORE UPDATER] Found ${activeGames.length} active game(s) to check`)

    // Group games by sport
    const gamesBySport: { [sportKey: string]: any[] } = {}
    for (const game of activeGames) {
      // Map sport to API sport key
      let sportKey = 'basketball_nba'
      if (game.sport?.toLowerCase().includes('hockey') || game.sport?.toLowerCase().includes('nhl')) {
        sportKey = 'icehockey_nhl'
      } else if (game.sport?.toLowerCase().includes('football') || game.sport?.toLowerCase().includes('nfl')) {
        sportKey = 'americanfootball_nfl'
      } else if (game.sport?.toLowerCase().includes('baseball') || game.sport?.toLowerCase().includes('mlb')) {
        sportKey = 'baseball_mlb'
      }

      if (!gamesBySport[sportKey]) {
        gamesBySport[sportKey] = []
      }
      gamesBySport[sportKey].push(game)
    }

    let gamesUpdated = 0
    let gamesWithScores = 0

    // Fetch scores for each sport
    for (const [sportKey, games] of Object.entries(gamesBySport)) {
      try {
        console.log(`\n📡 Fetching scores for ${sportKey} (${games.length} games)...`)
        
        // Fetch scores from API
        let response
        try {
          response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores`, {
            params: { apiKey: apiKey },
            timeout: 15000
          })
        } catch (error1) {
          try {
            response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores`, {
              headers: { 'x-api-key': apiKey },
              timeout: 15000
            })
          } catch (error2) {
            console.error(`❌ Error fetching scores for ${sportKey}:`, error2)
            continue
          }
        }

        if (!response?.data || !Array.isArray(response.data)) {
          console.log(`⚠️  No data returned for ${sportKey}`)
          continue
        }

        // Update each game with scores if available
        for (const game of games) {
          try {
            // Try to find game in API response by ID first
            let apiGame = response.data.find((g: any) => g.id === game.id)
            
            // If not found by ID, try by team names
            if (!apiGame) {
              apiGame = response.data.find((g: any) => {
                const homeMatch = g.home_team === game.homeTeam || 
                                 g.home_team?.toLowerCase().includes(game.homeTeam.toLowerCase()) ||
                                 game.homeTeam.toLowerCase().includes(g.home_team?.toLowerCase() || '')
                const awayMatch = g.away_team === game.awayTeam ||
                                 g.away_team?.toLowerCase().includes(game.awayTeam.toLowerCase()) ||
                                 game.awayTeam.toLowerCase().includes(g.away_team?.toLowerCase() || '')
                return homeMatch && awayMatch
              })
            }

            if (!apiGame) {
              continue // Game not found in API response
            }

            // Check if game has scores
            if (!apiGame.scores || (Array.isArray(apiGame.scores) && apiGame.scores.length < 2)) {
              continue // No scores yet
            }

            // Extract scores
            let homeScore: number | null = null
            let awayScore: number | null = null

            if (Array.isArray(apiGame.scores)) {
              if (apiGame.scores[0]?.name && apiGame.scores[0]?.score) {
                // Array of objects with name/score
                const homeScoreData = apiGame.scores.find((s: any) => 
                  s.name === game.homeTeam || 
                  s.name === apiGame.home_team ||
                  s.name?.toLowerCase().includes(game.homeTeam.toLowerCase())
                )
                const awayScoreData = apiGame.scores.find((s: any) => 
                  s.name === game.awayTeam || 
                  s.name === apiGame.away_team ||
                  s.name?.toLowerCase().includes(game.awayTeam.toLowerCase())
                )
                
                if (homeScoreData && awayScoreData) {
                  homeScore = parseInt(homeScoreData.score)
                  awayScore = parseInt(awayScoreData.score)
                } else {
                  // Try by index
                  homeScore = parseInt(typeof apiGame.scores[0] === 'object' && apiGame.scores[0]?.score ? apiGame.scores[0].score : String(apiGame.scores[0] || '0'))
                  awayScore = parseInt(typeof apiGame.scores[1] === 'object' && apiGame.scores[1]?.score ? apiGame.scores[1].score : String(apiGame.scores[1] || '0'))
                }
              } else {
                // Array of numbers/strings
                homeScore = parseInt(typeof apiGame.scores[0] === 'object' && apiGame.scores[0]?.score ? apiGame.scores[0].score : String(apiGame.scores[0] || '0'))
                awayScore = parseInt(typeof apiGame.scores[1] === 'object' && apiGame.scores[1]?.score ? apiGame.scores[1].score : String(apiGame.scores[1] || '0'))
              }
            } else {
              // Scores is an object
              homeScore = parseInt(apiGame.scores[game.homeTeam] || apiGame.scores[apiGame.home_team] || '0')
              awayScore = parseInt(apiGame.scores[game.awayTeam] || apiGame.scores[apiGame.away_team] || '0')
            }

            if (isNaN(homeScore) || isNaN(awayScore)) {
              continue // Invalid scores
            }

            // Update game in database
            const isCompleted = apiGame.completed || false
            
            await prisma.game.update({
              where: { id: game.id },
              data: {
                homeScore: homeScore,
                awayScore: awayScore,
                status: isCompleted ? 'completed' : 'in_progress',
                endTime: isCompleted ? new Date() : undefined
              }
            })

            gamesUpdated++
            if (isCompleted) {
              gamesWithScores++
            }

            console.log(`   ✅ Updated: ${game.homeTeam} ${homeScore} - ${game.awayTeam} ${awayScore} ${isCompleted ? '(COMPLETED)' : ''}`)
          } catch (error) {
            console.error(`   ❌ Error updating game ${game.id}:`, error)
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${sportKey}:`, error)
      }
    }

    console.log(`\n✅ [GAME SCORE UPDATER] Completed`)
    console.log(`   - Games updated: ${gamesUpdated}`)
    console.log(`   - Games completed: ${gamesWithScores}`)

    return {
      success: true,
      gamesUpdated,
      gamesCompleted: gamesWithScores,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ [GAME SCORE UPDATER] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

