const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testLogin() {
  try {
    const email = 'test@aol.com'
    const password = '123456'
    
    console.log(`🧪 Testing login for ${email} with password: ${password}`)
    
    const user = await prisma.user.findUnique({
      where: { email: email }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log(`✅ User found: ${user.username}`)
    console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`)
    
    if (!user.password) {
      console.log('❌ User has no password')
      return
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log(`\n🔑 Password check result: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
    
    if (!isValid) {
      console.log('\n⚠️  Password does not match!')
      console.log('   Current password hash:', user.password.substring(0, 20) + '...')
      
      // Try password123
      const isValid2 = await bcrypt.compare('password123', user.password)
      console.log(`   Does 'password123' work? ${isValid2 ? '✅ YES' : '❌ NO'}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

