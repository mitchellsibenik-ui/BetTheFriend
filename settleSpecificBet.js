require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

// Calculate sportsbook payout based on odds
function calculateSportsbookPayout(odds, stake) {
  if (odds > 0) {
    return (stake * odds) / 100
  } else {
    return (stake * 100) / Math.abs(odds)
  }
}

async function settleWinnipegVancouverBet() {
  try {
    console.log('🔍 Finding Winnipeg Jets vs Vancouver Canucks bet...\n')
    
    // Find the specific bet
    const bets = await prisma.bet.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'ACCEPTED' }
        ],
        resolved: false,
        gameDetails: {
          contains: 'Winnipeg Jets'
        }
      },
      include: {
        sender: true,
        receiver: true
      }
    })
    
    console.log(`Found ${bets.length} active bet(s) with Winnipeg Jets\n`)
    
    for (const bet of bets) {
      const gameDetails = JSON.parse(bet.gameDetails || '{}')
      console.log(`Bet ID: ${bet.id}`)
      console.log(`  Game: ${gameDetails.home_team} vs ${gameDetails.away_team}`)
      console.log(`  Sender: ${bet.sender.username} (${bet.senderTeam})`)
      console.log(`  Receiver: ${bet.receiver.username} (${bet.receiverTeam})`)
      console.log(`  Type: ${bet.betType}`)
      console.log(`  Amount: $${bet.amount}`)
      console.log(`  Game ID: ${gameDetails.id}`)
      console.log(`  Sport: ${gameDetails.sport_key}`)
      console.log('')
      
      // Try to fetch from API
      const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY
      let gameResult = null
      
      try {
        let response
        try {
          response = await axios.get(`https://api.the-odds-api.com/v4/sports/${gameDetails.sport_key}/scores`, {
            params: { apiKey: apiKey }
          })
        } catch (e1) {
          response = await axios.get(`https://api.the-odds-api.com/v4/sports/${gameDetails.sport_key}/scores`, {
            headers: { 'x-api-key': apiKey }
          })
        }
        
        gameResult = response.data.find(g => 
          g.id === gameDetails.id ||
          (g.home_team?.includes('Vancouver') && g.away_team?.includes('Winnipeg')) ||
          (g.home_team?.includes('Winnipeg') && g.away_team?.includes('Vancouver'))
        )
        
        if (gameResult && gameResult.completed && gameResult.scores) {
          console.log(`✅ Found game result in API!`)
          console.log(`  Score: ${gameResult.scores.map(s => `${s.name} ${s.score}`).join(' - ')}`)
        }
      } catch (error) {
        console.log(`⚠️  Could not fetch from API: ${error.message}`)
      }
      
      // Ask for manual input
      const readline = require('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      const question = (query) => new Promise(resolve => rl.question(query, resolve))
      
      let homeScore, awayScore
      
      if (gameResult && gameResult.completed && gameResult.scores) {
        // Extract scores from API
        const homeTeam = gameDetails.home_team
        const awayTeam = gameDetails.away_team
        
        const homeScoreData = gameResult.scores.find(s => 
          s.name === homeTeam || 
          s.name?.toLowerCase().includes(homeTeam.toLowerCase())
        )
        const awayScoreData = gameResult.scores.find(s => 
          s.name === awayTeam || 
          s.name?.toLowerCase().includes(awayTeam.toLowerCase())
        )
        
        if (homeScoreData && awayScoreData) {
          homeScore = parseInt(homeScoreData.score)
          awayScore = parseInt(awayScoreData.score)
          console.log(`\n📊 Using API scores: ${homeTeam} ${homeScore} - ${awayTeam} ${awayScore}`)
        } else {
          // Try by index
          homeScore = parseInt(gameResult.scores[0]?.score || gameResult.scores[0] || '0')
          awayScore = parseInt(gameResult.scores[1]?.score || gameResult.scores[1] || '0')
          console.log(`\n📊 Using API scores (by index): ${homeScore} - ${awayScore}`)
        }
      } else {
        // Manual input
        console.log(`\n⚠️  Game result not found in API. Please enter scores manually:`)
        const homeInput = await question(`Enter ${gameDetails.home_team} score: `)
        const awayInput = await question(`Enter ${gameDetails.away_team} score: `)
        homeScore = parseInt(homeInput.trim())
        awayScore = parseInt(awayInput.trim())
      }
      
      rl.close()
      
      if (isNaN(homeScore) || isNaN(awayScore)) {
        console.log('❌ Invalid scores, skipping this bet')
        continue
      }
      
      console.log(`\n📊 Final Score: ${gameDetails.home_team} ${homeScore} - ${gameDetails.awayTeam} ${awayScore}`)
      
      // Grade the bet
      const senderOdds = parseInt(bet.senderValue) || -110
      const receiverOdds = parseInt(bet.receiverValue) || -110
      
      let actualWinner
      if (homeScore > awayScore) {
        actualWinner = gameDetails.home_team
      } else if (awayScore > homeScore) {
        actualWinner = gameDetails.away_team
      } else {
        // Tie - push
        console.log(`\n🤝 TIE - Bet is a push, refunding both players`)
        await prisma.$transaction([
          prisma.bet.update({
            where: { id: bet.id },
            data: {
              status: 'RESOLVED',
              resolved: true,
              resolvedAt: new Date(),
              result: `Game tied ${homeScore}-${awayScore}, bet pushed`
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
        console.log(`✅ Bet settled as push`)
        continue
      }
      
      // Determine winner
      let winnerId, loserId, payout
      
      if (bet.senderTeam === actualWinner) {
        const winnings = calculateSportsbookPayout(senderOdds, bet.amount)
        winnerId = bet.senderId
        loserId = bet.receiverId
        payout = bet.amount + winnings
        console.log(`\n🏆 Winner: ${bet.sender.username} (${bet.senderTeam})`)
        console.log(`   Payout: $${payout} (stake: $${bet.amount} + winnings: $${winnings.toFixed(2)})`)
      } else {
        const winnings = calculateSportsbookPayout(receiverOdds, bet.amount)
        winnerId = bet.receiverId
        loserId = bet.senderId
        payout = bet.amount + winnings
        console.log(`\n🏆 Winner: ${bet.receiver.username} (${bet.receiverTeam})`)
        console.log(`   Payout: $${payout} (stake: $${bet.amount} + winnings: $${winnings.toFixed(2)})`)
      }
      
      // Update database
      await prisma.$transaction([
        prisma.bet.update({
          where: { id: bet.id },
          data: {
            status: 'RESOLVED',
            resolved: true,
            resolvedAt: new Date(),
            winnerId: winnerId,
            loserId: loserId,
            result: `${actualWinner} won ${homeScore}-${awayScore}`
          }
        }),
        prisma.user.update({
          where: { id: winnerId },
          data: {
            balance: { increment: payout },
            wins: { increment: 1 }
          }
        }),
        prisma.user.update({
          where: { id: loserId },
          data: { losses: { increment: 1 } }
        })
      ])
      
      console.log(`✅ Bet settled successfully!`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

settleWinnipegVancouverBet()

