import { startBetSettlementCron } from './cron'

// Initialize server-side services
export function initializeServer() {
  // Start the automated bet settlement cron job
  startBetSettlementCron()
  
  console.log('🚀 Server initialized with automated bet settlement')
} 