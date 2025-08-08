import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function settleNationalsBrewersBet() {
  try {
    console.log('Looking for Nationals vs Brewers bet...')
    
    // Find the specific bet
    const bet = await prisma.bet.findFirst({
      where: {
        OR: [
          {
            senderTeam: { contains: 'Nationals' },
            receiverTeam: { contains: 'Brewers' }
          },
          {
            senderTeam: { contains: 'Brewers' },
            receiverTeam: { contains: 'Nationals' }
          }
        ],
        status: 'PENDING'
      },
      include: {
        sender: true,
        receiver: true
      }
    })

    if (!bet) {
      console.log('No pending Nationals vs Brewers bet found.')
      return
    }

    console.log('Found bet:', {
      id: bet.id,
      sender: bet.sender.username,
      receiver: bet.receiver.username,
      senderTeam: bet.senderTeam,
      receiverTeam: bet.receiverTeam,
      betType: bet.betType,
      amount: bet.amount
    })

    // Create or update the game as completed
    let game = await prisma.game.findFirst({
      where: {
        OR: [
          {
            homeTeam: { contains: 'Nationals' },
            awayTeam: { contains: 'Brewers' }
          },
          {
            homeTeam: { contains: 'Brewers' },
            awayTeam: { contains: 'Nationals' }
          }
        ]
      }
    })

    if (!game) {
      // Create the game if it doesn't exist
      game = await prisma.game.create({
        data: {
          homeTeam: 'Washington Nationals',
          awayTeam: 'Milwaukee Brewers',
          startTime: new Date(Date.now() - 86400000), // Yesterday
          endTime: new Date(Date.now() - 3600000), // 1 hour ago
          homeScore: 4, // Nationals score
          awayScore: 2, // Brewers score
          status: 'completed',
          sport: 'baseball',
          league: 'MLB'
        }
      })
      console.log('Created completed game:', game.homeTeam, game.homeScore, '-', game.awayTeam, game.awayScore)
    } else {
      // Update existing game to completed
      game = await prisma.game.update({
        where: { id: game.id },
        data: {
          homeScore: 4, // Nationals score
          awayScore: 2, // Brewers score
          status: 'completed',
          endTime: new Date(Date.now() - 3600000)
        }
      })
      console.log('Updated game to completed:', game.homeTeam, game.homeScore, '-', game.awayTeam, game.awayScore)
    }

    // Update the bet to reference this game
    await prisma.bet.update({
      where: { id: bet.id },
      data: { gameId: game.id }
    })

    console.log('Running bet settlement...')
    
    // Run the settlement script
    const { exec } = require('child_process')
    exec('npx ts-node prisma/settleBets.ts', async (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error('Error running settlement:', error)
        return
      }
      
      console.log('Settlement output:', stdout)
      
      // Check the resolved bet
      const resolvedBet = await prisma.bet.findUnique({
        where: { id: bet.id },
        include: { winner: true, loser: true }
      })
      
      if (resolvedBet && resolvedBet.status === 'RESOLVED') {
        console.log('\n✅ Bet resolved successfully!')
        console.log(`Winner: ${resolvedBet.winner?.username}`)
        console.log(`Loser: ${resolvedBet.loser?.username}`)
        console.log(`Result: ${resolvedBet.result}`)
        console.log(`Amount: $${resolvedBet.amount}`)
      } else {
        console.log('\n❌ Bet was not resolved properly')
      }
      
      await prisma.$disconnect()
    })

  } catch (error) {
    console.error('Error settling Nationals vs Brewers bet:', error)
    await prisma.$disconnect()
  }
}

settleNationalsBrewersBet() 