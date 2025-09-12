const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearAllBetsAndGames() {
  try {
    console.log('🧹 Starting comprehensive cleanup of all bets and games...\n')
    
    // Clear in order to respect foreign key constraints
    
    // 1. Clear ShowdownPicks first (has foreign key to ShowdownParticipant)
    console.log('1️⃣ Clearing ShowdownPicks...')
    const deletedPicks = await prisma.showdownPick.deleteMany({})
    console.log(`   ✅ Deleted ${deletedPicks.count} showdown picks`)
    
    // 2. Clear ShowdownParticipants
    console.log('2️⃣ Clearing ShowdownParticipants...')
    const deletedParticipants = await prisma.showdownParticipant.deleteMany({})
    console.log(`   ✅ Deleted ${deletedParticipants.count} showdown participants`)
    
    // 3. Clear ShowdownRooms
    console.log('3️⃣ Clearing ShowdownRooms...')
    const deletedRooms = await prisma.showdownRoom.deleteMany({})
    console.log(`   ✅ Deleted ${deletedRooms.count} showdown rooms`)
    
    // 4. Clear Bets (has foreign key to Game)
    console.log('4️⃣ Clearing Bets...')
    const deletedBets = await prisma.bet.deleteMany({})
    console.log(`   ✅ Deleted ${deletedBets.count} bets`)
    
    // 5. Clear Games
    console.log('5️⃣ Clearing Games...')
    const deletedGames = await prisma.game.deleteMany({})
    console.log(`   ✅ Deleted ${deletedGames.count} games`)
    
    // 6. Clear Notifications
    console.log('6️⃣ Clearing Notifications...')
    const deletedNotifications = await prisma.notification.deleteMany({})
    console.log(`   ✅ Deleted ${deletedNotifications.count} notifications`)
    
    // 7. Reset user stats (wins/losses) but keep balance
    console.log('7️⃣ Resetting user stats...')
    const resetUsers = await prisma.user.updateMany({
      data: {
        wins: 0,
        losses: 0
      }
    })
    console.log(`   ✅ Reset stats for ${resetUsers.count} users`)
    
    // 8. Show summary
    console.log('\n📊 CLEANUP SUMMARY:')
    console.log('=' .repeat(40))
    console.log(`✅ ShowdownPicks: ${deletedPicks.count}`)
    console.log(`✅ ShowdownParticipants: ${deletedParticipants.count}`)
    console.log(`✅ ShowdownRooms: ${deletedRooms.count}`)
    console.log(`✅ Bets: ${deletedBets.count}`)
    console.log(`✅ Games: ${deletedGames.count}`)
    console.log(`✅ Notifications: ${deletedNotifications.count}`)
    console.log(`✅ User stats reset: ${resetUsers.count}`)
    
    console.log('\n🎉 All bets, games, and related data cleared successfully!')
    console.log('\n📋 What was preserved:')
    console.log('✅ User accounts and login data')
    console.log('✅ User balances (not reset)')
    console.log('✅ Friendships')
    console.log('✅ Chat rooms and messages')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllBetsAndGames()
