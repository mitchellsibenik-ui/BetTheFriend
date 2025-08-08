import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearDatabase() {
  try {
    console.log('Starting database cleanup...')

    // Delete all records in reverse order of dependencies
    console.log('Deleting ShowdownPicks...')
    await prisma.showdownPick.deleteMany({})
    
    console.log('Deleting ShowdownParticipants...')
    await prisma.showdownParticipant.deleteMany({})
    
    console.log('Deleting ShowdownRooms...')
    await prisma.showdownRoom.deleteMany({})
    
    console.log('Deleting Notifications...')
    await prisma.notification.deleteMany({})
    
    console.log('Deleting Friendships...')
    await prisma.friendship.deleteMany({})
    
    console.log('Deleting Users...')
    await prisma.user.deleteMany({})

    console.log('Database cleanup completed successfully!')
  } catch (error) {
    console.error('Error during database cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase() 