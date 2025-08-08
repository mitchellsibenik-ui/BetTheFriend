const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixNationalsGame() {
  try {
    console.log('🔧 Fixing Nationals vs Brewers game settlement...')
    
    // Find the specific bet for Nationals vs Brewers
    const bets = await prisma.bet.findMany({
      where: { 
        status: 'RESOLVED',
        gameDetails: {
          contains: 'Nationals'
        }
      },
      include: {
        sender: true,
        receiver: true
      }
    })

    console.log(`Found ${bets.length} Nationals bets to fix:`)
    
    for (const bet of bets) {
      try {
        const gameDetails = JSON.parse(bet.gameDetails || '{}')
        console.log(`\n📊 Fixing bet: ${bet.sender.username} vs ${bet.receiver.username}`)
        console.log(`   Game: ${gameDetails.home_team} vs ${gameDetails.away_team}`)
        console.log(`   Current winner: ${bet.winnerId === bet.senderId ? bet.sender.username : bet.receiver.username}`)
        console.log(`   Current loser: ${bet.loserId === bet.senderId ? bet.sender.username : bet.receiver.username}`)
        
        // Set the correct result: Brewers won (away team)
        const correctHomeScore = 2  // Nationals
        const correctAwayScore = 4  // Brewers
        
        let winnerId = null
        let loserId = null
        let result = ''

        // Determine correct winner based on bet type
        if (bet.betType === 'moneyline') {
          // Brewers won (away team)
          const winnerTeam = gameDetails.away_team
          if (bet.senderTeam === winnerTeam) {
            winnerId = bet.senderId
            loserId = bet.receiverId
            result = 'Sender wins (moneyline) - Brewers'
          } else {
            winnerId = bet.receiverId
            loserId = bet.senderId
            result = 'Receiver wins (moneyline) - Brewers'
          }
        }
        // Spread
        else if (bet.betType === 'spread') {
          const senderSpread = parseFloat(bet.senderValue || '0')
          const receiverSpread = parseFloat(bet.receiverValue || '0')
          const senderScore = bet.senderTeam === gameDetails.home_team ? correctHomeScore + senderSpread : correctAwayScore + senderSpread
          const receiverScore = bet.receiverTeam === gameDetails.home_team ? correctHomeScore + receiverSpread : correctAwayScore + receiverSpread
          if (senderScore > receiverScore) {
            winnerId = bet.senderId
            loserId = bet.receiverId
            result = 'Sender wins (spread) - Brewers'
          } else {
            winnerId = bet.receiverId
            loserId = bet.senderId
            result = 'Receiver wins (spread) - Brewers'
          }
        }
        // Over/Under
        else if (bet.betType === 'overUnder') {
          const total = correctHomeScore + correctAwayScore
          const line = parseFloat(bet.senderValue || '0')
          if (bet.senderTeam === 'Over') {
            if (total > line) {
              winnerId = bet.senderId
              loserId = bet.receiverId
              result = 'Sender wins (over) - Brewers'
            } else {
              winnerId = bet.receiverId
              loserId = bet.senderId
              result = 'Receiver wins (under) - Brewers'
            }
          } else {
            // Sender picks Under
            if (total < line) {
              winnerId = bet.senderId
              loserId = bet.receiverId
              result = 'Sender wins (under) - Brewers'
            } else {
              winnerId = bet.receiverId
              loserId = bet.senderId
              result = 'Receiver wins (over) - Brewers'
            }
          }
        }

        if (winnerId && loserId) {
          console.log(`   Correct winner: ${winnerId === bet.senderId ? bet.sender.username : bet.receiver.username}`)
          console.log(`   Correct loser: ${loserId === bet.senderId ? bet.sender.username : bet.receiver.username}`)
          console.log(`   Score: ${gameDetails.home_team} ${correctHomeScore} - ${gameDetails.away_team} ${correctAwayScore}`)
          
          // Update the bet with correct result
          await prisma.bet.update({
            where: { id: bet.id },
            data: {
              winnerId: winnerId,
              loserId: loserId,
              result: result
            }
          })
          
          console.log(`   ✅ Fixed bet ${bet.id}`)
        }
      } catch (error) {
        console.error(`❌ Error fixing bet ${bet.id}:`, error)
      }
    }
    
    console.log('\n🎉 Nationals game settlement fixed!')
  } catch (error) {
    console.error('❌ Error fixing Nationals game:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixNationalsGame() 