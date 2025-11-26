require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteAllShowdowns() {
  try {
    console.log('Starting showdown cleanup...')
    
    // Delete all showdown picks first (they reference participants)
    const picksDeleted = await prisma.showdownPick.deleteMany({})
    console.log(`✅ Deleted ${picksDeleted.count} showdown picks`)
    
    // Delete all showdown participants
    const participantsDeleted = await prisma.showdownParticipant.deleteMany({})
    console.log(`✅ Deleted ${participantsDeleted.count} showdown participants`)
    
    // Delete all showdown rooms
    const roomsDeleted = await prisma.showdownRoom.deleteMany({})
    console.log(`✅ Deleted ${roomsDeleted.count} showdown rooms`)
    
    console.log('\n✅ All showdown data deleted!')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllShowdowns()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

