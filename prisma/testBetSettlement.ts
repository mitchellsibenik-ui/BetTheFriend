import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestData() {
  try {
    console.log('Creating test data...')

    // Create test users if they don't exist
    const user1 = await prisma.user.upsert({
      where: { email: 'test1@example.com' },
      update: {},
      create: {
        email: 'test1@example.com',
        username: 'testuser1',
        password: 'hashedpassword',
        balance: 1000
      }
    })

    const user2 = await prisma.user.upsert({
      where: { email: 'test2@example.com' },
      update: {},
      create: {
        email: 'test2@example.com',
        username: 'testuser2',
        password: 'hashedpassword',
        balance: 1000
      }
    })

    console.log('Test users created:', user1.username, user2.username)

    // Create a completed game
    const game = await prisma.game.create({
      data: {
        homeTeam: 'Lakers',
        awayTeam: 'Warriors',
        startTime: new Date(Date.now() - 86400000), // Yesterday
        endTime: new Date(Date.now() - 3600000), // 1 hour ago
        homeScore: 105,
        awayScore: 98,
        status: 'completed',
        sport: 'basketball',
        league: 'NBA'
      }
    })

    console.log('Test game created:', game.homeTeam, 'vs', game.awayTeam, 'Final:', game.homeScore, '-', game.awayScore)

    // Create test bets
    const bet1 = await prisma.bet.create({
      data: {
        gameId: game.id,
        senderId: user1.id,
        receiverId: user2.id,
        senderTeam: 'Lakers',
        receiverTeam: 'Warriors',
        betType: 'moneyline',
        senderValue: '-110',
        receiverValue: '+110',
        amount: 100,
        message: 'Test moneyline bet',
        status: 'PENDING',
        resolved: false
      }
    })

    const bet2 = await prisma.bet.create({
      data: {
        gameId: game.id,
        senderId: user2.id,
        receiverId: user1.id,
        senderTeam: 'Over',
        receiverTeam: 'Under',
        betType: 'overUnder',
        senderValue: '200.5',
        receiverValue: '200.5',
        amount: 50,
        message: 'Test over/under bet',
        status: 'PENDING',
        resolved: false
      }
    })

    console.log('Test bets created:')
    console.log('- Moneyline bet:', bet1.id, '(Lakers vs Warriors)')
    console.log('- Over/Under bet:', bet2.id, '(Over/Under 200.5)')

    console.log('\nInitial balances:')
    console.log(`${user1.username}: $${user1.balance}`)
    console.log(`${user2.username}: $${user2.balance}`)

    console.log('\nRunning bet settlement...')
    
    // Import and run the settlement script
    const { exec } = require('child_process')
    exec('npx ts-node prisma/settleBets.ts', async (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error('Error running settlement:', error)
        return
      }
      
      console.log('Settlement output:', stdout)
      
      // Check final balances
      const finalUser1 = await prisma.user.findUnique({ where: { id: user1.id } })
      const finalUser2 = await prisma.user.findUnique({ where: { id: user2.id } })
      
      console.log('\nFinal balances after settlement:')
      console.log(`${finalUser1?.username}: $${finalUser1?.balance}`)
      console.log(`${finalUser2?.username}: $${finalUser2?.balance}`)
      
      // Check resolved bets
      const resolvedBets = await prisma.bet.findMany({
        where: { gameId: game.id, status: 'RESOLVED' },
        include: { winner: true, loser: true }
      })
      
      console.log('\nResolved bets:')
      resolvedBets.forEach(bet => {
        console.log(`- Bet ${bet.id}: ${bet.winner?.username} wins, ${bet.loser?.username} loses (${bet.result})`)
      })
      
      await prisma.$disconnect()
    })

  } catch (error) {
    console.error('Error creating test data:', error)
    await prisma.$disconnect()
  }
}

createTestData() 