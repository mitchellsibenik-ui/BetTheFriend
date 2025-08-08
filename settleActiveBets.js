const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function settleActiveBets() {
  try {
    console.log('🔧 Manually settling active bets...')
    
    // Find all active bets
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

    console.log(`Found ${activeBets.length} active bets to settle:`)
    
    for (const bet of activeBets) {
      try {
        const gameDetails = JSON.parse(bet.gameDetails || '{}')
        console.log(`\n📊 Settling bet: ${bet.sender.username} vs ${bet.receiver.username}`)
        console.log(`   Game: ${gameDetails.home_team} vs ${gameDetails.away_team}`)
        console.log(`   Amount: $${bet.amount}`)
        console.log(`   Type: ${bet.betType}`)
        
        // For testing purposes, let's simulate a game result
        // In production, this would come from a real sports API
        const homeScore = Math.floor(Math.random() * 10) + 1
        const awayScore = Math.floor(Math.random() * 10) + 1
        
        let winnerId = null
        let loserId = null
        let result = ''

        // Determine winner based on bet type
        if (bet.betType === 'moneyline') {
          const winnerTeam = homeScore > awayScore ? gameDetails.home_team : gameDetails.away_team
          if (bet.senderTeam === winnerTeam) {
            winnerId = bet.senderId
            loserId = bet.receiverId
            result = 'Sender wins (moneyline)'
          } else {
            winnerId = bet.receiverId
            loserId = bet.senderId
            result = 'Receiver wins (moneyline)'
          }
        }
        // Spread
        else if (bet.betType === 'spread') {
          const senderSpread = parseFloat(bet.senderValue || '0')
          const receiverSpread = parseFloat(bet.receiverValue || '0')
          const senderScore = bet.senderTeam === gameDetails.home_team ? homeScore + senderSpread : awayScore + senderSpread
          const receiverScore = bet.receiverTeam === gameDetails.home_team ? homeScore + receiverSpread : awayScore + receiverSpread
          if (senderScore > receiverScore) {
            winnerId = bet.senderId
            loserId = bet.receiverId
            result = 'Sender wins (spread)'
          } else {
            winnerId = bet.receiverId
            loserId = bet.senderId
            result = 'Receiver wins (spread)'
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
              result = 'Sender wins (over)'
            } else {
              winnerId = bet.receiverId
              loserId = bet.senderId
              result = 'Receiver wins (under)'
            }
          } else {
            // Sender picks Under
            if (total < line) {
              winnerId = bet.senderId
              loserId = bet.receiverId
              result = 'Sender wins (under)'
            } else {
              winnerId = bet.receiverId
              loserId = bet.senderId
              result = 'Receiver wins (over)'
            }
          }
        }

        if (winnerId && loserId) {
          // Update bet, balances, and send notifications
          await prisma.$transaction([
            prisma.bet.update({
              where: { id: bet.id },
              data: {
                status: 'RESOLVED',
                resolved: true,
                resolvedAt: new Date(),
                winnerId,
                loserId,
                result,
              },
            }),
            // Winner gets the pot (both amounts)
            prisma.user.update({
              where: { id: winnerId },
              data: { 
                balance: { increment: bet.amount * 2 },
                wins: { increment: 1 }
              },
            }),
            // Loser gets a loss record
            prisma.user.update({
              where: { id: loserId },
              data: { 
                losses: { increment: 1 }
              },
            }),
          ])

          // Create notifications
          await prisma.notification.create({
            data: {
              userId: winnerId,
              type: 'bet_result',
              message: `You won your bet on ${gameDetails.home_team} vs ${gameDetails.away_team}! You won $${bet.amount * 2}!`,
              data: JSON.stringify({ betId: bet.id, result: 'win', amount: bet.amount * 2 }),
            },
          })
          
          await prisma.notification.create({
            data: {
              userId: loserId,
              type: 'bet_result',
              message: `You lost your bet on ${gameDetails.home_team} vs ${gameDetails.away_team}. You lost $${bet.amount}.`,
              data: JSON.stringify({ betId: bet.id, result: 'loss', amount: bet.amount }),
            },
          })

          console.log(`   ✅ Settled: ${result}`)
          console.log(`   Winner: ${winnerId === bet.senderId ? bet.sender.username : bet.receiver.username}`)
          console.log(`   Loser: ${loserId === bet.senderId ? bet.sender.username : bet.receiver.username}`)
          console.log(`   Score: ${gameDetails.home_team} ${homeScore} - ${gameDetails.away_team} ${awayScore}`)
        }
        
      } catch (error) {
        console.error(`❌ Error settling bet ${bet.id}:`, error)
      }
    }

    console.log('\n🎉 All active bets have been settled!')
    
    // Show updated stats
    const users = await prisma.user.findMany({
      select: {
        username: true,
        balance: true,
        wins: true,
        losses: true
      },
      orderBy: [
        { balance: 'desc' },
        { wins: 'desc' }
      ]
    })
    
    console.log('\n📊 Updated user stats:')
    users.forEach((user, index) => {
      const totalGames = user.wins + user.losses
      const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0
      console.log(`#${index + 1} ${user.username}: $${user.balance}, ${user.wins}W/${user.losses}L (${winRate.toFixed(1)}%)`)
    })
    
  } catch (error) {
    console.error('❌ Error settling bets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Export the function
module.exports = { settleActiveBets }

// Run if called directly
if (require.main === module) {
  settleActiveBets()
} 