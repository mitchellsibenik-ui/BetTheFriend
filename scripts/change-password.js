const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function changePassword() {
  try {
    const email = process.argv[2]
    const newPassword = process.argv[3]
    
    if (!email || !newPassword) {
      console.log('Usage: node scripts/change-password.js <email> <new-password>')
      process.exit(1)
    }
    
    console.log(`🔐 Changing password for ${email}...`)
    
    const user = await prisma.user.findUnique({
      where: { email: email }
    })
    
    if (!user) {
      console.log(`❌ User not found: ${email}`)
      process.exit(1)
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    
    console.log(`✅ Password changed successfully for ${user.username} (${email})`)
    console.log(`   New password: ${newPassword}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

changePassword()
  .then(() => {
    console.log('\n✅ Complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })

