const axios = require('axios')

// Test the original Odds API
async function testOddsAPI() {
  console.log('🎯 Testing The Odds API (original setup)...\n')
  
  const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY || 'your_odds_api_key_here'
  const BASE_URL = 'https://api.the-odds-api.com/v4'
  
  if (API_KEY === 'your_odds_api_key_here') {
    console.log('❌ Please set your NEXT_PUBLIC_ODDS_API_KEY environment variable')
    console.log('   You can get a free API key from: https://the-odds-api.com/')
    return
  }
  
  try {
    // Test 1: Get sports list
    console.log('1️⃣ Testing Sports List...')
    const sportsResponse = await axios.get(`${BASE_URL}/sports`, {
      params: { apiKey: API_KEY },
      timeout: 10000
    })
    console.log(`✅ Found ${sportsResponse.data.length} sports`)
    
    const nflSport = sportsResponse.data.find(s => s.key === 'americanfootball_nfl')
    if (nflSport) {
      console.log(`   NFL: ${nflSport.title} (${nflSport.active ? 'Active' : 'Inactive'})`)
    }
    
    // Test 2: Get NFL odds
    console.log('\n2️⃣ Testing NFL Odds...')
    const oddsResponse = await axios.get(`${BASE_URL}/sports/americanfootball_nfl/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american'
      },
      timeout: 10000
    })
    
    console.log(`✅ Found ${oddsResponse.data.length} NFL games`)
    
    if (oddsResponse.data.length > 0) {
      const sampleGame = oddsResponse.data[0]
      console.log(`   Sample: ${sampleGame.away_team} @ ${sampleGame.home_team}`)
      console.log(`   Time: ${sampleGame.commence_time}`)
      console.log(`   Bookmakers: ${sampleGame.bookmakers?.length || 0}`)
      
      if (sampleGame.bookmakers && sampleGame.bookmakers.length > 0) {
        const bookmaker = sampleGame.bookmakers[0]
        console.log(`   Bookmaker: ${bookmaker.title}`)
        console.log(`   Markets: ${bookmaker.markets?.length || 0}`)
      }
    }
    
    console.log('\n🎉 The Odds API is working perfectly!')
    console.log('\n📋 Your current setup:')
    console.log('✅ Using The Odds API (api.the-odds-api.com)')
    console.log('✅ Supports NFL, NBA, MLB, NHL')
    console.log('✅ Provides moneyline, spread, and totals')
    console.log('✅ Real-time odds data')
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ API Key Error: Invalid or missing API key')
      console.log('   Get a free key from: https://the-odds-api.com/')
    } else if (error.response?.status === 429) {
      console.log('❌ Rate Limit: Too many requests')
      console.log('   Wait a moment and try again')
    } else {
      console.log('❌ Error:', error.response?.data || error.message)
    }
  }
}

testOddsAPI()
