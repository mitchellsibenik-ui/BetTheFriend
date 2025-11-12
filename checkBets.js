require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkBets() {
  try {
    const user1 = await prisma.user.findUnique({ where: { username: 'mitchsibs' } })
    const user2 = await prisma.user.findUnique({ where: { username: 'test' } })
    
    if (!user1 || !user2) {
      console.error('Could not find both users')
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
      }
    })
    
    console.log(`Found ${bets.length} active bets:\n`)
    
    for (const bet of bets) {
      const gameDetails = JSON.parse(bet.gameDetails || '{}')
      console.log(`Bet ID: ${bet.id}`)
      console.log(`  Game: ${gameDetails.home_team} vs ${gameDetails.away_team}`)
      console.log(`  Sport: ${gameDetails.sport_key}`)
      console.log(`  Game ID: ${gameDetails.id}`)
      console.log(`  Commence Time: ${gameDetails.commence_time}`)
      console.log(`  Bet Type: ${bet.betType}`)
      console.log(`  Amount: $${bet.amount}`)
      console.log(`  Status: ${bet.status}`)
      console.log(`  Created: ${bet.createdAt}`)
      console.log('')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBets()

