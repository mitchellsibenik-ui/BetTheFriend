import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateUsernamesToLowercase() {
  try {
    const users = await prisma.user.findMany()
    for (const user of users) {
      const lowerUsername = user.username.toLowerCase()
      if (user.username !== lowerUsername) {
        await prisma.user.update({
          where: { id: user.id },
          data: { username: lowerUsername }
        })
        console.log(`Updated username for user ${user.id}: ${user.username} -> ${lowerUsername}`)
      }
    }
    console.log('All usernames migrated to lowercase.')
  } catch (error) {
    console.error('Error migrating usernames:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateUsernamesToLowercase() 