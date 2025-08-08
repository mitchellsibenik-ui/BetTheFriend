import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resolveBets() {
  try {
    // 1. Find all completed games
    const completedGames = await prisma.game.findMany({
      where: { status: 'completed' },
    })
    if (completedGames.length === 0) {
      console.log('No completed games found.')
      return
    }
    // 2. For each completed game, resolve all unresolved bets
    for (const game of completedGames) {
      const unresolvedBets = await prisma.bet.findMany({
        where: {
          gameId: game.id,
          status: 'PENDING',
          resolved: false,
        },
      })
      if (unresolvedBets.length === 0) continue
      for (const bet of unresolvedBets) {
        let winnerId = null
        let loserId = null
        let result = ''
        // Parse game details
        const homeScore = game.homeScore ?? 0
        const awayScore = game.awayScore ?? 0
        // Moneyline
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
          // Sender picks Over, receiver gets Under
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
        // Update bet, balances, stats, and send notifications
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
          // Winner gets the amount, loser loses the amount
          prisma.user.update({
            where: { id: winnerId! },
            data: { balance: { increment: bet.amount } },
          }),
          prisma.user.update({
            where: { id: loserId! },
            data: { balance: { decrement: bet.amount } },
          }),
          // Update stats (optional, can be expanded)
          prisma.notification.create({
            data: {
              userId: winnerId!,
              type: 'bet_result',
              message: `You won your bet on ${game.homeTeam} vs ${game.awayTeam}!`,
              data: JSON.stringify({ betId: bet.id, result: 'win' }),
            },
          }),
          prisma.notification.create({
            data: {
              userId: loserId!,
              type: 'bet_result',
              message: `You lost your bet on ${game.homeTeam} vs ${game.awayTeam}.`,
              data: JSON.stringify({ betId: bet.id, result: 'loss' }),
            },
          }),
        ])
        console.log(`Bet ${bet.id} resolved: Winner ${winnerId}, Loser ${loserId}`)
      }
    }
    // TODO: Update leaderboard logic here if needed
    console.log('All eligible bets resolved.')
  } catch (error) {
    console.error('Error resolving bets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resolveBets() 