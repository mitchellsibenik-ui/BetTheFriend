require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
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
  
  const senderPickedHome = bet.senderTeam === homeTeam
  const receiverPickedAway = bet.receiverTeam === awayTeam
  
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

async function manuallySettleBets() {
  try {
    console.log('🔍 Finding bets for mitchsibs and test...\n')
    
    const user1 = await prisma.user.findUnique({ where: { username: 'mitchsibs' } })
    const user2 = await prisma.user.findUnique({ where: { username: 'test' } })
    
    if (!user1 || !user2) {
      console.error('❌ Could not find both users')
      return
    }
    
    const bets = await prisma.bet.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (bets.length === 0) {
      console.log('✅ No active bets to settle.')
      return
    }
    
    // Group by game
    const gameGroups = {}
    for (const bet of bets) {
      const gameDetails = JSON.parse(bet.gameDetails || '{}')
      const gameKey = gameDetails.id || `${gameDetails.home_team}_${gameDetails.away_team}`
      
      if (!gameGroups[gameKey]) {
        gameGroups[gameKey] = {
          gameId: gameDetails.id,
          homeTeam: gameDetails.home_team,
          awayTeam: gameDetails.away_team,
          bets: []
        }
      }
      gameGroups[gameKey].bets.push(bet)
    }
    
    console.log(`📊 Found ${bets.length} bet(s) across ${Object.keys(gameGroups).length} game(s)\n`)
    
    for (const [gameKey, gameData] of Object.entries(gameGroups)) {
      console.log(`\n🎮 Game: ${gameData.homeTeam} vs ${gameData.awayTeam}`)
      console.log(`   ${gameData.bets.length} bet(s) on this game\n`)
      
      // Ask for scores
      const homeScoreInput = await question(`Enter ${gameData.homeTeam} score: `)
      const awayScoreInput = await question(`Enter ${gameData.awayTeam} score: `)
      
      const homeScore = parseInt(homeScoreInput.trim())
      const awayScore = parseInt(awayScoreInput.trim())
      
      if (isNaN(homeScore) || isNaN(awayScore)) {
        console.log('❌ Invalid scores, skipping this game\n')
        continue
      }
      
      console.log(`\n📊 Final Score: ${gameData.homeTeam} ${homeScore} - ${gameData.awayTeam} ${awayScore}\n`)
      
      // Process each bet
      for (const bet of gameData.bets) {
        try {
          console.log(`   💰 Grading bet: ${bet.sender.username} vs ${bet.receiver.username}`)
          console.log(`      Type: ${bet.betType}, Amount: $${bet.amount}`)
          
          const betResult = gradeBet(bet, homeScore, awayScore, gameData.homeTeam, gameData.awayTeam)
          
          console.log(`      Result: ${betResult.result.toUpperCase()}`)
          console.log(`      Description: ${betResult.description}`)
          console.log(`      Payout: $${betResult.payout}`)
          
          if (betResult.result === 'push') {
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
                data: { balance: { increment: bet.amount } }
              }),
              prisma.user.update({
                where: { id: bet.receiverId },
                data: { balance: { increment: bet.amount } }
              })
            ])
            console.log(`      ✅ Push - both users refunded $${bet.amount}`)
          } else {
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
                data: { losses: { increment: 1 } }
              })
            ])
            const winner = betResult.winnerId === bet.senderId ? bet.sender : bet.receiver
            console.log(`      ✅ Winner: ${winner.username} (+$${betResult.payout})`)
          }
          console.log('')
        } catch (error) {
          console.error(`   ❌ Error grading bet ${bet.id}:`, error.message)
        }
      }
    }
    
    console.log('\n✅ Settlement completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

manuallySettleBets()

