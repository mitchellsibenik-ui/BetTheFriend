const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function addCredits() {
  try {
    console.log('💰 Adding $2000 credits to all users...')
    
    // Get current user balances first
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        balance: true
      }
    })

    console.log(`Found ${users.length} users`)

    // Add $2000 to each user's current balance
    for (const user of users) {
      const newBalance = user.balance + 2000
      console.log(`${user.username}: $${user.balance} → $${newBalance}`)
      
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance }
      })
    }

    console.log('\n🎉 Successfully added $2000 to all users!')
    console.log('📊 Summary:')
    console.log(`   • ${users.length} users updated`)
    console.log(`   • Each user received +$2000 credits`)
    console.log(`   • New balances range from $2000 to $${Math.max(...users.map(u => u.balance + 2000))}`)

  } catch (error) {
    console.error('❌ Error adding credits:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
addCredits()
  .then(() => {
    console.log('\n✅ Credits addition script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Credits addition failed:', error)
    process.exit(1)
  }) 