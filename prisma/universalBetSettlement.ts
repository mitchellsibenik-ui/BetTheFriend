import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function settleAllCompletedGames() {
  try {
    console.log('🔍 Looking for completed games with pending bets...')
    
    // Find all completed games
    const completedGames = await prisma.game.findMany({
      where: { status: 'completed' },
      include: {
        bets: {
          where: {
            status: 'PENDING',
            resolved: false
          },
          include: {
            sender: true,
            receiver: true
          }
        }
      }
    })

    if (completedGames.length === 0) {
      console.log('No completed games found.')
      return
    }

    console.log(`Found ${completedGames.length} completed game(s):`)
    completedGames.forEach(game => {
      console.log(`- ${game.homeTeam} ${game.homeScore} vs ${game.awayTeam} ${game.awayScore} (${game.bets.length} pending bets)`)
    })

    // Process each completed game
    for (const game of completedGames) {
      if (game.bets.length === 0) {
        console.log(`\n⏭️  No pending bets for ${game.homeTeam} vs ${game.awayTeam}`)
        continue
      }

      console.log(`\n🏆 Processing ${game.bets.length} bet(s) for ${game.homeTeam} vs ${game.awayTeam}:`)
      
      for (const bet of game.bets) {
        console.log(`\n📊 Bet ID: ${bet.id}`)
        console.log(`   ${bet.sender.username} vs ${bet.receiver.username}`)
        console.log(`   Type: ${bet.betType}, Amount: $${bet.amount}`)
        console.log(`   ${bet.senderTeam} vs ${bet.receiverTeam}`)

        let winnerId = null
        let loserId = null
        let result = ''

        // Parse game details
        const homeScore = game.homeScore ?? 0
        const awayScore = game.awayScore ?? 0

        // Determine winner based on bet type
        if (bet.betType === 'moneyline') {
          const winnerTeam = homeScore > awayScore ? game.homeTeam : game.awayTeam
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
          const senderScore = bet.senderTeam === game.homeTeam ? homeScore + senderSpread : awayScore + senderSpread
          const receiverScore = bet.receiverTeam === game.homeTeam ? homeScore + receiverSpread : awayScore + receiverSpread
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
          // Winner gets the pot (both amounts), loser gets nothing
          prisma.user.update({
            where: { id: winnerId! },
            data: { balance: { increment: bet.amount * 2 } }, // Winner gets both amounts
          }),
          // Loser's balance stays the same (already deducted when bet was accepted)
          // No need to update loser's balance since it was already deducted
        ])

        // Create notifications after the transaction
        await prisma.notification.create({
          data: {
            userId: winnerId!,
            type: 'bet_result',
            message: `You won your bet on ${game.homeTeam} vs ${game.awayTeam}! You won $${bet.amount * 2}!`,
            data: JSON.stringify({ betId: bet.id, result: 'win', amount: bet.amount * 2 }),
          },
        })
        
        await prisma.notification.create({
          data: {
            userId: loserId!,
            type: 'bet_result',
            message: `You lost your bet on ${game.homeTeam} vs ${game.awayTeam}. You lost $${bet.amount}.`,
            data: JSON.stringify({ betId: bet.id, result: 'loss', amount: bet.amount }),
          },
        })

        console.log(`   ✅ ${result}`)
        console.log(`   Winner: ${winnerId === bet.senderId ? bet.sender.username : bet.receiver.username}`)
        console.log(`   Loser: ${loserId === bet.senderId ? bet.sender.username : bet.receiver.username}`)
        
        // Note: Balance updates are handled automatically by the frontend
        // The Navigation component listens for 'balanceUpdate' events and refreshes
        // Users will see updated balances when they refresh the page or navigate
      }
    }

    console.log('\n🎉 All bets for completed games have been settled!')
    
    // Show summary of resolved bets
    const resolvedBets = await prisma.bet.findMany({
      where: { status: 'RESOLVED' },
      include: { winner: true, loser: true },
      orderBy: { resolvedAt: 'desc' },
      take: 5
    })

    if (resolvedBets.length > 0) {
      console.log('\n📋 Recent resolved bets:')
      resolvedBets.forEach(bet => {
        console.log(`- ${bet.winner?.username} won $${bet.amount} from ${bet.loser?.username} (${bet.result})`)
      })
    }

  } catch (error) {
    console.error('❌ Error settling bets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Function to manually complete a game and settle its bets
async function completeGameAndSettleBets(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  sport: string = 'baseball',
  league: string = 'MLB'
) {
  try {
    console.log(`🏟️  Completing game: ${homeTeam} ${homeScore} vs ${awayTeam} ${awayScore}`)
    
    // Find or create the game
    let game = await prisma.game.findFirst({
      where: {
        OR: [
          {
            homeTeam: { contains: homeTeam },
            awayTeam: { contains: awayTeam }
          },
          {
            homeTeam: { contains: awayTeam },
            awayTeam: { contains: homeTeam }
          }
        ]
      }
    })

    if (!game) {
      game = await prisma.game.create({
        data: {
          homeTeam,
          awayTeam,
          startTime: new Date(Date.now() - 86400000), // Yesterday
          endTime: new Date(),
          homeScore,
          awayScore,
          status: 'completed',
          sport,
          league
        }
      })
      console.log(`✅ Created new completed game: ${game.homeTeam} ${game.homeScore} - ${game.awayTeam} ${game.awayScore}`)
    } else {
      game = await prisma.game.update({
        where: { id: game.id },
        data: {
          homeScore,
          awayScore,
          status: 'completed',
          endTime: new Date()
        }
      })
      console.log(`✅ Updated game to completed: ${game.homeTeam} ${game.homeScore} - ${game.awayTeam} ${game.awayScore}`)
    }

    // Now run the settlement
    await settleAllCompletedGames()

  } catch (error) {
    console.error('❌ Error completing game:', error)
    await prisma.$disconnect()
  }
}

// Export functions for use
export { settleAllCompletedGames, completeGameAndSettleBets }

// If running directly, settle all completed games
if (require.main === module) {
  settleAllCompletedGames()
} 