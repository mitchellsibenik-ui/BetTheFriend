require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanupUsers() {
  try {
    console.log('Starting user cleanup...')
    
    // Find the test user
    const testUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: 'test', mode: 'insensitive' } },
          { email: { equals: 'test', mode: 'insensitive' } }
        ]
      }
    })
    
    if (!testUser) {
      console.log('⚠️  Test user not found. Creating test user...')
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('test123', 10)
      
      await prisma.user.create({
        data: {
          email: 'test@test.com',
          username: 'test',
          password: hashedPassword,
          balance: 10000,
          wins: 0,
          losses: 0
        }
      })
      console.log('✅ Test user created')
    } else {
      console.log('✅ Test user found:', testUser.username, testUser.email)
    }
    
    // Get test user ID
    const testUserId = testUser?.id || (await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: 'test', mode: 'insensitive' } },
          { email: { equals: 'test', mode: 'insensitive' } }
        ]
      }
    })).id
    
    console.log('Test user ID:', testUserId)
    
    // Get all user IDs except test user
    const allUsers = await prisma.user.findMany()
    const userIdsToDelete = allUsers
      .filter(u => u.id !== testUserId)
      .map(u => u.id)
    console.log(`Found ${userIdsToDelete.length} users to delete`)
    
    if (userIdsToDelete.length > 0) {
      // Delete related records first (in a transaction)
      await prisma.$transaction(async (tx) => {
        // Delete friendships
        await tx.friendship.deleteMany({
          where: {
            OR: [
              { senderId: { in: userIdsToDelete } },
              { receiverId: { in: userIdsToDelete } }
            ]
          }
        })
        console.log('✅ Deleted friendships')
        
        // Delete bets
        await tx.bet.deleteMany({
          where: {
            OR: [
              { senderId: { in: userIdsToDelete } },
              { receiverId: { in: userIdsToDelete } }
            ]
          }
        })
        console.log('✅ Deleted bets')
        
        // Delete notifications
        await tx.notification.deleteMany({
          where: {
            userId: { in: userIdsToDelete }
          }
        })
        console.log('✅ Deleted notifications')
        
        // Delete showdown rooms and related data
        await tx.showdownPick.deleteMany({
          where: {
            participant: {
              userId: { in: userIdsToDelete }
            }
          }
        })
        await tx.showdownParticipant.deleteMany({
          where: {
            userId: { in: userIdsToDelete }
          }
        })
        await tx.showdownRoom.deleteMany({
          where: {
            creatorId: { in: userIdsToDelete }
          }
        })
        console.log('✅ Deleted showdown data')
        
        // Delete chat data
        await tx.chatReadStatus.deleteMany({
          where: {
            userId: { in: userIdsToDelete }
          }
        })
        await tx.chatMessage.deleteMany({
          where: {
            senderId: { in: userIdsToDelete }
          }
        })
        await tx.chatRoom.deleteMany({
          where: {
            OR: [
              { user1Id: { in: userIdsToDelete } },
              { user2Id: { in: userIdsToDelete } }
            ]
          }
        })
        console.log('✅ Deleted chat data')
        
        // Finally delete users
        const deleteResult = await tx.user.deleteMany({
          where: {
            id: { in: userIdsToDelete }
          }
        })
        console.log(`✅ Deleted ${deleteResult.count} users`)
      })
    } else {
      console.log('No users to delete')
    }
    
    // Reset test user balance to 10000
    const updateResult = await prisma.user.update({
      where: { id: testUserId },
      data: {
        balance: 10000,
        wins: 0,
        losses: 0
      }
    })
    
    console.log('✅ Reset test user balance to $10,000')
    console.log('Test user:', updateResult.username, 'Balance:', updateResult.balance)
    
    // List remaining users
    const remainingUsers = await prisma.user.findMany()
    console.log('\n📋 Remaining users:')
    remainingUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Balance: $${user.balance}`)
    })
    
    console.log('\n✅ Cleanup complete!')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanupUsers()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

