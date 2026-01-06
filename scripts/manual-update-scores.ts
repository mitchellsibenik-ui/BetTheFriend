import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })
config({ path: resolve(__dirname, '../.env') })

import { PrismaClient } from '@prisma/client'
import { settleCompletedBets } from '../src/lib/betSettlement'

const prisma = new PrismaClient()

// Manual game scores - UPDATE THESE WITH THE ACTUAL FINAL SCORES
const MANUAL_SCORES: Record<string, { homeScore: number; awayScore: number }> = {
  // Boston Celtics vs Chicago Bulls
  'f464229b0fe5abe7e94b312d75639617': {
    homeScore: 0, // UPDATE: Boston Celtics final score
    awayScore: 0  // UPDATE: Chicago Bulls final score
  },
  // Toronto Raptors vs Atlanta Hawks
  'a4735b19c22f9709d23974fe5d264665': {
    homeScore: 0, // UPDATE: Toronto Raptors final score
    awayScore: 0  // UPDATE: Atlanta Hawks final score
  },
  // Detroit Pistons vs New York Knicks
  '07c210d30cdf1a467ae466394c9c7d2c': {
    homeScore: 0, // UPDATE: Detroit Pistons final score
    awayScore: 0  // UPDATE: New York Knicks final score
  },
  // Ottawa Senators vs Detroit Red Wings
  'ff37e25e8cab2aac0caabfb5f5fbe29e': {
    homeScore: 0, // UPDATE: Ottawa Senators final score
    awayScore: 0  // UPDATE: Detroit Red Wings final score
  },
  // Washington Capitals vs Anaheim Ducks
  '46d7b6ac0eed677fd13dd2a5cc70a782': {
    homeScore: 0, // UPDATE: Washington Capitals final score
    awayScore: 0  // UPDATE: Anaheim Ducks final score
  }
}

async function main() {
  console.log('🔧 Manually updating game scores and settling bets...')
  console.log('')
  
  // Check if any scores are still 0 (not updated)
  const needsUpdate = Object.entries(MANUAL_SCORES).some(([_, scores]) => 
    scores.homeScore === 0 && scores.awayScore === 0
  )
  
  if (needsUpdate) {
    console.log('⚠️  WARNING: Some scores are still set to 0.')
    console.log('Please update the MANUAL_SCORES object in this script with the actual final scores.')
    console.log('')
    console.log('Games that need scores:')
    for (const [gameId, scores] of Object.entries(MANUAL_SCORES)) {
      if (scores.homeScore === 0 && scores.awayScore === 0) {
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          select: { homeTeam: true, awayTeam: true }
        })
        if (game) {
          console.log(`  - ${game.homeTeam} vs ${game.awayTeam} (ID: ${gameId})`)
        } else {
          console.log(`  - Game ID: ${gameId}`)
        }
      }
    }
    console.log('')
    console.log('After updating scores, run this script again.')
    await prisma.$disconnect()
    process.exit(1)
  }
  
  console.log('✅ All scores provided. Updating games in database...')
  console.log('')
  
  // Update each game with scores
  for (const [gameId, scores] of Object.entries(MANUAL_SCORES)) {
    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { homeTeam: true, awayTeam: true }
      })
      
      if (!game) {
        console.log(`⚠️  Game ${gameId} not found in database, skipping...`)
        continue
      }
      
      await prisma.game.update({
        where: { id: gameId },
        data: {
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
          status: 'completed',
          endTime: new Date()
        }
      })
      
      console.log(`✅ Updated: ${game.homeTeam} ${scores.homeScore} - ${game.awayTeam} ${scores.awayScore}`)
    } catch (error) {
      console.error(`❌ Error updating game ${gameId}:`, error)
    }
  }
  
  console.log('')
  console.log('🔄 Now running settlement to grade bets...')
  console.log('')
  
  // Now run settlement which should pick up the database scores
  const result = await settleCompletedBets()
  
  console.log('')
  console.log('✅ Process completed!')
  console.log('📊 Settlement results:', JSON.stringify(result, null, 2))
  
  await prisma.$disconnect()
  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})

