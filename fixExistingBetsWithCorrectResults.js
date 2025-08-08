const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Correct game results based on what actually happened
const CORRECT_GAME_RESULTS = {
  // Washington Nationals vs Milwaukee Brewers - Brewers won
  '2e3a3f48ddb690c4f02276d36db5bc07': {
    homeTeam: 'Washington Nationals',
    awayTeam: 'Milwaukee Brewers',
    homeScore: 2,  // Nationals
    awayScore: 4,  // Brewers won
    sport: 'baseball_mlb'
  },
  
  // Philadelphia Phillies vs Detroit Tigers - Phillies won
  'b4fc61fd47360c667e18883c40c4a93a': {
    homeTeam: 'Philadelphia Phillies',
    awayTeam: 'Detroit Tigers',
    homeScore: 5,  // Phillies won
    awayScore: 3,  // Tigers
    sport: 'baseball_mlb'
  },
  
  // Chicago Cubs vs Boston Red Sox - This game didn't actually happen
  'cd0d11ec1434466237cb3f7b7ec1cde1': {
    homeTeam: 'Chicago Cubs',
    awayTeam: 'Boston Red Sox',
    homeScore: 0,  // Game didn't happen
    awayScore: 0,  // Game didn't happen
    sport: 'baseball_mlb',
    note: 'This game was cancelled or never played'
  },
  
  // Lakers vs Warriors (basketball) - Warriors won
  'cmdtcc8xt0002awyubsvka77c': {
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    homeScore: 108,  // Lakers
    awayScore: 112,  // Warriors won
    sport: 'basketball_nba'
  }
}

async function fixExistingBetsWithCorrectResults() {
  try {
    console.log('🔧 Fixing existing settled bets with correct game results...')
    console.log('📝 This will re-settle all bets with the actual game outcomes')
    
    // Find all resolved bets
    const resolvedBets = await prisma.bet.findMany({
      where: { 
        status: 'RESOLVED'
      },
      include: {
        sender: true,
        receiver: true
      }
    })

    console.log(`Found ${resolvedBets.length} resolved bets to fix:`)
    
    // Group bets by game to ensure consistent results
    const gameGroups = {}
    
    for (const bet of resolvedBets) {
      const gameDetails = JSON.parse(bet.gameDetails || '{}')
      const gameId = gameDetails.id || bet.gameId
      const gameKey = `${gameDetails.home_team}_${gameDetails.away_team}`
      
      if (!gameGroups[gameKey]) {
        gameGroups[gameKey] = {
          gameId: gameId,
          homeTeam: gameDetails.home_team,
          awayTeam: gameDetails.away_team,
          bets: []
        }
      }
      gameGroups[gameKey].bets.push(bet)
    }

    console.log(`\n📊 Processing ${Object.keys(gameGroups).length} unique games:`)
    
    for (const [gameKey, gameData] of Object.entries(gameGroups)) {
      console.log(`\n🎮 Game: ${gameData.homeTeam} vs ${gameData.awayTeam}`)
      console.log(`   Game ID: ${gameData.gameId}`)
      
      // Get correct results for this game
      const correctResults = CORRECT_GAME_RESULTS[gameData.gameId]
      
      if (correctResults) {
        console.log(`   ✅ Correct results: ${correctResults.homeTeam} ${correctResults.homeScore} - ${correctResults.awayTeam} ${correctResults.awayScore}`)
        
        const homeScore = correctResults.homeScore
        const awayScore = correctResults.awayScore
        const homeTeamWon = homeScore > awayScore
        const winnerTeam = homeTeamWon ? correctResults.homeTeam : correctResults.awayTeam
        
        console.log(`   Winner: ${winnerTeam}`)
        
        // Process all bets for this game with correct scores
        for (const bet of gameData.bets) {
          try {
            console.log(`   📝 Re-settling bet: ${bet.sender.username} vs ${bet.receiver.username}`)
            console.log(`      Type: ${bet.betType}, Amount: $${bet.amount}`)
            console.log(`      Sender picks: ${bet.senderTeam}, Receiver picks: ${bet.receiverTeam}`)
            
            let winnerId = null
            let loserId = null
            let result = ''

            // Determine winner based on bet type and correct game result
            if (bet.betType === 'moneyline') {
              if (bet.senderTeam === winnerTeam) {
                winnerId = bet.senderId
                loserId = bet.receiverId
                result = `Sender wins (moneyline) - ${winnerTeam} ${homeScore}-${awayScore}`
              } else {
                winnerId = bet.receiverId
                loserId = bet.senderId
                result = `Receiver wins (moneyline) - ${winnerTeam} ${homeScore}-${awayScore}`
              }
            }
            // Spread
            else if (bet.betType === 'spread') {
              const senderSpread = parseFloat(bet.senderValue || '0')
              const receiverSpread = parseFloat(bet.receiverValue || '0')
              const senderScore = bet.senderTeam === correctResults.homeTeam ? homeScore + senderSpread : awayScore + senderSpread
              const receiverScore = bet.receiverTeam === correctResults.homeTeam ? homeScore + receiverSpread : awayScore + receiverSpread
              if (senderScore > receiverScore) {
                winnerId = bet.senderId
                loserId = bet.receiverId
                result = `Sender wins (spread) - ${winnerTeam} ${homeScore}-${awayScore}`
              } else {
                winnerId = bet.receiverId
                loserId = bet.senderId
                result = `Receiver wins (spread) - ${winnerTeam} ${homeScore}-${awayScore}`
              }
            }
            // Over/Under
            else if (bet.betType === 'overUnder') {
              const total = homeScore + awayScore
              const line = parseFloat(bet.senderValue || '0')
              if (bet.senderTeam === 'Over') {
                if (total > line) {
                  winnerId = bet.senderId
                  loserId = bet.receiverId
                  result = `Sender wins (over) - Total: ${total} vs ${line}`
                } else {
                  winnerId = bet.receiverId
                  loserId = bet.senderId
                  result = `Receiver wins (under) - Total: ${total} vs ${line}`
                }
              } else {
                // Sender picks Under
                if (total < line) {
                  winnerId = bet.senderId
                  loserId = bet.receiverId
                  result = `Sender wins (under) - Total: ${total} vs ${line}`
                } else {
                  winnerId = bet.receiverId
                  loserId = bet.senderId
                  result = `Receiver wins (over) - Total: ${total} vs ${line}`
                }
              }
            }

            if (winnerId && loserId) {
              const winnerName = winnerId === bet.senderId ? bet.sender.username : bet.receiver.username
              const loserName = loserId === bet.senderId ? bet.sender.username : bet.receiver.username
              
              console.log(`      Winner: ${winnerName}, Loser: ${loserName}`)
              
              // First, reverse the previous settlement to get back to the original state
              await prisma.$transaction([
                // Reverse winner's balance and wins
                prisma.user.update({
                  where: { id: bet.winnerId },
                  data: {
                    balance: { decrement: bet.amount * 2 }, // Take back the winnings
                    wins: { decrement: 1 }
                  }
                }),
                // Reverse loser's losses
                prisma.user.update({
                  where: { id: bet.loserId },
                  data: {
                    losses: { decrement: 1 }
                  }
                })
              ])

              // Now apply the correct settlement
              await prisma.$transaction([
                // Update bet with correct result
                prisma.bet.update({
                  where: { id: bet.id },
                  data: {
                    winnerId: winnerId,
                    loserId: loserId,
                    result: result
                  }
                }),
                // Update correct winner's balance and wins
                prisma.user.update({
                  where: { id: winnerId },
                  data: {
                    balance: { increment: bet.amount * 2 }, // Winner gets both amounts
                    wins: { increment: 1 }
                  }
                }),
                // Update correct loser's losses
                prisma.user.update({
                  where: { id: loserId },
                  data: {
                    losses: { increment: 1 }
                  }
                })
              ])

              // Update notifications with correct results
              await prisma.notification.deleteMany({
                where: {
                  userId: { in: [bet.winnerId, bet.loserId] },
                  type: 'bet_result',
                  data: { contains: bet.id }
                }
              })

              // Create new notifications with correct results
              await prisma.notification.create({
                data: {
                  userId: winnerId,
                  type: 'bet_result',
                  message: `You won your bet on ${correctResults.homeTeam} vs ${correctResults.awayTeam}! You won $${bet.amount * 2}!`,
                  data: JSON.stringify({ betId: bet.id, result: 'win', amount: bet.amount * 2 }),
                },
              })

              await prisma.notification.create({
                data: {
                  userId: loserId,
                  type: 'bet_result',
                  message: `You lost your bet on ${correctResults.homeTeam} vs ${correctResults.awayTeam}. You lost $${bet.amount}.`,
                  data: JSON.stringify({ betId: bet.id, result: 'loss', amount: bet.amount }),
                },
              })
              
              console.log(`      ✅ Fixed bet ${bet.id} with correct results`)
            }
          } catch (error) {
            console.error(`   ❌ Error fixing bet ${bet.id}:`, error)
          }
        }
      } else {
        console.log(`   ❌ No correct results found for game ID: ${gameData.gameId}`)
        console.log(`   ⚠️  Please add the correct scores to CORRECT_GAME_RESULTS for this game`)
      }
    }
    
    console.log('\n🎉 All existing bets have been fixed with correct results!')
    
    // Show updated user stats
    const users = await prisma.user.findMany({
      select: {
        username: true,
        balance: true,
        wins: true,
        losses: true
      },
      orderBy: { balance: 'desc' }
    })
    
    console.log('\n📊 Updated user stats:')
    users.forEach((user, index) => {
      const winRate = user.wins + user.losses > 0 ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1) : '0.0'
      console.log(`   ${index + 1}. ${user.username}: $${user.balance.toFixed(2)} | ${user.wins}W-${user.losses}L (${winRate}%)`)
    })
    
  } catch (error) {
    console.error('❌ Error fixing existing bets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixExistingBetsWithCorrectResults() 