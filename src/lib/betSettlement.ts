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
  }>
  last_update?: string
}

interface BetResult {
  result: 'win' | 'loss' | 'push'
  winnerId?: string
  loserId?: string
  payout: number
  description: string
}

// Fetch real game results from The Odds API with retry logic
async function fetchGameResults(sportKey: string, gameId: string, homeTeam?: string, awayTeam?: string, retries: number = 2): Promise<GameResult | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY
    if (!apiKey) {
      console.error('No API key configured')
      return null
    }

    let response
    let lastError: any = null
    
    // Try different API formats with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Try with apiKey in query params first
        response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores`, {
          params: {
            apiKey: apiKey
          },
          timeout: 10000 // 10 second timeout
        })
        break // Success, exit retry loop
      } catch (error1) {
        lastError = error1
        try {
          // Try with x-api-key header
          response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores`, {
            headers: {
              'x-api-key': apiKey
            },
            timeout: 10000
          })
          break // Success, exit retry loop
        } catch (error2) {
          lastError = error2
          if (attempt < retries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
            continue
          }
        }
      }
    }
    
    if (!response) {
      console.error(`Error fetching scores for ${sportKey} after ${retries + 1} attempts:`, lastError)
      return null
    }

    if (!response.data || !Array.isArray(response.data)) {
      return null
    }

    // First try to find by game ID
    let game = response.data.find((g: any) => g.id === gameId)
    
    // If not found by ID, try to find by team names (fuzzy match)
    if (!game && homeTeam && awayTeam) {
      game = response.data.find((g: any) => {
        const homeMatch = g.home_team === homeTeam || 
                         g.home_team?.toLowerCase().includes(homeTeam.toLowerCase()) || 
                         homeTeam.toLowerCase().includes(g.home_team?.toLowerCase() || '')
        const awayMatch = g.away_team === awayTeam || 
                         g.away_team?.toLowerCase().includes(awayTeam.toLowerCase()) || 
                         awayTeam.toLowerCase().includes(g.away_team?.toLowerCase() || '')
        return homeMatch && awayMatch
      })
    }
    
    if (!game) {
      return null
    }

    // Check if game is completed
    if (!game.completed) {
      return null
    }

    // Check if scores are available
    if (!game.scores || (Array.isArray(game.scores) && game.scores.length < 2)) {
      return null
    }

    return game
  } catch (error) {
    console.error(`Error fetching results for ${gameId}:`, error)
    return null
  }
}

// Calculate sportsbook payout based on odds
function calculateSportsbookPayout(odds: number, stake: number): number {
  if (odds > 0) {
    // Positive odds: bet $100 to win $X
    return (stake * odds) / 100
  } else {
    // Negative odds: bet $X to win $100
    return (stake * 100) / Math.abs(odds)
  }
}

// Parse stored value to get line and odds
function parseValueAndOdds(value: string): { line: number; odds: number } {
  const parts = value.split('|')
  const line = parseFloat(parts[0])
  const odds = parts[1] ? parseInt(parts[1]) : -110
  return { line, odds }
}

// Grade a moneyline bet (straight winner pick)
function gradeMoneylineBet(
  bet: any,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string
): BetResult {
  const senderOdds = parseInt(bet.senderValue)
  const receiverOdds = parseInt(bet.receiverValue)
  
  // Determine actual winner
  let actualWinner: string
  if (homeScore > awayScore) {
    actualWinner = homeTeam
  } else if (awayScore > homeScore) {
    actualWinner = awayTeam
  } else {
    // Tie - this is a push for moneyline bets
    return {
      result: 'push',
      payout: bet.amount, // Return stake
      description: `Game tied ${homeScore}-${awayScore}, bet pushed`
    }
  }
  
  // Check if sender's pick won
  if (bet.senderTeam === actualWinner) {
    const winnings = calculateSportsbookPayout(senderOdds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.senderId,
      loserId: bet.receiverId,
      payout: bet.amount + winnings, // Return stake + winnings
      description: `${bet.senderTeam} won ${homeScore > awayScore ? homeScore + '-' + awayScore : awayScore + '-' + homeScore}`
    }
  } else {
    const winnings = calculateSportsbookPayout(receiverOdds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.receiverId,
      loserId: bet.senderId,
      payout: bet.amount + winnings, // Return stake + winnings
      description: `${bet.receiverTeam} won ${homeScore > awayScore ? homeScore + '-' + awayScore : awayScore + '-' + homeScore}`
    }
  }
}

// Grade a spread bet (margin-based pick)
function gradeSpreadBet(
  bet: any,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string
): BetResult {
  const senderData = parseValueAndOdds(bet.senderValue)
  const receiverData = parseValueAndOdds(bet.receiverValue)
  
  // Adjust scores based on spread
  let senderAdjustedScore: number
  let receiverAdjustedScore: number
  
  if (bet.senderTeam === homeTeam) {
    senderAdjustedScore = homeScore + senderData.line
    receiverAdjustedScore = awayScore + receiverData.line
  } else {
    senderAdjustedScore = awayScore + senderData.line
    receiverAdjustedScore = homeScore + receiverData.line
  }
  
  // Compare adjusted scores
  if (senderAdjustedScore > receiverAdjustedScore) {
    const winnings = calculateSportsbookPayout(senderData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.senderId,
      loserId: bet.receiverId,
      payout: bet.amount + winnings,
      description: `${bet.senderTeam} covered spread ${senderData.line > 0 ? '+' : ''}${senderData.line}`
    }
  } else if (receiverAdjustedScore > senderAdjustedScore) {
    const winnings = calculateSportsbookPayout(receiverData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.receiverId,
      loserId: bet.senderId,
      payout: bet.amount + winnings,
      description: `${bet.receiverTeam} covered spread ${receiverData.line > 0 ? '+' : ''}${receiverData.line}`
    }
  } else {
    // Exact tie after spread adjustment - push
    return {
      result: 'push',
      payout: bet.amount,
      description: `Spread push: game landed exactly on the spread`
    }
  }
}

// Grade an over/under bet (total-points pick)
function gradeOverUnderBet(
  bet: any,
  homeScore: number,
  awayScore: number
): BetResult {
  const senderData = parseValueAndOdds(bet.senderValue)
  const receiverData = parseValueAndOdds(bet.receiverValue)
  
  const totalScore = homeScore + awayScore
  const line = senderData.line // Both should have same line
  
  if (totalScore > line) {
    // Over wins
    if (bet.senderTeam === 'Over') {
      const winnings = calculateSportsbookPayout(senderData.odds, bet.amount)
      return {
        result: 'win',
        winnerId: bet.senderId,
        loserId: bet.receiverId,
        payout: bet.amount + winnings,
        description: `Over ${line} won (total: ${totalScore})`
      }
    } else {
      const winnings = calculateSportsbookPayout(receiverData.odds, bet.amount)
      return {
        result: 'win',
        winnerId: bet.receiverId,
        loserId: bet.senderId,
        payout: bet.amount + winnings,
        description: `Over ${line} won (total: ${totalScore})`
      }
    }
  } else if (totalScore < line) {
    // Under wins
    if (bet.senderTeam === 'Under') {
      const winnings = calculateSportsbookPayout(senderData.odds, bet.amount)
      return {
        result: 'win',
        winnerId: bet.senderId,
        loserId: bet.receiverId,
        payout: bet.amount + winnings,
        description: `Under ${line} won (total: ${totalScore})`
      }
    } else {
      const winnings = calculateSportsbookPayout(receiverData.odds, bet.amount)
      return {
        result: 'win',
        winnerId: bet.receiverId,
        loserId: bet.senderId,
        payout: bet.amount + winnings,
        description: `Under ${line} won (total: ${totalScore})`
      }
    }
  } else {
    // Exact match - push
    return {
      result: 'push',
      payout: bet.amount,
      description: `Total push: game total exactly ${totalScore}`
    }
  }
}

// Main bet grading function
function gradeBet(
  bet: any,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string
): BetResult {
  switch (bet.betType) {
    case 'moneyline':
      return gradeMoneylineBet(bet, homeScore, awayScore, homeTeam, awayTeam)
    case 'spread':
      return gradeSpreadBet(bet, homeScore, awayScore, homeTeam, awayTeam)
    case 'overUnder':
      return gradeOverUnderBet(bet, homeScore, awayScore)
    default:
      throw new Error(`Unknown bet type: ${bet.betType}`)
  }
}

/**
 * Main settlement function - Automatically grades and settles completed bets
 * 
 * Flow:
 * 1. Finds all ACTIVE/ACCEPTED bets that haven't been resolved
 * 2. Groups bets by game
 * 3. For each game:
 *    a. Checks Game table for stored scores (fast path)
 *    b. Falls back to API if scores not in database
 *    c. Updates Game table with scores for future reference
 * 4. Grades each bet based on bet type (moneyline, spread, over/under)
 * 5. Updates balances, win/loss records, and bet status atomically
 * 6. Sends notifications to both users
 * 
 * Error Handling:
 * - Retries API calls with exponential backoff
 * - Logs games that need manual settlement (>4 hours after start, no results)
 * - Uses database transactions to ensure atomicity
 * - Continues processing other bets if one fails
 */
export async function settleCompletedBets() {
  try {
    console.log('🔍 [BET SETTLEMENT] Checking for completed bets to settle...')
    
    // Get all active bets (check both ACTIVE and ACCEPTED statuses for compatibility)
    const activeBets = await prisma.bet.findMany({
      where: { 
        OR: [
          { status: 'ACTIVE' },
          { status: 'ACCEPTED' }
        ],
        resolved: false
      },
      include: {
        sender: true,
        receiver: true
      }
    })
    
    if (activeBets.length === 0) {
      console.log('[BET SETTLEMENT] No active bets to settle.')
      return {
        success: true,
        timestamp: new Date().toISOString(),
        gamesProcessed: 0,
        betsProcessed: 0
      }
    }
    
    console.log(`[BET SETTLEMENT] Found ${activeBets.length} active bet(s) to check`)
    
    // Group bets by game
    const gameGroups: { [key: string]: any } = {}
    
    for (const bet of activeBets) {
      const gameDetails = JSON.parse(bet.gameDetails || '{}')
      const gameKey = gameDetails.id || `${gameDetails.home_team}_${gameDetails.away_team}`
      
      if (!gameGroups[gameKey]) {
        gameGroups[gameKey] = {
          gameId: gameDetails.id,
          sportKey: gameDetails.sport_key,
          homeTeam: gameDetails.home_team,
          awayTeam: gameDetails.away_team,
          bets: []
        }
      }
      gameGroups[gameKey].bets.push(bet)
    }
    
    console.log(`[BET SETTLEMENT] Processing ${Object.keys(gameGroups).length} unique game(s)`)
    
    // Process each game
    for (const [gameKey, gameData] of Object.entries(gameGroups)) {
      try {
        console.log(`\n🎮 [GAME: ${gameData.homeTeam} vs ${gameData.awayTeam}]`)
        
        // Check if we have commence_time from any bet to determine if game should have started
        const firstBet = gameData.bets[0]
        const gameDetails = JSON.parse(firstBet.gameDetails || '{}')
        const commenceTime = gameDetails.commence_time ? new Date(gameDetails.commence_time) : null
        const now = new Date()
        const gameShouldHaveStarted = commenceTime && commenceTime < now
        
        if (gameShouldHaveStarted) {
          console.log(`   ⏰ Game was scheduled for ${commenceTime?.toISOString()}, checking for results...`)
        }
        
        // First, check if we have scores in the Game table
        let homeScore: number | null = null
        let awayScore: number | null = null
        
        try {
          const gameRecord = await prisma.game.findUnique({
            where: { id: gameData.gameId },
            select: { homeScore: true, awayScore: true, status: true }
          })
          
          if (gameRecord && gameRecord.status === 'completed' && 
              gameRecord.homeScore !== null && gameRecord.awayScore !== null) {
            homeScore = gameRecord.homeScore
            awayScore = gameRecord.awayScore
            console.log(`   ✅ Found scores in database: ${gameData.homeTeam} ${homeScore} - ${gameData.awayTeam} ${awayScore}`)
          }
        } catch (error) {
          console.log(`   ⚠️  Could not check Game table: ${error}`)
        }
        
        // If no scores in database, try fetching from API
        if (homeScore === null || awayScore === null) {
          const gameResult = await fetchGameResults(gameData.sportKey, gameData.gameId, gameData.homeTeam, gameData.awayTeam)
          
          if (!gameResult || !gameResult.completed) {
            if (gameShouldHaveStarted) {
              // Game should have started but no results - log for manual review
              const hoursSinceStart = commenceTime ? Math.floor((now.getTime() - commenceTime.getTime()) / (1000 * 60 * 60)) : 0
              if (hoursSinceStart >= 4) {
                // Game should be finished by now (most games are 2-3 hours)
                console.log(`   ⚠️  WARNING: Game started ${hoursSinceStart} hours ago but results not available. May need manual settlement.`)
                console.log(`   📋 Game ID: ${gameData.gameId}, Teams: ${gameData.homeTeam} vs ${gameData.awayTeam}`)
                console.log(`   📋 Affected bets: ${gameData.bets.length}`)
              } else {
                console.log(`   ⏳ Game started ${hoursSinceStart} hours ago, may still be in progress`)
              }
            } else {
              console.log(`   ⏳ Game not completed yet or results not available`)
            }
            continue
          }
          
          // Extract scores from API - handle different score formats
          if (Array.isArray(gameResult.scores)) {
          // If scores is an array of objects with name/score
          if (gameResult.scores[0]?.name && gameResult.scores[0]?.score) {
            const homeScoreData = gameResult.scores.find(s => 
              s.name === gameData.homeTeam || 
              s.name === gameResult.home_team ||
              s.name?.toLowerCase().includes(gameData.homeTeam.toLowerCase())
            )
            const awayScoreData = gameResult.scores.find(s => 
              s.name === gameData.awayTeam || 
              s.name === gameResult.away_team ||
              s.name?.toLowerCase().includes(gameData.awayTeam.toLowerCase())
            )
            
            if (homeScoreData && awayScoreData) {
              homeScore = parseInt(homeScoreData.score)
              awayScore = parseInt(awayScoreData.score)
            } else {
              // Try by index if names don't match
              homeScore = parseInt(gameResult.scores[0]?.score || gameResult.scores[0] || '0')
              awayScore = parseInt(gameResult.scores[1]?.score || gameResult.scores[1] || '0')
            }
          } else {
            // If scores is an array of numbers/strings
            homeScore = parseInt(gameResult.scores[0] || '0')
            awayScore = parseInt(gameResult.scores[1] || '0')
          }
          } else {
            // If scores is an object
            homeScore = parseInt(gameResult.scores[gameData.homeTeam] || gameResult.scores[gameResult.home_team] || '0')
            awayScore = parseInt(gameResult.scores[gameData.awayTeam] || gameResult.scores[gameResult.away_team] || '0')
          }
          
          if (isNaN(homeScore) || isNaN(awayScore)) {
            console.log(`   ❌ Could not parse scores from API response`)
            continue
          }
          
          // Update Game table with scores for future reference
          try {
            await prisma.game.update({
              where: { id: gameData.gameId },
              data: {
                homeScore: homeScore,
                awayScore: awayScore,
                status: 'completed',
                endTime: new Date()
              }
            })
          } catch (error) {
            // Game record might not exist, that's okay
            console.log(`   ⚠️  Could not update Game table: ${error}`)
          }
        }
        
        // At this point, we should have valid scores
        if (homeScore === null || awayScore === null) {
          console.log(`   ❌ No valid scores available`)
          continue
        }
        
        console.log(`   📊 Final Score: ${gameData.homeTeam} ${homeScore} - ${gameData.awayTeam} ${awayScore}`)
        
        // Process each bet for this game
        for (const bet of gameData.bets) {
          try {
            console.log(`\n   💰 Grading bet: ${bet.sender.username} vs ${bet.receiver.username}`)
            console.log(`      Type: ${bet.betType}, Amount: $${bet.amount}`)
            
            // Grade the bet
            const betResult = gradeBet(bet, homeScore, awayScore, gameData.homeTeam, gameData.awayTeam)
            
            console.log(`      Result: ${betResult.result.toUpperCase()}`)
            console.log(`      Description: ${betResult.description}`)
            console.log(`      Payout: $${betResult.payout}`)
            
            // Update database based on result
            if (betResult.result === 'push') {
              // Push - return stakes to both users
              // Use a transaction to ensure atomicity
              await prisma.$transaction(async (tx) => {
                // Update bet status
                await tx.bet.update({
                  where: { id: bet.id },
                  data: {
                    status: 'RESOLVED',
                    resolved: true,
                    resolvedAt: new Date(),
                    result: betResult.description
                  }
                })
                
                // Return stake to sender (atomic operation)
                await tx.user.update({
                  where: { id: bet.senderId },
                  data: {
                    balance: { increment: bet.amount }
                  }
                })
                
                // Return stake to receiver (atomic operation)
                await tx.user.update({
                  where: { id: bet.receiverId },
                  data: {
                    balance: { increment: bet.amount }
                  }
                })
              })
              
              // Send push notifications
              await prisma.notification.create({
                data: {
                  userId: bet.senderId,
                  type: 'bet_result',
                  message: `Your bet on ${gameData.homeTeam} vs ${gameData.awayTeam} was a push. $${bet.amount} returned.`,
                  data: JSON.stringify({ betId: bet.id, result: 'push', amount: bet.amount })
                }
              })
              
              await prisma.notification.create({
                data: {
                  userId: bet.receiverId,
                  type: 'bet_result',
                  message: `Your bet on ${gameData.homeTeam} vs ${gameData.awayTeam} was a push. $${bet.amount} returned.`,
                  data: JSON.stringify({ betId: bet.id, result: 'push', amount: bet.amount })
                }
              })
              
            } else {
              // Win/Loss - update winner's balance and stats
              // Use a transaction to ensure atomicity
              await prisma.$transaction(async (tx) => {
                // Update bet status
                await tx.bet.update({
                  where: { id: bet.id },
                  data: {
                    status: 'RESOLVED',
                    resolved: true,
                    resolvedAt: new Date(),
                    winnerId: betResult.winnerId,
                    loserId: betResult.loserId,
                    result: betResult.description
                  }
                })
                
                // Update winner's balance and wins (atomic operation)
                await tx.user.update({
                  where: { id: betResult.winnerId! },
                  data: {
                    balance: { increment: betResult.payout },
                    wins: { increment: 1 }
                  }
                })
                
                // Update loser's losses (atomic operation)
                await tx.user.update({
                  where: { id: betResult.loserId! },
                  data: {
                    losses: { increment: 1 }
                  }
                })
              })
              
              // Send result notifications
              const winner = betResult.winnerId === bet.senderId ? bet.sender : bet.receiver
              const loser = betResult.loserId === bet.senderId ? bet.sender : bet.receiver
              
              await prisma.notification.create({
                data: {
                  userId: betResult.winnerId!,
                  type: 'bet_result',
                  message: `You won your bet on ${gameData.homeTeam} vs ${gameData.awayTeam}! +$${betResult.payout}`,
                  data: JSON.stringify({ betId: bet.id, result: 'win', amount: betResult.payout })
                }
              })
              
              await prisma.notification.create({
                data: {
                  userId: betResult.loserId!,
                  type: 'bet_result',
                  message: `You lost your bet on ${gameData.homeTeam} vs ${gameData.awayTeam}. ${betResult.description}`,
                  data: JSON.stringify({ betId: bet.id, result: 'loss', amount: 0 })
                }
              })
              
              console.log(`      Winner: ${winner.username} (+$${betResult.payout})`)
              console.log(`      Loser: ${loser.username}`)
            }
            
          } catch (error) {
            console.error(`   ❌ Error grading bet ${bet.id}:`, error)
            console.error(`   Error details:`, error instanceof Error ? error.message : String(error))
            // Continue processing other bets even if one fails
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing game ${gameKey}:`, error)
        console.error(`Error details:`, error instanceof Error ? error.message : String(error))
        // Continue processing other games even if one fails
      }
    }
    
    console.log('\n✅ [BET SETTLEMENT] Settlement process completed')
    
    // Return summary for monitoring
    return {
      success: true,
      timestamp: new Date().toISOString(),
      gamesProcessed: Object.keys(gameGroups).length,
      betsProcessed: activeBets.length
    }
    
  } catch (error) {
    console.error('❌ [BET SETTLEMENT] Error in settlement process:', error)
    console.error('Error details:', error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : String(error))
    
    // Return error info for monitoring
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Export for use in cron jobs or manual triggers
export default settleCompletedBets 