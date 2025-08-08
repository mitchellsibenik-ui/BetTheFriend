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

// Fetch real game results from The Odds API
async function fetchGameResults(sportKey: string, gameId: string): Promise<GameResult | null> {
  try {
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores`, {
      params: {
        apiKey: process.env.NEXT_PUBLIC_ODDS_API_KEY,
        daysFrom: 3
      }
    })

    const game = response.data.find((g: any) => g.id === gameId)
    if (!game || !game.completed || !game.scores) {
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

// Main settlement function
export async function settleCompletedBets() {
  try {
    console.log('🔍 [BET SETTLEMENT] Checking for completed bets to settle...')
    
    // Get all active bets
    const activeBets = await prisma.bet.findMany({
      where: { 
        status: 'ACTIVE',
        resolved: false
      },
      include: {
        sender: true,
        receiver: true
      }
    })
    
    if (activeBets.length === 0) {
      console.log('[BET SETTLEMENT] No active bets to settle.')
      return
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
        
        // Fetch real game results
        const gameResult = await fetchGameResults(gameData.sportKey, gameData.gameId)
        
        if (!gameResult || !gameResult.completed) {
          console.log(`   ⏳ Game not completed yet`)
          continue
        }
        
        // Extract scores
        const homeScoreData = gameResult.scores.find(s => s.name === gameData.homeTeam)
        const awayScoreData = gameResult.scores.find(s => s.name === gameData.awayTeam)
        
        if (!homeScoreData || !awayScoreData) {
          console.log(`   ❌ Could not find scores for both teams`)
          continue
        }
        
        const homeScore = parseInt(homeScoreData.score)
        const awayScore = parseInt(awayScoreData.score)
        
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
              await prisma.$transaction([
                // Update bet status
                prisma.bet.update({
                  where: { id: bet.id },
                  data: {
                    status: 'RESOLVED',
                    resolved: true,
                    resolvedAt: new Date(),
                    result: betResult.description
                  }
                }),
                // Return stake to sender
                prisma.user.update({
                  where: { id: bet.senderId },
                  data: {
                    balance: { increment: bet.amount }
                  }
                }),
                // Return stake to receiver
                prisma.user.update({
                  where: { id: bet.receiverId },
                  data: {
                    balance: { increment: bet.amount }
                  }
                })
              ])
              
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
              await prisma.$transaction([
                // Update bet status
                prisma.bet.update({
                  where: { id: bet.id },
                  data: {
                    status: 'RESOLVED',
                    resolved: true,
                    resolvedAt: new Date(),
                    winnerId: betResult.winnerId,
                    loserId: betResult.loserId,
                    result: betResult.description
                  }
                }),
                // Update winner's balance and wins
                prisma.user.update({
                  where: { id: betResult.winnerId! },
                  data: {
                    balance: { increment: betResult.payout },
                    wins: { increment: 1 }
                  }
                }),
                // Update loser's losses
                prisma.user.update({
                  where: { id: betResult.loserId! },
                  data: {
                    losses: { increment: 1 }
                  }
                })
              ])
              
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
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing game ${gameKey}:`, error)
      }
    }
    
    console.log('\n✅ [BET SETTLEMENT] Settlement process completed')
    
  } catch (error) {
    console.error('❌ [BET SETTLEMENT] Error in settlement process:', error)
  }
}

// Export for use in cron jobs or manual triggers
export default settleCompletedBets 