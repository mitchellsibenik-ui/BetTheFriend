const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Sports API configuration
const SPORTS_ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY
const SPORTS_ODDS_API_URL = 'https://api.the-odds-api.com/v4'

async function fetchGameResults(sportKey, gameId) {
  try {
    console.log(`🔍 Fetching results for game ${gameId} in ${sportKey}...`)
    
    const response = await fetch(`${SPORTS_ODDS_API_URL}/sports/${sportKey}/scores`, {
      headers: {
        'x-api-key': SPORTS_ODDS_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch scores: ${response.status}`)
    }

    const games = await response.json()
    const game = games.find(g => g.id === gameId)

    if (!game) {
      console.log(`   ⚠️  Game ${gameId} not found in API results`)
      return null
    }

    console.log(`   ✅ Found game: ${game.home_team} vs ${game.away_team}`)
    console.log(`   Score: ${game.home_team} ${game.scores?.[0]?.score || 'N/A'} - ${game.away_team} ${game.scores?.[1]?.score || 'N/A'}`)
    
    return {
      homeScore: game.scores?.[0]?.score || 0,
      awayScore: game.scores?.[1]?.score || 0,
      status: game.status,
      completed: game.completed || false
    }
  } catch (error) {
    console.error(`   ❌ Error fetching results for ${gameId}:`, error.message)
    return null
  }
}

async function fetchRealResultsAndSettle() {
  try {
    console.log('🔧 Fetching real game results and re-settling all bets...')
    
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
      const gameKey = `${gameDetails.home_team}_${gameDetails.away_team}`
      
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

    console.log(`\n📊 Processing ${Object.keys(gameGroups).length} unique games:`)
    
    for (const [gameKey, gameData] of Object.entries(gameGroups)) {
      console.log(`\n🎮 Game: ${gameData.homeTeam} vs ${gameData.awayTeam}`)
      console.log(`   Game ID: ${gameData.gameId}`)
      console.log(`   Sport: ${gameData.sportKey}`)
      
      // Fetch real game results from API
      const gameResults = await fetchGameResults(gameData.sportKey, gameData.gameId)
      
      if (gameResults && gameResults.completed) {
        console.log(`   ✅ Real results: ${gameData.homeTeam} ${gameResults.homeScore} - ${gameData.awayTeam} ${gameResults.awayScore}`)
        
        const homeScore = gameResults.homeScore
        const awayScore = gameResults.awayScore
        const homeTeamWon = homeScore > awayScore
        const winnerTeam = homeTeamWon ? gameData.homeTeam : gameData.awayTeam
        
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
              
              console.log(`      ✅ Re-settled bet ${bet.id} with real results`)
            }
          } catch (error) {
            console.error(`   ❌ Error re-settling bet ${bet.id}:`, error)
          }
        }
      } else {
        console.log(`   ❌ Game not completed or results not available`)
        console.log(`   Status: ${gameResults?.status || 'Unknown'}`)
        console.log(`   Completed: ${gameResults?.completed || false}`)
      }
    }
    
    console.log('\n🎉 Real results fetched and bets re-settled!')
    
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
    console.error('❌ Error fetching real results and settling:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fetchRealResultsAndSettle() 