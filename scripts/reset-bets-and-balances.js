const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function resetBetsAndBalances() {
  try {
    console.log('🔄 Starting reset process...\n')

    // Step 1: Delete all active bets
    console.log('📋 Step 1: Removing all active bets...')
    
    const activeBets = await prisma.bet.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'ACCEPTED' },
          { status: 'PENDING' }
        ]
      },
      select: {
        id: true,
        status: true,
        amount: true,
        senderId: true,
        receiverId: true
      }
    })

    console.log(`   Found ${activeBets.length} active/pending bets to remove`)

    if (activeBets.length > 0) {
      // Refund all users who have money locked in active bets
      const refunds = new Map()
      
      for (const bet of activeBets) {
        // Refund sender
        if (!refunds.has(bet.senderId)) {
          refunds.set(bet.senderId, 0)
        }
        refunds.set(bet.senderId, refunds.get(bet.senderId) + bet.amount)
        
        // Refund receiver if bet was accepted
        if (bet.status === 'ACTIVE' || bet.status === 'ACCEPTED') {
          if (!refunds.has(bet.receiverId)) {
            refunds.set(bet.receiverId, 0)
          }
          refunds.set(bet.receiverId, refunds.get(bet.receiverId) + bet.amount)
        }
      }

      // Apply refunds
      for (const [userId, amount] of refunds.entries()) {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: amount } }
        })
        console.log(`   ✅ Refunded $${amount} to user ${userId}`)
      }

      // Delete all active/pending bets
      const deleteResult = await prisma.bet.deleteMany({
        where: {
          OR: [
            { status: 'ACTIVE' },
            { status: 'ACCEPTED' },
            { status: 'PENDING' }
          ]
        }
      })

      console.log(`   ✅ Deleted ${deleteResult.count} active/pending bets\n`)
    } else {
      console.log('   ℹ️  No active bets to remove\n')
    }

    // Step 2: Reset all user balances to $10,000
    console.log('💰 Step 2: Resetting all user balances to $10,000...')
    
    const resetResult = await prisma.user.updateMany({
      data: {
        balance: 10000
      }
    })

    console.log(`   ✅ Reset ${resetResult.count} user balances to $10,000\n`)

    // Step 3: Show summary
    console.log('📊 Step 3: Current user status...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        wins: true,
        losses: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`\n   Total Users: ${users.length}`)
    console.log('   ──────────────────────────────────────────────────────────────────────────────\n')

    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username}`)
      console.log(`      Email: ${user.email}`)
      console.log(`      Balance: $${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
      console.log(`      Record: ${user.wins}W - ${user.losses}L`)
      console.log('')
    })

    // Count remaining bets
    const remainingBets = await prisma.bet.count()
    console.log(`\n   Remaining bets in database: ${remainingBets} (should only be RESOLVED bets)`)

    console.log('\n✅ Reset process completed successfully!')

  } catch (error) {
    console.error('❌ Error during reset:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetBetsAndBalances()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

