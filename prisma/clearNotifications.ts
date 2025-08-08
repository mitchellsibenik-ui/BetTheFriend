import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearNotifications() {
  try {
    console.log('Clearing all notifications...')
    
    const deletedCount = await prisma.notification.deleteMany({})
    
    console.log(`Successfully deleted ${deletedCount.count} notifications`)
  } catch (error) {
    console.error('Error clearing notifications:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearNotifications() 