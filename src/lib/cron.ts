import { PrismaClient } from '@prisma/client'
import { settleCompletedBets } from './betSettlement'

const prisma = new PrismaClient()

// Run settlement every 5 minutes
export async function startBetSettlementCron() {
  console.log('🕐 [CRON] Starting automated bet settlement (every 5 minutes)')
  
  // Run immediately on start
  await settleCompletedBets()
  
  // Then run every 5 minutes
  setInterval(async () => {
    try {
      await settleCompletedBets()
    } catch (error) {
      console.error('❌ [CRON] Error in scheduled bet settlement:', error)
    }
  }, 5 * 60 * 1000) // 5 minutes
}

// Export the settlement function for manual triggers
export { settleCompletedBets } 