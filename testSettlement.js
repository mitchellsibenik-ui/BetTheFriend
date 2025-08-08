const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSettlement() {
  try {
    console.log('🧪 Testing bet settlement system...')
    
    // Check for active bets
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
    
    console.log(`Found ${activeBets.length} active bets:`)
    
    activeBets.forEach((bet, index) => {
      const gameDetails = JSON.parse(bet.gameDetails || '{}')
      console.log(`${index + 1}. ${bet.sender.username} vs ${bet.receiver.username}`)
      console.log(`   Game: ${gameDetails.home_team} vs ${gameDetails.away_team}`)
      console.log(`   Amount: $${bet.amount}`)
      console.log(`   Type: ${bet.betType}`)
      console.log(`   Game Time: ${new Date(gameDetails.commence_time).toLocaleString()}`)
      
      // Check if game has finished
      const gameTime = new Date(gameDetails.commence_time)
      const currentTime = new Date()
      const gameEndTime = new Date(gameTime.getTime() + (3 * 60 * 60 * 1000)) // 3 hours
      
      if (currentTime > gameEndTime) {
        console.log(`   ⏰ Game has finished! Ready for settlement.`)
      } else {
        console.log(`   ⏳ Game hasn't finished yet.`)
      }
      console.log('')
    })
    
    // Check resolved bets
    const resolvedBets = await prisma.bet.findMany({
      where: { 
        status: 'RESOLVED'
      },
      include: {
        sender: true,
        receiver: true,
        winner: true,
        loser: true
      }
    })
    
    console.log(`Found ${resolvedBets.length} resolved bets:`)
    resolvedBets.forEach((bet, index) => {
      console.log(`${index + 1}. ${bet.sender.username} vs ${bet.receiver.username}`)
      console.log(`   Result: ${bet.result}`)
      console.log(`   Winner: ${bet.winner?.username}`)
      console.log(`   Loser: ${bet.loser?.username}`)
      console.log(`   Amount: $${bet.amount}`)
      console.log('')
    })
    
    // Check user stats
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
    
    console.log('📊 Current user stats (Leaderboard):')
    users.forEach((user, index) => {
      const totalGames = user.wins + user.losses
      const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0
      console.log(`#${index + 1} ${user.username}: $${user.balance}, ${user.wins}W/${user.losses}L (${winRate.toFixed(1)}%)`)
    })
    
    console.log('\n✅ Settlement system test completed!')
    console.log('\n📝 Summary:')
    console.log(`- Active bets: ${activeBets.length}`)
    console.log(`- Resolved bets: ${resolvedBets.length}`)
    console.log(`- Total users: ${users.length}`)
    
  } catch (error) {
    console.error('❌ Error testing settlement:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSettlement() 