const { startAutomatedSettlement } = require('./src/lib/cleanSettlement.js')

console.log('🏈 Starting Clean Social Sportsbook System...')
console.log('📡 This system will:')
console.log('   • Check for completed games every 5 minutes')
console.log('   • Fetch real results from sports API')
console.log('   • Automatically grade bets like a real sportsbook')
console.log('   • Update user balances and win/loss records')
console.log('   • Send notifications to winners/losers')
console.log('   • Update leaderboard automatically')
console.log('')

// Start the automated system
startAutomatedSettlement()

console.log('✅ Clean sportsbook system is now running!')
console.log('🔄 Will check for completed games every 5 minutes')
console.log('📊 Ready to grade bets automatically')
console.log('')

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down sportsbook system...')
  process.exit(0)
})

console.log('Press Ctrl+C to stop the system') 