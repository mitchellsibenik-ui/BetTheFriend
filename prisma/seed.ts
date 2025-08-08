import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo users with hashed passwords
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user1 = await prisma.user.upsert({
    where: { email: 'demo1@betthefriend.com' },
    update: {},
    create: {
      email: 'demo1@betthefriend.com',
      username: 'DemoUser1',
      password: hashedPassword,
      balance: 10000,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'demo2@betthefriend.com' },
    update: {},
    create: {
      email: 'demo2@betthefriend.com',
      username: 'DemoUser2',
      password: hashedPassword,
      balance: 10000,
    },
  })

  // Create friendship between demo users
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: user1.id, receiverId: user2.id },
        { senderId: user2.id, receiverId: user1.id }
      ]
    }
  })

  if (!existingFriendship) {
    await prisma.friendship.create({
      data: {
        senderId: user1.id,
        receiverId: user2.id,
        status: 'ACCEPTED',
      },
    })
  }

  console.log('✅ Database seed completed!')
  console.log('Demo users created:')
  console.log('- Email: demo1@betthefriend.com, Password: password123')
  console.log('- Email: demo2@betthefriend.com, Password: password123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  }) 