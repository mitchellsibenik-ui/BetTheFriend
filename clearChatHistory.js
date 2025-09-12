const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearChatHistory() {
  try {
    console.log('Clearing all chat history...')
    
    // Clear all chat messages
    const deletedMessages = await prisma.chatMessage.deleteMany({})
    console.log(`Deleted ${deletedMessages.count} chat messages`)
    
    // Clear all read statuses
    const deletedReadStatuses = await prisma.chatReadStatus.deleteMany({})
    console.log(`Deleted ${deletedReadStatuses.count} read statuses`)
    
    // Clear all chat rooms
    const deletedRooms = await prisma.chatRoom.deleteMany({})
    console.log(`Deleted ${deletedRooms.count} chat rooms`)
    
    console.log('✅ Chat history cleared successfully!')
  } catch (error) {
    console.error('❌ Error clearing chat history:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearChatHistory()
