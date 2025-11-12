require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

// Fetch real game results from The Odds API
async function fetchGameResults(sportKey, gameId, homeTeam, awayTeam) {
  try {
    // Try different API formats
    let response
    const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY
    
    // Try format 1: with apiKey in query params, no daysFrom
    try {
      response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores`, {
        params: {
          apiKey: apiKey
        }
      })
    } catch (error1) {
      // Try format 2: with x-api-key header
      try {
        response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores`, {
          headers: {
            'x-api-key': apiKey
          }
        })
      } catch (error2) {
        // Try format 3: apiKey in URL
        response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores?apiKey=${apiKey}`)
      }
    }

    // Debug: log what we got
    if (!response.data || response.data.length === 0) {
      console.log(`   ⚠️  No games returned from API for ${sportKey}`)
      return null
    }
    
    console.log(`   📋 API returned ${response.data.length} games`)
    
    // First try to find by game ID
    let game = response.data.find((g) => g.id === gameId)
    
    if (game) {
      console.log(`   ✅ Found game by ID: ${game.home_team} vs ${game.away_team}`)
    } else {
      console.log(`   ⚠️  Game ID ${gameId} not found, trying team name match...`)
      // If not found by ID, try to find by team names
      if (homeTeam && awayTeam) {
        game = response.data.find((g) => {
          const homeMatch = g.home_team === homeTeam || 
                           g.home_team?.toLowerCase().includes(homeTeam.toLowerCase()) || 
                           homeTeam.toLowerCase().includes(g.home_team?.toLowerCase())
          const awayMatch = g.away_team === awayTeam || 
                           g.away_team?.toLowerCase().includes(awayTeam.toLowerCase()) || 
                           awayTeam.toLowerCase().includes(g.away_team?.toLowerCase())
          return homeMatch && awayMatch
        })
        
        if (game) {
          console.log(`   ✅ Found game by team names: ${game.home_team} vs ${game.away_team}`)
        }
      }
    }
    
    if (!game) {
      console.log(`   ❌ Game not found. Looking for: ${homeTeam} vs ${awayTeam}`)
      console.log(`   Available games (first 5):`, response.data.slice(0, 5).map(g => `${g.home_team} vs ${g.away_team} (${g.completed ? 'completed' : 'not completed'})`))
      return null
    }
    
    if (!game.completed) {
      console.log(`   ⏳ Game found but not completed yet`)
      return null
    }
    
    if (!game.scores || game.scores.length < 2) {
      console.log(`   ⚠️  Game completed but no scores available`)
      return null
    }

    return game
  } catch (error) {
    console.error(`Error fetching results for ${gameId}:`, error.message)
    return null
  }
}

// Calculate sportsbook payout based on odds
function calculateSportsbookPayout(odds, stake) {
  if (odds > 0) {
    return (stake * odds) / 100
  } else {
    return (stake * 100) / Math.abs(odds)
  }
}

// Parse stored value to get line and odds
function parseValueAndOdds(value) {
  if (!value) return { line: 0, odds: -110 }
  const parts = value.split('|')
  const line = parseFloat(parts[0])
  const odds = parts[1] ? parseInt(parts[1]) : -110
  return { line, odds }
}

// Grade a moneyline bet
function gradeMoneylineBet(bet, homeScore, awayScore, homeTeam, awayTeam) {
  const senderOdds = parseInt(bet.senderValue) || -110
  const receiverOdds = parseInt(bet.receiverValue) || -110
  
  let actualWinner
  if (homeScore > awayScore) {
    actualWinner = homeTeam
  } else if (awayScore > homeScore) {
    actualWinner = awayTeam
  } else {
    return {
      result: 'push',
      payout: bet.amount,
      description: `Game tied ${homeScore}-${awayScore}, bet pushed`
    }
  }
  
  if (bet.senderTeam === actualWinner) {
    const winnings = calculateSportsbookPayout(senderOdds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.senderId,
      loserId: bet.receiverId,
      payout: bet.amount + winnings,
      description: `${bet.senderTeam} won ${homeScore}-${awayScore}`
    }
  } else {
    const winnings = calculateSportsbookPayout(receiverOdds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.receiverId,
      loserId: bet.senderId,
      payout: bet.amount + winnings,
      description: `${bet.receiverTeam} won ${homeScore}-${awayScore}`
    }
  }
}

// Grade a spread bet
function gradeSpreadBet(bet, homeScore, awayScore, homeTeam, awayTeam) {
  const senderData = parseValueAndOdds(bet.senderValue)
  const receiverData = parseValueAndOdds(bet.receiverValue)
  
  // Determine which team the sender picked
  const senderPickedHome = bet.senderTeam === homeTeam
  const receiverPickedAway = bet.receiverTeam === awayTeam
  
  // Apply spread
  let senderScore = senderPickedHome ? homeScore + senderData.line : awayScore + senderData.line
  let receiverScore = receiverPickedAway ? awayScore + receiverData.line : homeScore + receiverData.line
  
  if (senderScore > receiverScore) {
    const winnings = calculateSportsbookPayout(senderData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.senderId,
      loserId: bet.receiverId,
      payout: bet.amount + winnings,
      description: `${bet.senderTeam} covered the spread`
    }
  } else if (receiverScore > senderScore) {
    const winnings = calculateSportsbookPayout(receiverData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.receiverId,
      loserId: bet.senderId,
      payout: bet.amount + winnings,
      description: `${bet.receiverTeam} covered the spread`
    }
  } else {
    return {
      result: 'push',
      payout: bet.amount,
      description: `Spread push: ${bet.senderTeam} vs ${bet.receiverTeam}`
    }
  }
}

// Grade an over/under bet
function gradeOverUnderBet(bet, homeScore, awayScore) {
  const senderData = parseValueAndOdds(bet.senderValue)
  const receiverData = parseValueAndOdds(bet.receiverValue)
  
  const totalScore = homeScore + awayScore
  const senderPickedOver = bet.senderTeam.toLowerCase().includes('over')
  const receiverPickedUnder = bet.receiverTeam.toLowerCase().includes('under')
  
  const senderLine = senderData.line
  const receiverLine = receiverData.line
  
  if (senderPickedOver && totalScore > senderLine) {
    const winnings = calculateSportsbookPayout(senderData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.senderId,
      loserId: bet.receiverId,
      payout: bet.amount + winnings,
      description: `Over ${senderLine}: Total was ${totalScore}`
    }
  } else if (receiverPickedUnder && totalScore < receiverLine) {
    const winnings = calculateSportsbookPayout(receiverData.odds, bet.amount)
    return {
      result: 'win',
      winnerId: bet.receiverId,
      loserId: bet.senderId,
      payout: bet.amount + winnings,
      description: `Under ${receiverLine}: Total was ${totalScore}`
    }
  } else if (totalScore === senderLine || totalScore === receiverLine) {
    return {
      result: 'push',
      payout: bet.amount,
      description: `Total push: game total exactly ${totalScore}`
    }
  } else {
    // Determine winner based on who picked correctly
    if (senderPickedOver && totalScore < senderLine) {
      const winnings = calculateSportsbookPayout(receiverData.odds, bet.amount)
      return {
        result: 'win',
        winnerId: bet.receiverId,
        loserId: bet.senderId,
        payout: bet.amount + winnings,
        description: `Under ${receiverLine}: Total was ${totalScore}`
      }
    } else {
      const winnings = calculateSportsbookPayout(senderData.odds, bet.amount)
      return {
        result: 'win',
        winnerId: bet.senderId,
        loserId: bet.receiverId,
        payout: bet.amount + winnings,
        description: `Over ${senderLine}: Total was ${totalScore}`
      }
    }
  }
}

// Main grading function
function gradeBet(bet, homeScore, awayScore, homeTeam, awayTeam) {
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

async function settleUserBets() {
  try {
    console.log('🔍 Finding bets for mitchsibs and test...')
    
    // Find users
    const user1 = await prisma.user.findUnique({
      where: { username: 'mitchsibs' }
    })
    const user2 = await prisma.user.findUnique({
      where: { username: 'test' }
    })
    
    if (!user1 || !user2) {
      console.error('❌ Could not find both users')
      return
    }
    
    console.log(`✅ Found users: ${user1.username} and ${user2.username}`)
    
    // Find all active bets between these users
    const activeBets = await prisma.bet.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: user1.id, receiverId: user2.id },
              { senderId: user2.id, receiverId: user1.id }
            ]
          },
          {
            OR: [
              { status: 'ACTIVE' },
              { status: 'ACCEPTED' }
            ]
          },
          { resolved: false }
        ]
      },
      include: {
        sender: true,
        receiver: true
      }
    })
    
    console.log(`\n📊 Found ${activeBets.length} active bet(s) to settle\n`)
    
    if (activeBets.length === 0) {
      console.log('No active bets to settle.')
      return
    }
    
    // Group bets by game
    const gameGroups = {}
    
    for (const bet of activeBets) {
      try {
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
      } catch (error) {
        console.error(`Error parsing game details for bet ${bet.id}:`, error.message)
      }
    }
    
    console.log(`🎮 Processing ${Object.keys(gameGroups).length} unique game(s)\n`)
    
    // Process each game
    for (const [gameKey, gameData] of Object.entries(gameGroups)) {
      try {
        console.log(`\n🎮 [GAME: ${gameData.homeTeam} vs ${gameData.awayTeam}]`)
        console.log(`   Sport: ${gameData.sportKey}`)
        console.log(`   Game ID: ${gameData.gameId}`)
        
        // Fetch real game results
        const gameResult = await fetchGameResults(gameData.sportKey, gameData.gameId, gameData.homeTeam, gameData.awayTeam)
        
        if (!gameResult || !gameResult.completed) {
          console.log(`   ⏳ Game not completed yet or results not available`)
          continue
        }
        
        // Extract scores - scores can be an array with [homeScore, awayScore] or objects with name/score
        let homeScore, awayScore
        
        if (Array.isArray(gameResult.scores)) {
          // If scores is an array of numbers or strings
          if (typeof gameResult.scores[0] === 'number' || typeof gameResult.scores[0] === 'string') {
            homeScore = parseInt(gameResult.scores[0])
            awayScore = parseInt(gameResult.scores[1])
          } else {
            // If scores is an array of objects
            const homeScoreData = gameResult.scores.find(s => s.name === gameData.homeTeam || s.name === gameResult.home_team)
            const awayScoreData = gameResult.scores.find(s => s.name === gameData.awayTeam || s.name === gameResult.away_team)
            
            if (!homeScoreData || !awayScoreData) {
              // Try by index if names don't match
              homeScore = parseInt(gameResult.scores[0]?.score || gameResult.scores[0])
              awayScore = parseInt(gameResult.scores[1]?.score || gameResult.scores[1])
            } else {
              homeScore = parseInt(homeScoreData.score)
              awayScore = parseInt(awayScoreData.score)
            }
          }
        } else {
          // If scores is an object
          const homeScoreData = gameResult.scores[gameData.homeTeam] || gameResult.scores[gameResult.home_team]
          const awayScoreData = gameResult.scores[gameData.awayTeam] || gameResult.scores[gameResult.away_team]
          homeScore = parseInt(homeScoreData || 0)
          awayScore = parseInt(awayScoreData || 0)
        }
        
        if (isNaN(homeScore) || isNaN(awayScore)) {
          console.log(`   ❌ Could not parse scores`)
          console.log(`   Scores data:`, gameResult.scores)
          continue
        }
        
        console.log(`   📊 Final Score: ${gameData.homeTeam} ${homeScore} - ${gameData.awayTeam} ${awayScore}`)
        
        // Process each bet for this game
        for (const bet of gameData.bets) {
          try {
            console.log(`\n   💰 Grading bet: ${bet.sender.username} vs ${bet.receiver.username}`)
            console.log(`      Type: ${bet.betType}, Amount: $${bet.amount}`)
            console.log(`      Sender: ${bet.senderTeam} (${bet.senderValue})`)
            console.log(`      Receiver: ${bet.receiverTeam} (${bet.receiverValue})`)
            
            // Grade the bet
            const betResult = gradeBet(bet, homeScore, awayScore, gameData.homeTeam, gameData.awayTeam)
            
            console.log(`      Result: ${betResult.result.toUpperCase()}`)
            console.log(`      Description: ${betResult.description}`)
            console.log(`      Payout: $${betResult.payout}`)
            
            // Update database based on result
            if (betResult.result === 'push') {
              // Push - return stakes to both users
              await prisma.$transaction([
                prisma.bet.update({
                  where: { id: bet.id },
                  data: {
                    status: 'RESOLVED',
                    resolved: true,
                    resolvedAt: new Date(),
                    result: betResult.description
                  }
                }),
                prisma.user.update({
                  where: { id: bet.senderId },
                  data: {
                    balance: { increment: bet.amount }
                  }
                }),
                prisma.user.update({
                  where: { id: bet.receiverId },
                  data: {
                    balance: { increment: bet.amount }
                  }
                })
              ])
              
              console.log(`      ✅ Push - both users refunded $${bet.amount}`)
              
            } else {
              // Win/Loss - update winner's balance and stats
              await prisma.$transaction([
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
                prisma.user.update({
                  where: { id: betResult.winnerId },
                  data: {
                    balance: { increment: betResult.payout },
                    wins: { increment: 1 }
                  }
                }),
                prisma.user.update({
                  where: { id: betResult.loserId },
                  data: {
                    losses: { increment: 1 }
                  }
                })
              ])
              
              const winner = betResult.winnerId === bet.senderId ? bet.sender : bet.receiver
              console.log(`      ✅ Winner: ${winner.username} (+$${betResult.payout})`)
            }
            
          } catch (error) {
            console.error(`   ❌ Error grading bet ${bet.id}:`, error.message)
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing game ${gameKey}:`, error.message)
      }
    }
    
    console.log('\n✅ Settlement process completed')
    
  } catch (error) {
    console.error('❌ Error in settlement process:', error)
  } finally {
    await prisma.$disconnect()
  }
}

settleUserBets()

