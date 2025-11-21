const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

const testAccounts = [
  { email: 'MitchSibs@outlook.com', password: 'Buffalo$2021' },
  { email: 'test@aol.com', password: '123456' },
  { email: 'demo1@betthefriend.com', password: 'password123' },
  { email: 'demo2@betthefriend.com', password: 'password123' }
]

async function testAllLogins() {
  console.log('🧪 Testing multiple login accounts...\n')
  
  for (const account of testAccounts) {
    try {
      console.log(`Testing: ${account.email}`)
      
      // Find user
      const normalizedEmail = account.email.toLowerCase().trim()
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      })
      
      if (!user) {
        user = await prisma.user.findUnique({
          where: { email: account.email.trim() }
        })
      }
      
      if (!user) {
        console.log(`  ❌ User not found\n`)
        continue
      }
      
      console.log(`  ✅ User found: ${user.username}`)
      console.log(`  📧 Stored email: ${user.email}`)
      
      if (!user.password) {
        console.log(`  ❌ No password set\n`)
        continue
      }
      
      // Test password
      const isValid = await bcrypt.compare(account.password, user.password)
      console.log(`  🔑 Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
      
      if (!isValid) {
        console.log(`  ⚠️  Updating password...`)
        const hashedPassword = await bcrypt.hash(account.password, 10)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })
        console.log(`  ✅ Password updated\n`)
      } else {
        console.log(`  ✅ Login would succeed\n`)
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`)
    }
  }
  
  await prisma.$disconnect()
}

testAllLogins()
  .then(() => {
    console.log('✅ All tests complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })

