import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })
config({ path: resolve(__dirname, '../.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetBetsAndBalances() {
  try {
    console.log('🔄 Starting reset process...')
    console.log('')
    
    // Step 1: Find and delete all active bets
    console.log('📋 Step 1: Finding all active bets...')
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
        senderId: true,
        receiverId: true,
        amount: true
      }
    })
    
    console.log(`   Found ${activeBets.length} active/pending bet(s)`)
    
    if (activeBets.length > 0) {
      // Refund balances before deleting bets
      console.log('   Refunding balances to users...')
      
      const refunds: { [userId: string]: number } = {}
      
      for (const bet of activeBets) {
        // Refund sender
        if (!refunds[bet.senderId]) {
          refunds[bet.senderId] = 0
        }
        refunds[bet.senderId] += bet.amount
        
        // Refund receiver if bet was accepted
        if (bet.status === 'ACTIVE' || bet.status === 'ACCEPTED') {
          if (!refunds[bet.receiverId]) {
            refunds[bet.receiverId] = 0
          }
          refunds[bet.receiverId] += bet.amount
        }
      }
      
      // Apply refunds
      for (const [userId, amount] of Object.entries(refunds)) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: { increment: amount }
          }
        })
        console.log(`   ✅ Refunded $${amount} to user ${userId}`)
      }
      
      // Delete all active/pending bets
      console.log('   Deleting active/pending bets...')
      const deleteResult = await prisma.bet.deleteMany({
        where: {
          OR: [
            { status: 'ACTIVE' },
            { status: 'ACCEPTED' },
            { status: 'PENDING' }
          ]
        }
      })
      
      console.log(`   ✅ Deleted ${deleteResult.count} bet(s)`)
    } else {
      console.log('   No active bets to delete')
    }
    
    console.log('')
    
    // Step 2: Reset all user balances to 1000
    console.log('📋 Step 2: Resetting all user balances to $1000...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        balance: true
      }
    })
    
    console.log(`   Found ${users.length} user(s)`)
    
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: 1000
        }
      })
      console.log(`   ✅ Reset ${user.username}'s balance from $${user.balance} to $1000`)
    }
    
    console.log('')
    console.log('✅ Reset completed successfully!')
    console.log('')
    console.log('Summary:')
    console.log(`   - Active bets deleted: ${activeBets.length}`)
    console.log(`   - User balances reset: ${users.length}`)
    console.log(`   - All balances set to: $1000`)
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during reset:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

resetBetsAndBalances()

