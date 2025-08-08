const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAndFixScores() {
  try {
    console.log('🔍 Checking existing bet scores and fixing settlements...')
    
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

    console.log(`Found ${resolvedBets.length} resolved bets to check:`)
    
    // Group bets by game to ensure consistent results
    const gameGroups = {}
    
    for (const bet of resolvedBets) {
      const gameDetails = JSON.parse(bet.gameDetails || '{}')
      const gameKey = `${gameDetails.home_team}_${gameDetails.away_team}`
      
      if (!gameGroups[gameKey]) {
        gameGroups[gameKey] = {
          homeTeam: gameDetails.home_team,
          awayTeam: gameDetails.away_team,
          scores: gameDetails.scores,
          bets: []
        }
      }
      gameGroups[gameKey].bets.push(bet)
    }

    console.log(`\n📊 Processing ${Object.keys(gameGroups).length} unique games:`)
    
    for (const [gameKey, gameData] of Object.entries(gameGroups)) {
      console.log(`\n🎮 Game: ${gameData.homeTeam} vs ${gameData.awayTeam}`)
      
      // Check if we have real scores
      if (gameData.scores && gameData.scores.home !== undefined && gameData.scores.away !== undefined) {
        console.log(`   ✅ Real scores found: ${gameData.homeTeam} ${gameData.scores.home} - ${gameData.awayTeam} ${gameData.scores.away}`)
        
        const homeScore = gameData.scores.home
        const awayScore = gameData.scores.away
        const homeTeamWon = homeScore > awayScore
        const winnerTeam = homeTeamWon ? gameData.homeTeam : gameData.awayTeam
        
        console.log(`   Winner: ${winnerTeam}`)
        
        // Process all bets for this game with real scores
        for (const bet of gameData.bets) {
          try {
            console.log(`   📝 Processing bet: ${bet.sender.username} vs ${bet.receiver.username}`)
            console.log(`      Type: ${bet.betType}, Amount: $${bet.amount}`)
            
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
              const senderScore = bet.senderTeam === gameData.homeTeam ? homeScore + senderSpread : awayScore + senderSpread
              const receiverScore = bet.receiverTeam === gameData.homeTeam ? homeScore + receiverSpread : awayScore + receiverSpread
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
              
              console.log(`      ✅ Fixed bet ${bet.id} with real scores`)
            }
          } catch (error) {
            console.error(`   ❌ Error fixing bet ${bet.id}:`, error)
          }
        }
      } else {
        console.log(`   ❌ No real scores available for this game`)
        console.log(`   Game details:`, JSON.stringify(gameData, null, 2))
        
        // For games without real scores, we need to either:
        // 1. Fetch the real scores from the sports API
        // 2. Use the actual game results that you know happened
        console.log(`   ⚠️  Need to determine real game result for: ${gameData.homeTeam} vs ${gameData.awayTeam}`)
      }
    }
    
    console.log('\n🎉 Score checking and fixing completed!')
    
  } catch (error) {
    console.error('❌ Error checking and fixing scores:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndFixScores() 