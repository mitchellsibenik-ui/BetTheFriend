import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAll() {
  try {
    console.log('Deleting all bets...')
    await prisma.bet.deleteMany({})

    console.log('Deleting all friendships...')
    await prisma.friendship.deleteMany({})

    console.log('Deleting all notifications...')
    await prisma.notification.deleteMany({})

    console.log('Deleting all showdown picks...')
    await prisma.showdownPick.deleteMany({})
    console.log('Deleting all showdown participants...')
    await prisma.showdownParticipant.deleteMany({})
    console.log('Deleting all showdown rooms...')
    await prisma.showdownRoom.deleteMany({})

    console.log('Deleting all users...')
    await prisma.user.deleteMany({})

    console.log('Database cleared!')
  } catch (error) {
    console.error('Error clearing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAll() 