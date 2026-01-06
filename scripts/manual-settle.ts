import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })
config({ path: resolve(__dirname, '../.env') })

import { settleCompletedBets } from '../src/lib/betSettlement'

async function main() {
  console.log('🚀 Manually triggering bet settlement...')
  console.log('⏰ Started at:', new Date().toISOString())
  console.log('')
  
  try {
    const result = await settleCompletedBets()
    
    console.log('')
    console.log('✅ Settlement completed!')
    console.log('📊 Results:', JSON.stringify(result, null, 2))
    console.log('⏰ Finished at:', new Date().toISOString())
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during settlement:', error)
    process.exit(1)
  }
}

main()

