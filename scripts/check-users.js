const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        balance: true
      }
    })
    
    console.log(`\n📊 Found ${users.length} user(s) in database:`)
    
    if (users.length === 0) {
      console.log('\n⚠️  No users found! Need to seed database.')
      console.log('Run: npx prisma db seed')
      return
    }
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.username}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Balance: $${user.balance}`)
      console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`)
      
      if (user.password) {
        // Test if password works
        const testPassword = 'password123'
        const isValid = await bcrypt.compare(testPassword, user.password)
        console.log(`   Password 'password123' works: ${isValid ? 'Yes ✅' : 'No ❌'}`)
      }
    }
    
    // Test login with first user
    if (users.length > 0) {
      const testUser = users[0]
      console.log(`\n🧪 Testing login for: ${testUser.email}`)
      
      if (!testUser.password) {
        console.log('   ❌ User has no password - need to reset')
        const hashedPassword = await bcrypt.hash('password123', 10)
        await prisma.user.update({
          where: { id: testUser.id },
          data: { password: hashedPassword }
        })
        console.log('   ✅ Password reset to "password123"')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
  .then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error)
    process.exit(1)
  })

