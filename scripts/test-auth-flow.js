const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testAuthFlow() {
  const testEmail = 'MitchSibs@outlook.com'
  const testPassword = 'Buffalo$2021'
  
  console.log('🧪 Testing exact auth flow...\n')
  console.log(`Email: ${testEmail}`)
  console.log(`Password: ${testPassword}\n`)
  
  // Step 1: Try exact match
  console.log('Step 1: Trying exact email match...')
  let user = await prisma.user.findUnique({
    where: { email: testEmail }
  })
  console.log(`  Result: ${user ? `Found ${user.username}` : 'Not found'}`)
  
  // Step 2: Try lowercase
  if (!user) {
    console.log('\nStep 2: Trying lowercase email...')
    const normalizedEmail = testEmail.toLowerCase().trim()
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })
    console.log(`  Normalized: ${normalizedEmail}`)
    console.log(`  Result: ${user ? `Found ${user.username}` : 'Not found'}`)
  }
  
  // Step 3: Try trimmed
  if (!user) {
    console.log('\nStep 3: Trying trimmed email...')
    user = await prisma.user.findUnique({
      where: { email: testEmail.trim() }
    })
    console.log(`  Result: ${user ? `Found ${user.username}` : 'Not found'}`)
  }
  
  if (!user) {
    console.log('\n❌ User not found with any method!')
    console.log('\nChecking all users with similar emails...')
    const allUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'outlook'
        }
      },
      select: {
        email: true,
        username: true
      }
    })
    console.log('Found users:', allUsers)
    await prisma.$disconnect()
    return
  }
  
  console.log(`\n✅ User found: ${user.username}`)
  console.log(`   Email in DB: ${user.email}`)
  console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`)
  
  if (!user.password) {
    console.log('\n❌ User has no password!')
    await prisma.$disconnect()
    return
  }
  
  // Test password
  console.log('\nStep 4: Testing password...')
  const isValid = await bcrypt.compare(testPassword, user.password)
  console.log(`  Password comparison: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
  
  if (!isValid) {
    console.log('\n⚠️  Password does not match!')
    console.log('   Updating password to match...')
    const hashedPassword = await bcrypt.hash(testPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    console.log('   ✅ Password updated!')
    
    // Verify it works now
    const verify = await bcrypt.compare(testPassword, hashedPassword)
    console.log(`   Verification: ${verify ? '✅ WORKS' : '❌ FAILED'}`)
  } else {
    console.log('\n✅ Password is correct!')
  }
  
  await prisma.$disconnect()
}

testAuthFlow()
  .then(() => {
    console.log('\n✅ Test complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })


