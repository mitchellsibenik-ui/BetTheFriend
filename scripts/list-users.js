require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function listUsers() {
  try {
    console.log('📋 Fetching all users from database...\n')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        balance: true,
        wins: true,
        losses: true,
        favoriteTeam: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📊 Total Users: ${users.length}\n`)
    console.log('=' .repeat(100))
    
    if (users.length === 0) {
      console.log('\n⚠️  No users found in database.')
      return
    }
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.username}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      if (user.name) {
        console.log(`   Name: ${user.name}`)
      }
      console.log(`   Balance: $${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      console.log(`   Record: ${user.wins}W - ${user.losses}L`)
      if (user.favoriteTeam) {
        console.log(`   Favorite Team: ${user.favoriteTeam}`)
      }
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`)
      console.log('   ' + '-'.repeat(96))
    })
    
    // Summary statistics
    const totalBalance = users.reduce((sum, user) => sum + user.balance, 0)
    const totalWins = users.reduce((sum, user) => sum + user.wins, 0)
    const totalLosses = users.reduce((sum, user) => sum + user.losses, 0)
    const avgBalance = totalBalance / users.length
    
    console.log('\n' + '='.repeat(100))
    console.log('\n📈 Summary Statistics:')
    console.log(`   Total Users: ${users.length}`)
    console.log(`   Total Balance: $${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Average Balance: $${avgBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Total Wins: ${totalWins}`)
    console.log(`   Total Losses: ${totalLosses}`)
    console.log(`   Total Games: ${totalWins + totalLosses}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
  .then(() => {
    console.log('\n✅ List complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })


