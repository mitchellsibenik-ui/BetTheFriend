const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Manual game results - you can update these with the real scores
const MANUAL_GAME_RESULTS = {
  // Washington Nationals vs Milwaukee Brewers
  '2e3a3f48ddb690c4f02276d36db5bc07': {
    homeTeam: 'Washington Nationals',
    awayTeam: 'Milwaukee Brewers',
    homeScore: 2,  // UPDATE THIS with real Nationals score
    awayScore: 4,  // UPDATE THIS with real Brewers score
    sport: 'baseball_mlb'
  },
  
  // Philadelphia Phillies vs Detroit Tigers
  'b4fc61fd47360c667e18883c40c4a93a': {
    homeTeam: 'Philadelphia Phillies',
    awayTeam: 'Detroit Tigers',
    homeScore: 5,  // UPDATE THIS with real Phillies score
    awayScore: 3,  // UPDATE THIS with real Tigers score
    sport: 'baseball_mlb'
  },
  
  // Chicago Cubs vs Boston Red Sox
  'cd0d11ec1434466237cb3f7b7ec1cde1': {
    homeTeam: 'Chicago Cubs',
    awayTeam: 'Boston Red Sox',
    homeScore: 4,  // UPDATE THIS with real Cubs score
    awayScore: 6,  // UPDATE THIS with real Red Sox score
    sport: 'baseball_mlb'
  },
  
  // Lakers vs Warriors (basketball)
  'cmdtcc8xt0002awyubsvka77c': {
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    homeScore: 108,  // UPDATE THIS with real Lakers score
    awayScore: 112,  // UPDATE THIS with real Warriors score
    sport: 'basketball_nba'
  }
}

async function manualSettleWithRealResults() {
  try {
    console.log('🔧 Manually settling bets with real game results...')
    console.log('📝 Please update the MANUAL_GAME_RESULTS object with the actual final scores!')
    
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

    console.log(`Found ${resolvedBets.length} resolved bets to re-settle:`)
    
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
      
      // Get manual results for this game
      const manualResults = MANUAL_GAME_RESULTS[gameData.gameId]
      
      if (manualResults) {
        console.log(`   ✅ Manual results: ${manualResults.homeTeam} ${manualResults.homeScore} - ${manualResults.awayTeam} ${manualResults.awayScore}`)
        
        const homeScore = manualResults.homeScore
        const awayScore = manualResults.awayScore
        const homeTeamWon = homeScore > awayScore
        const winnerTeam = homeTeamWon ? manualResults.homeTeam : manualResults.awayTeam
        
        console.log(`   Winner: ${winnerTeam}`)
        
        // Process all bets for this game with real scores
        for (const bet of gameData.bets) {
          try {
            console.log(`   📝 Re-settling bet: ${bet.sender.username} vs ${bet.receiver.username}`)
            console.log(`      Type: ${bet.betType}, Amount: $${bet.amount}`)
            console.log(`      Sender picks: ${bet.senderTeam}, Receiver picks: ${bet.receiverTeam}`)
            
            let winnerId = null
            let loserId = null
            let result = ''

            // Determine winner based on bet type and real game result
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
              const senderScore = bet.senderTeam === manualResults.homeTeam ? homeScore + senderSpread : awayScore + senderSpread
              const receiverScore = bet.receiverTeam === manualResults.homeTeam ? homeScore + receiverSpread : awayScore + receiverSpread
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
              
              // Update the bet with correct result
              await prisma.bet.update({
                where: { id: bet.id },
                data: {
                  winnerId: winnerId,
                  loserId: loserId,
                  result: result
                }
              })
              
              console.log(`      ✅ Re-settled bet ${bet.id} with real results`)
            }
          } catch (error) {
            console.error(`   ❌ Error re-settling bet ${bet.id}:`, error)
          }
        }
      } else {
        console.log(`   ❌ No manual results found for game ID: ${gameData.gameId}`)
        console.log(`   ⚠️  Please add the real scores to MANUAL_GAME_RESULTS for this game`)
      }
    }
    
    console.log('\n🎉 Manual settlement completed!')
    console.log('\n📝 To update scores, edit the MANUAL_GAME_RESULTS object in this script and run it again.')
    
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
    
    console.log('\n📊 Current user stats:')
    users.forEach((user, index) => {
      const winRate = user.wins + user.losses > 0 ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1) : '0.0'
      console.log(`   ${index + 1}. ${user.username}: $${user.balance.toFixed(2)} | ${user.wins}W-${user.losses}L (${winRate}%)`)
    })
    
  } catch (error) {
    console.error('❌ Error in manual settlement:', error)
  } finally {
    await prisma.$disconnect()
  }
}

manualSettleWithRealResults() 