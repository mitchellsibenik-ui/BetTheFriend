const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function resetAllPasswords() {
  try {
    console.log('🔐 Resetting all user passwords...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true
      }
    })
    
    console.log(`\n📊 Found ${users.length} user(s)`)
    
    // Reset password to 'password123' for all users
    const newPassword = 'password123'
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    let updated = 0
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      updated++
      console.log(`✅ Reset password for: ${user.username} (${user.email})`)
    }
    
    console.log(`\n🎉 Successfully reset passwords for ${updated} user(s)`)
    console.log(`\n📝 All users can now log in with:`)
    console.log(`   Email: (their email address)`)
    console.log(`   Password: ${newPassword}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetAllPasswords()
  .then(() => {
    console.log('\n✅ Password reset complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Password reset failed:', error)
    process.exit(1)
  })

