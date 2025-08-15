const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...')
    
    // 1. Reset all user balances to 1000
    console.log('💰 Resetting all user balances to 1000...')
    const balanceUpdate = await prisma.user.updateMany({
      data: {
        balance: 1000,
        wins: 0,
        losses: 0
      }
    })
    console.log(`✅ Updated ${balanceUpdate.count} users with new balances`)

    // 2. Delete all bets (pending, active, settled, expired)
    console.log('🎯 Deleting all bets...')
    const betsDeleted = await prisma.bet.deleteMany({})
    console.log(`✅ Deleted ${betsDeleted.count} bets`)

    // 3. Delete all showdown rooms and participants
    console.log('🏆 Deleting all showdown rooms and participants...')
    
    // Delete picks first (they reference participants)
    const picksDeleted = await prisma.showdownPick.deleteMany({})
    console.log(`✅ Deleted ${picksDeleted.count} showdown picks`)
    
    // Then delete participants (they reference rooms)
    const participantsDeleted = await prisma.showdownParticipant.deleteMany({})
    console.log(`✅ Deleted ${participantsDeleted.count} showdown participants`)
    
    // Finally delete rooms
    const roomsDeleted = await prisma.showdownRoom.deleteMany({})
    console.log(`✅ Deleted ${roomsDeleted.count} showdown rooms`)

    // 4. Delete all notifications
    console.log('🔔 Deleting all notifications...')
    const notificationsDeleted = await prisma.notification.deleteMany({})
    console.log(`✅ Deleted ${notificationsDeleted.count} notifications`)

    // 5. Delete all games (since they're tied to bets)
    console.log('⚽ Deleting all games...')
    const gamesDeleted = await prisma.game.deleteMany({})
    console.log(`✅ Deleted ${gamesDeleted.count} games`)

    console.log('\n🎉 Database reset completed successfully!')
    console.log('📊 Summary:')
    console.log(`   • All users now have 1000 credits`)
    console.log(`   • All betting history cleared`)
    console.log(`   • All showdown rooms deleted`)
    console.log(`   • All notifications cleared`)
    console.log(`   • All games deleted`)
    console.log(`   • All user win/loss records reset to 0`)

  } catch (error) {
    console.error('❌ Error during database reset:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('\n✅ Database reset script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Database reset failed:', error)
    process.exit(1)
  }) 