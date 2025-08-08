import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setDefaultBalance() {
  try {
    console.log('Setting default balance of $10,000 for all users...')
    
    // Update all users to have $10,000 balance
    const result = await prisma.user.updateMany({
      data: {
        balance: 10000
      }
    })
    
    console.log(`✅ Updated ${result.count} users with $10,000 balance`)
    
    // Show all users and their balances
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        balance: true
      }
    })
    
    console.log('\n📊 Current user balances:')
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}): $${user.balance}`)
    })
    
  } catch (error) {
    console.error('❌ Error setting default balance:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setDefaultBalance() 