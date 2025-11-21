const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testLogin() {
  try {
    const email = 'MitchSibs@outlook.com'
    const password = 'Buffalo$2021'
    
    console.log(`🧪 Testing login for ${email}`)
    console.log(`   Password: ${password}`)
    
    const user = await prisma.user.findUnique({
      where: { email: email }
    })
    
    if (!user) {
      console.log(`❌ User not found: ${email}`)
      
      // Try lowercase
      const lowerEmail = email.toLowerCase()
      const userLower = await prisma.user.findUnique({
        where: { email: lowerEmail }
      })
      
      if (userLower) {
        console.log(`✅ Found user with lowercase email: ${lowerEmail}`)
        console.log(`   Username: ${userLower.username}`)
        
        if (!userLower.password) {
          console.log('❌ User has no password')
          return
        }
        
        const isValid = await bcrypt.compare(password, userLower.password)
        console.log(`🔑 Password check: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
        
        if (!isValid) {
          console.log('\n⚠️  Password does not match. Updating password...')
          const hashedPassword = await bcrypt.hash(password, 10)
          await prisma.user.update({
            where: { id: userLower.id },
            data: { password: hashedPassword }
          })
          console.log('✅ Password updated successfully')
        }
      } else {
        console.log(`❌ User not found with lowercase email either`)
      }
      return
    }
    
    console.log(`✅ User found: ${user.username}`)
    console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`)
    
    if (!user.password) {
      console.log('❌ User has no password. Setting password...')
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      console.log('✅ Password set successfully')
      return
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log(`\n🔑 Password check result: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
    
    if (!isValid) {
      console.log('\n⚠️  Password does not match. Updating password...')
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      console.log('✅ Password updated successfully')
      console.log(`\n📝 You can now log in with:`)
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${password}`)
    } else {
      console.log('\n✅ Login credentials are correct!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
  .then(() => {
    console.log('\n✅ Test complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })

