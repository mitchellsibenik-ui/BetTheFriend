const { PrismaClient } = require('@prisma/client')
const cron = require('node-cron')

const prisma = new PrismaClient()

// Sports API configuration
const SPORTS_ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY
const SPORTS_ODDS_API_URL = 'https://api.the-odds-api.com/v4'

// Fetch real game results from sports API
async function fetchRealGameResults(sportKey, gameId) {
  try {
    console.log(`🔍 Fetching real results for game ${gameId} in ${sportKey}...`)
    
    const response = await fetch(`${SPORTS_ODDS_API_URL}/sports/${sportKey}/scores`, {
      headers: {
        'x-api-key': SPORTS_ODDS_API_KEY || ''
      }
    })

    if (!response.ok) {
      console.log(`   ⚠️  API error: ${response.status} - ${response.statusText}`)
      return null
    }

    const games = await response.json()
    const game = games.find(g => g.id === gameId)

    if (!game) {
      console.log(`   ⚠️  Game ${gameId} not found in API results`)
      return null
    }

    console.log(`   ✅ Found game: ${game.home_team} vs ${game.away_team}`)
    console.log(`   Score: ${game.home_team} ${game.scores?.[0]?.score || 'N/A'} - ${game.away_team} ${game.scores?.[1]?.score || 'N/A'}`)
    console.log(`   Status: ${game.status}, Completed: ${game.completed}`)
    
    return {
      homeScore: game.scores?.[0]?.score || 0,
      awayScore: game.scores?.[1]?.score || 0,
      status: game.status,
      completed: game.completed || false,
      homeTeam: game.home_team,
      awayTeam: game.away_team
    }
  } catch (error) {
    console.error(`   ❌ Error fetching results for ${gameId}:`, error)
    return null
  }
}

// Check if game is completed based on time
function isGameCompleted(gameDetails) {
  try {
    const details = JSON.parse(gameDetails || '{}')
    const gameTime = new Date(details.commence_time || details.start_time || 0)
    const now = new Date()
    
    // Game is considered completed if it started more than 3 hours ago
    return (now - gameTime) > (3 * 60 * 60 * 1000)
  } catch (error) {
    return false
  }
}

// Determine winner based on real game results
function determineWinner(bet, homeTeam, awayTeam, homeScore, awayScore) {
  const homeTeamWon = homeScore > awayScore
  const winnerTeam = homeTeamWon ? homeTeam : awayTeam
  
  if (bet.betType === 'moneyline') {
    if (bet.senderTeam === winnerTeam) {
      return { winnerId: bet.senderId, loserId: bet.receiverId }
    } else {
      return { winnerId: bet.receiverId, loserId: bet.senderId }
    }
  }
  
  if (bet.betType === 'spread') {
    // Parse the spread values from the bet
    const senderSpread = parseFloat(bet.senderValue) || 0
    const receiverSpread = parseFloat(bet.receiverValue) || 0
    
    // Calculate adjusted scores with spreads
    let senderAdjustedScore, receiverAdjustedScore
    
    if (bet.senderTeam === homeTeam) {
      // Sender picked home team
      senderAdjustedScore = homeScore + senderSpread
      receiverAdjustedScore = awayScore + receiverSpread
    } else {
      // Sender picked away team
      senderAdjustedScore = awayScore + senderSpread
      receiverAdjustedScore = homeScore + receiverSpread
    }
    
    console.log(`   📊 Spread calculation:`)
    console.log(`      ${bet.senderTeam}: ${senderAdjustedScore} (${homeScore > awayScore ? homeTeam : awayTeam} ${Math.max(homeScore, awayScore)} + ${senderSpread})`)
    console.log(`      ${bet.receiverTeam}: ${receiverAdjustedScore} (${homeScore > awayScore ? awayTeam : homeTeam} ${Math.min(homeScore, awayScore)} + ${receiverSpread})`)
    
    // Determine winner based on adjusted scores
    if (senderAdjustedScore > receiverAdjustedScore) {
      return { winnerId: bet.senderId, loserId: bet.receiverId }
    } else if (receiverAdjustedScore > senderAdjustedScore) {
      return { winnerId: bet.receiverId, loserId: bet.senderId }
    } else {
      // Push (tie) - return money back to both
      return { winnerId: null, loserId: null, push: true }
    }
  }
  
  if (bet.betType === 'overUnder') {
    const totalScore = homeScore + awayScore
    const overUnderLine = parseFloat(bet.senderValue) || 0
    
    const senderPickedOver = bet.senderTeam === 'Over'
    const receiverPickedUnder = bet.receiverTeam === 'Under'
    
    console.log(`   📊 Over/Under calculation:`)
    console.log(`      Total Score: ${totalScore}, Line: ${overUnderLine}`)
    console.log(`      Sender picked: ${senderPickedOver ? 'Over' : 'Under'}`)
    console.log(`      Receiver picked: ${receiverPickedUnder ? 'Under' : 'Over'}`)
    
    if (senderPickedOver) {
      // Sender picked Over
      if (totalScore > overUnderLine) {
        return { winnerId: bet.senderId, loserId: bet.receiverId }
      } else if (totalScore < overUnderLine) {
        return { winnerId: bet.receiverId, loserId: bet.senderId }
      } else {
        // Push (tie)
        return { winnerId: null, loserId: null, push: true }
      }
    } else {
      // Sender picked Under
      if (totalScore < overUnderLine) {
        return { winnerId: bet.senderId, loserId: bet.receiverId }
      } else if (totalScore > overUnderLine) {
        return { winnerId: bet.receiverId, loserId: bet.senderId }
      } else {
        // Push (tie)
        return { winnerId: null, loserId: null, push: true }
      }
    }
  }
  
  // Default fallback
  return { winnerId: bet.senderId, loserId: bet.receiverId }
}

// Main settlement function
async function settleCompletedBets() {
  try {
    console.log('🔍 Checking for completed bets to settle...')
    
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
      console.log('No active bets to settle.')
      return
    }
    
    console.log(`Found ${activeBets.length} active bets to check.`)
    
    for (const bet of activeBets) {
      try {
        // Check if game is completed
        if (!isGameCompleted(bet.gameDetails)) {
          continue
        }
        
        console.log(`🎮 Settling bet: ${bet.sender.username} vs ${bet.receiver.username}`)
        console.log(`   Amount: $${bet.amount}, Type: ${bet.betType}`)
        
        // Parse game details
        const gameDetails = JSON.parse(bet.gameDetails || '{}')
        const homeTeam = gameDetails.home_team || 'Home Team'
        const awayTeam = gameDetails.away_team || 'Away Team'
        const sportKey = gameDetails.sport_key || 'baseball_mlb'
        const gameId = gameDetails.id
        
        // Fetch real game results from sports API
        const realResults = await fetchRealGameResults(sportKey, gameId)
        
        if (!realResults || !realResults.completed) {
          console.log(`   ⏳ Game not completed yet or results not available`)
          continue
        }
        
        const { homeScore, awayScore } = realResults
        
        console.log(`   📊 Real results: ${homeTeam} ${homeScore} - ${awayTeam} ${awayScore}`)
        
        // Determine winner based on real results
        const { winnerId, loserId, push } = determineWinner(bet, homeTeam, awayTeam, homeScore, awayScore)
        
        const winner = winnerId === bet.senderId ? bet.sender : bet.receiver
        const loser = loserId === bet.senderId ? bet.sender : bet.receiver
        
        if (push) {
          console.log(`   🤝 Push (tie) - returning money to both users`)
          
          // Update everything in a transaction
          await prisma.$transaction(async (tx) => {
            // Update bet status
            await tx.bet.update({
              where: { id: bet.id },
              data: {
                status: 'RESOLVED',
                resolved: true,
                resolvedAt: new Date(),
                winnerId: null,
                loserId: null,
                result: `Push (tie) - ${homeTeam} ${homeScore}-${awayTeam} ${awayScore}`
              }
            })
            
            // Return money to both users (no winner/loser)
            await tx.user.update({
              where: { id: bet.senderId },
              data: {
                balance: { increment: bet.amount }
              }
            })
            
            await tx.user.update({
              where: { id: bet.receiverId },
              data: {
                balance: { increment: bet.amount }
              }
            })
            
            // Create notifications for push
            await tx.notification.createMany({
              data: [
                {
                  userId: bet.senderId,
                  type: 'bet_result',
                  message: `Push! Your bet with ${bet.receiver.username} was a tie. Your $${bet.amount} has been returned.`,
                  data: JSON.stringify({ betId: bet.id, result: 'push' })
                },
                {
                  userId: bet.receiverId,
                  type: 'bet_result',
                  message: `Push! Your bet with ${bet.sender.username} was a tie. Your $${bet.amount} has been returned.`,
                  data: JSON.stringify({ betId: bet.id, result: 'push' })
                }
              ]
            })
          })
          
          console.log(`   ✅ Push settled - money returned to both users`)
          continue
        }
        
        console.log(`   🏆 Winner: ${winner.username}, Loser: ${loser.username}`)
        
        // Update everything in a transaction
        await prisma.$transaction(async (tx) => {
          // Update bet status
          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: 'RESOLVED',
              resolved: true,
              resolvedAt: new Date(),
              winnerId: winnerId,
              loserId: loserId,
              result: `${winner.username} wins - ${homeTeam} ${homeScore}-${awayTeam} ${awayScore}`
            }
          })
          
          // Update winner's balance and wins
          await tx.user.update({
            where: { id: winnerId },
            data: {
              balance: { increment: bet.amount * 2 },
              wins: { increment: 1 }
            }
          })
          
          // Update loser's losses
          await tx.user.update({
            where: { id: loserId },
            data: {
              losses: { increment: 1 }
            }
          })
          
          // Create notifications
          await tx.notification.createMany({
            data: [
              {
                userId: winnerId,
                type: 'bet_result',
                message: `You won $${bet.amount * 2} on your bet!`,
                data: JSON.stringify({ betId: bet.id, result: 'win', amount: bet.amount * 2 })
              },
              {
                userId: loserId,
                type: 'bet_result',
                message: `You lost $${bet.amount} on your bet.`,
                data: JSON.stringify({ betId: bet.id, result: 'loss', amount: bet.amount })
              }
            ]
          })
        })
        
        console.log(`   ✅ Bet settled successfully with real sportsbook results!`)
        
      } catch (error) {
        console.error(`   ❌ Error settling bet ${bet.id}:`, error)
      }
    }
    
    console.log('🎉 Bet settlement cycle completed!')
    
  } catch (error) {
    console.error('❌ Error in bet settlement:', error)
  }
}

// Start the automated system
function startAutomatedSettlement() {
  console.log('🚀 Starting clean automated bet settlement system...')
  console.log('📅 Will check for completed bets every 5 minutes')
  console.log('📡 Using real sportsbook API for game results')
  
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('\n⏰ Running automated settlement check...')
    await settleCompletedBets()
  })
  
  // Also run immediately
  settleCompletedBets()
}

// Manual trigger function
async function manualSettlement() {
  console.log('🔧 Manual settlement triggered...')
  await settleCompletedBets()
}

module.exports = {
  startAutomatedSettlement,
  manualSettlement,
  settleCompletedBets
} 