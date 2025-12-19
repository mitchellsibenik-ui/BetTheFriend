'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Event } from '@/app/types'
import { generateGamesForSport } from '@/app/utils/mockData'
import { Event as ApiEventType } from '@/lib/api/odds'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Tab } from '@headlessui/react'
import SkeletonLoader from '@/components/SkeletonLoader'
import BetModal from '@/components/BetModal'
import { formatOdds } from '@/lib/utils/odds'
import { formatTeamName } from '@/lib/utils/teamNames'

type Step = 'league' | 'friend' | 'picks' | 'wager' | 'complete'

interface Friend {
  id: string
  username: string
  createdAt: string
  status: string
}

interface SelectedBet {
  gameId: string
  team: string
  betType: 'spread' | 'moneyline' | 'overUnder'
  value: string
  oppositeTeam: string
  oppositeValue: string
}

interface GameEvent {
  id: string;
  sport: string;
  teams: {
    home: {
      name: string;
      odds: number;
    };
    away: {
      name: string;
      odds: number;
    };
  };
  startTime: Date;
  time?: string;
  spread?: {
    [key: string]: number;
  };
  overUnder?: number;
  status: string;
}

interface ApiEvent {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    markets: Array<{
      key: string
      outcomes: Array<{
        name: string
        price: number
        point?: number
      }>
    }>
  }>
  scores?: {
    home: number
    away: number
  }
  status?: string
  betType?: 'moneyline' | 'spread' | 'overUnder'
  selectedTeam?: 'home' | 'away' | 'over' | 'under'
  odds?: number
  spread?: number
  overUnder?: number
  isLiveBet?: boolean
}

interface LiveGame extends GameEvent {
  score?: {
    home: number;
    away: number;
  };
  period?: string;
  clock?: string;
}

interface Market {
  key: string
  outcomes: {
    name: string
    price: number
    point?: number
  }[]
}

interface Bookmaker {
  key: string
  markets: Market[]
}

interface Game {
  id: string
  sport_title: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    markets: Array<{
      key: string
      outcomes: Array<{
        name: string
        price: number
        point?: number
      }>
    }>
  }>
  scores?: {
    home: number
    away: number
  }
  status?: string
  period?: string
  clock?: string
}

export default function SportsbookPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedSport, setSelectedSport] = useState('All')
  const [games, setGames] = useState<Game[]>([])
  const [liveGames, setLiveGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBet, setSelectedBet] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'live'>('upcoming')
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
    }
  }, [status, router])

  const fetchGames = async (forceRefresh = false) => {
    try {
      // Check if we have cached data and it's less than 5 minutes old
      const cachedData = localStorage.getItem(`games_${selectedSport}`)
      const cachedTime = localStorage.getItem(`games_${selectedSport}_time`)
      const currentTime = Date.now()
      
      // Show cached data immediately if available to improve perceived performance
      if (!forceRefresh && cachedData) {
        setGames(JSON.parse(cachedData))
        setLoading(false)
        
        const timeDiff = cachedTime ? currentTime - parseInt(cachedTime) : Infinity
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes - data is fresh enough
          return
        }
        // Data is old, continue to fetch fresh data in background
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)
      const response = await fetch(`/api/odds/${selectedSport.toLowerCase()}`)
      if (!response.ok) {
        const error = await response.json()
        if (error.error_code === 'OUT_OF_USAGE_CREDITS') {
          // If we're out of API credits, use cached data even if it's old
          if (cachedData) {
            setGames(JSON.parse(cachedData))
            setError('Using cached data - API quota reached. Please try again later.')
          } else {
            setError('API quota reached. Please try again later.')
          }
          setLoading(false)
          return
        }
        throw new Error(error.error || 'Failed to fetch games')
      }
      const data = await response.json()
      console.log('Sportsbook: Fetched games data:', data)
      console.log('Sportsbook: Number of games:', Array.isArray(data) ? data.length : 'Not an array')
      
      if (Array.isArray(data)) {
        console.log('Sportsbook: Sample games:', data.slice(0, 3).map(g => ({
          id: g.id,
          home: g.home_team,
          away: g.away_team,
          time: g.commence_time
        })))
      }
      
      setGames(data)
      
      // Cache the data
      localStorage.setItem(`games_${selectedSport}`, JSON.stringify(data))
      localStorage.setItem(`games_${selectedSport}_time`, currentTime.toString())
      setLastFetchTime(currentTime)
    } catch (error: any) {
      console.error('Error fetching games:', error)
      // If there's an error and we have cached data, use it
      const cachedData = localStorage.getItem(`games_${selectedSport}`)
      if (cachedData) {
        setGames(JSON.parse(cachedData))
        setError('Using cached data - ' + error.message)
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchGames()
    }
  }, [session?.user?.id, selectedSport])

  // Update the auto-refresh interval to be longer for live games
  useEffect(() => {
    if (activeTab === 'live') {
      const interval = setInterval(() => {
        fetchGames(true) // Force refresh for live games
      }, 60000) // Refresh every 60 seconds for live games instead of 30
      return () => clearInterval(interval)
    }
    return undefined
  }, [activeTab])

  // Remove any stray "y" text nodes from the page
  useEffect(() => {
    const removeStrayY = () => {
      // Function to walk through all nodes including shadow DOM
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      )

      const nodesToRemove: Text[] = []
      let node: Node | null

      while ((node = walker.nextNode())) {
        const textNode = node as Text
        const text = textNode.textContent?.trim()
        if (text === 'y' || text === 'y ') {
          nodesToRemove.push(textNode)
        }
      }

      // Remove found nodes
      nodesToRemove.forEach((textNode) => {
        console.log('Removed stray "y" text node:', textNode)
        textNode.remove()
      })

      // Also check shadow DOMs
      const allElements = document.querySelectorAll('*')
      allElements.forEach((element) => {
        if (element.shadowRoot) {
          const shadowWalker = document.createTreeWalker(
            element.shadowRoot,
            NodeFilter.SHOW_TEXT,
            null
          )
          let shadowNode: Node | null
          while ((shadowNode = shadowWalker.nextNode())) {
            const textNode = shadowNode as Text
            const text = textNode.textContent?.trim()
            if (text === 'y' || text === 'y ') {
              console.log('Removed stray "y" text node from shadow DOM:', textNode)
              textNode.remove()
            }
          }
        }
      })
    }

    // Run immediately and also after a short delay to catch dynamically added content
    removeStrayY()
    const timeout = setTimeout(removeStrayY, 100)
    const interval = setInterval(removeStrayY, 1000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [games]) // Re-run when games change

  // Add manual refresh button
  const handleRefresh = () => {
    fetchGames(true)
  }

  const handleBetClick = (game: Game, betType: 'moneyline' | 'spread' | 'overUnder', selectedTeam: 'home' | 'away' | 'over' | 'under', odds: number, point?: number) => {
    setSelectedBet({
      ...game,
      betType,
      selectedTeam,
      odds,
      point,
      isLiveBet: activeTab === 'live'
    })
  }


  const formatOdds = (odds: number) => {
    if (!odds) return 'N/A'
    return odds > 0 ? `+${odds}` : odds.toString()
  }

  const formatSpread = (spread: number) => {
    if (!spread) return ''
    return spread > 0 ? `+${spread}` : spread.toString()
  }

  const formatSportKey = (sportKey: string) => {
    // Map sport keys to clean display names
    const sportMap: Record<string, string> = {
      'americanfootball_nfl': 'NFL',
      'americanfootball_ncaaf': 'NCAAF',
      'basketball_nba': 'NBA',
      'baseball_mlb': 'MLB',
      'icehockey_nhl': 'NHL',
      'americanfootball': 'NFL',
      'ncaaf': 'NCAAF',
      'nba': 'NBA',
      'mlb': 'MLB',
      'nhl': 'NHL',
    }
    
    // Check for exact match first
    if (sportMap[sportKey.toLowerCase()]) {
      return sportMap[sportKey.toLowerCase()]
    }
    
    // Check if it contains any of the keys
    const lowerKey = sportKey.toLowerCase()
    for (const [key, value] of Object.entries(sportMap)) {
      if (lowerKey.includes(key)) {
        return value
      }
    }
    
    // Fallback: extract the last part after underscore or use the key itself
    const parts = sportKey.split('_')
    const lastPart = parts[parts.length - 1].toUpperCase()
    return lastPart
  }

  // Filter games to only show those that haven't started yet
  // But also include games that started recently (within last 2 hours) in case of timezone issues
  const now = new Date()
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const filteredGames = games.filter(game => {
    if (!game.commence_time) {
      console.warn('Game missing commence_time:', game.id)
      return false
    }
    const start = new Date(game.commence_time)
    // Include games that start in the future OR started within the last 2 hours (to handle timezone issues)
    const isUpcoming = start >= twoHoursAgo
    if (!isUpcoming && games.indexOf(game) < 3) {
      console.log('Game filtered out:', game.home_team, 'vs', game.away_team, 'start:', start, 'now:', now, 'twoHoursAgo:', twoHoursAgo)
    }
    return isUpcoming
  })
  
  console.log('Sportsbook: Total games:', games.length, 'Filtered games:', filteredGames.length)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Enhanced Mobile-First Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile Header - Ultra Compact Sportsbook Style */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Sportsbook
              </h1>
              {refreshing && (
                <div className="flex items-center text-blue-400">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-400 border-t-transparent mr-1"></div>
                  <span className="text-xs">Updating...</span>
                </div>
              )}
            </div>
            
            {/* Mobile Sport Selector - Compact */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-xs"
              >
                <option value="All">All Sports</option>
                <option value="NFL">NFL</option>
                <option value="NCAAF">NCAAF</option>
                <option value="NBA">NBA</option>
                <option value="MLB">MLB</option>
                <option value="NHL">NHL</option>
              </select>
              <button
                onClick={handleRefresh}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-3 py-1.5 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {/* Mobile Tab Navigation - Compact */}
            <Tab.Group>
              <Tab.List className="flex space-x-1 bg-white/10 backdrop-blur-sm p-0.5 rounded-lg">
                <Tab
                  className={({ selected }) =>
                    `flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
                      selected
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
                      selected
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                  onClick={() => setActiveTab('live')}
                >
                  Live
                </Tab>
              </Tab.List>
            </Tab.Group>
          </div>

          {/* Desktop Header - Compact */}
          <div className="hidden sm:flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Sportsbook
              </h1>
              {refreshing && (
                <div className="flex items-center text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-2"></div>
                  <span className="text-sm">Updating...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-sm"
              >
                <option value="All">All Sports</option>
                <option value="NFL">NFL</option>
                <option value="NCAAF">NCAAF</option>
                <option value="NBA">NBA</option>
                <option value="MLB">MLB</option>
                <option value="NHL">NHL</option>
              </select>
              <button
                onClick={handleRefresh}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 text-sm"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </div>
              </button>
              <Tab.Group>
                <Tab.List className="flex space-x-1 bg-white/10 backdrop-blur-sm p-1 rounded-xl">
                  <Tab
                    className={({ selected }) =>
                      `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selected
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                    onClick={() => setActiveTab('upcoming')}
                  >
                    Upcoming
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selected
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                    onClick={() => setActiveTab('live')}
                  >
                    Live
                  </Tab>
                </Tab.List>
              </Tab.Group>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
      
        {error && (
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-pink-600/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-red-400 font-semibold text-sm">Error</div>
                  <div className="text-red-300 text-sm">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4 sm:space-y-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 animate-pulse">
                  {/* Mobile Loading Layout */}
                  <div className="sm:hidden space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-white/10 rounded w-20"></div>
                      <div className="h-3 bg-white/10 rounded w-16"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-white/10 rounded w-32"></div>
                        <div className="h-4 bg-white/10 rounded w-12"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-white/10 rounded w-28"></div>
                        <div className="h-4 bg-white/10 rounded w-12"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-10 bg-white/10 rounded-xl"></div>
                      <div className="h-10 bg-white/10 rounded-xl"></div>
                      <div className="h-10 bg-white/10 rounded-xl"></div>
                    </div>
                  </div>
                  
                  {/* Desktop Loading Layout */}
                  <div className="hidden sm:block">
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-4 bg-white/10 rounded w-20"></div>
                      <div className="h-3 bg-white/10 rounded w-16"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-white/10 rounded w-32"></div>
                        <div className="h-4 bg-white/10 rounded w-12"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-white/10 rounded w-28"></div>
                        <div className="h-4 bg-white/10 rounded w-12"></div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-8 bg-white/10 rounded"></div>
                        <div className="h-8 bg-white/10 rounded"></div>
                        <div className="h-8 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Games Available</h3>
            <p className="text-gray-400 mb-6">No games available at the moment.</p>
            <button
              onClick={handleRefresh}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-2xl transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
            >
              Refresh Games
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredGames.map((game) => {
              const bookmaker = game.bookmakers[0]
              if (!bookmaker) return null

              const h2hMarket = bookmaker.markets.find((m) => m.key === 'h2h')
              const spreadMarket = bookmaker.markets.find((m) => m.key === 'spreads')
              const totalMarket = bookmaker.markets.find((m) => m.key === 'totals')

              // Only show live games in live tab and upcoming games in upcoming tab
              if (activeTab === 'live' && game.status !== 'live') return null
              if (activeTab === 'upcoming' && game.status === 'live') return null

              return (
                <div key={game.id} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                  <div className={`relative bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-xl border rounded-xl p-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 ${
                    game.status === 'live' ? 'border-red-500/50 bg-gradient-to-br from-red-500/8 to-red-500/3 shadow-red-500/20' : 'border-white/20 shadow-lg'
                  }`}>
                    {/* Mobile FanDuel-Style Row Layout */}
                    <div className="sm:hidden">
                      {/* Matchup Header */}
                      <div className="text-gray-400 text-xs mb-3 text-center">
                        {formatTeamName(game.away_team)} @ {formatTeamName(game.home_team)}
                      </div>

                      {/* Away Team Row */}
                      <div className="flex items-center mb-2">
                        <div className="text-white font-medium text-sm w-20 flex-shrink-0">
                          {formatTeamName(game.away_team).split(' ').slice(1).join(' ')}
                        </div>
                        <div className="flex space-x-1.5 items-center flex-1">
                          {/* Spread */}
                          {spreadMarket && (
                            <button
                              onClick={() => handleBetClick(
                                game,
                                'spread',
                                'away',
                                spreadMarket.outcomes.find(o => o.name === game.away_team)?.price || 0,
                                spreadMarket.outcomes.find(o => o.name === game.away_team)?.point || 0
                              )}
                              className={`bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded text-xs font-semibold transition-all duration-200 w-[55px] h-[36px] flex items-center justify-center ${
                                game.status === 'live' ? 'hover:bg-yellow-600/20 hover:border-yellow-400/50' : ''
                              }`}
                            >
                              {spreadMarket.outcomes.find(o => o.name === game.away_team)?.point ? 
                                `${(spreadMarket.outcomes.find(o => o.name === game.away_team)?.point || 0) > 0 ? '+' : ''}${spreadMarket.outcomes.find(o => o.name === game.away_team)?.point}` : 'N/A'}
                            </button>
                          )}
                          {/* Moneyline */}
                          {h2hMarket && (
                            <button
                              onClick={() => handleBetClick(
                                game,
                                'moneyline',
                                'away',
                                h2hMarket.outcomes.find(o => o.name === game.away_team)?.price || 0
                              )}
                              className={`bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded text-xs font-semibold transition-all duration-200 w-[55px] h-[36px] flex items-center justify-center ${
                                game.status === 'live' ? 'hover:bg-yellow-600/20 hover:border-yellow-400/50' : ''
                              }`}
                            >
                              {h2hMarket.outcomes.find(o => o.name === game.away_team)?.price ? 
                                (h2hMarket.outcomes.find(o => o.name === game.away_team)!.price > 0 ? 
                                  `+${h2hMarket.outcomes.find(o => o.name === game.away_team)!.price}` : 
                                  h2hMarket.outcomes.find(o => o.name === game.away_team)!.price) : 'N/A'}
                            </button>
                          )}
                          {/* Total Over */}
                          {totalMarket && (
                            <button
                              onClick={() => handleBetClick(
                                game,
                                'overUnder',
                                'over',
                                totalMarket.outcomes.find(o => o.name.toLowerCase() === 'over')?.price || 0,
                                totalMarket.outcomes.find(o => o.name.toLowerCase() === 'over')?.point || 0
                              )}
                              className={`bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded text-xs font-semibold transition-all duration-200 w-[55px] h-[36px] flex items-center justify-center ${
                                game.status === 'live' ? 'hover:bg-yellow-600/20 hover:border-yellow-400/50' : ''
                              }`}
                            >
                              o{totalMarket.outcomes.find(o => o.name.toLowerCase() === 'over')?.point || ''}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Home Team Row */}
                      <div className="flex items-center mb-1">
                        <div className="text-white font-medium text-sm w-20 flex-shrink-0">
                          {formatTeamName(game.home_team).split(' ').slice(1).join(' ')}
                        </div>
                        <div className="flex space-x-1.5 items-center flex-1">
                          {/* Spread */}
                          {spreadMarket && (
                            <button
                              onClick={() => handleBetClick(
                                game,
                                'spread',
                                'home',
                                spreadMarket.outcomes.find(o => o.name === game.home_team)?.price || 0,
                                spreadMarket.outcomes.find(o => o.name === game.home_team)?.point || 0
                              )}
                              className={`bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded text-xs font-semibold transition-all duration-200 w-[55px] h-[36px] flex items-center justify-center ${
                                game.status === 'live' ? 'hover:bg-yellow-600/20 hover:border-yellow-400/50' : ''
                              }`}
                            >
                              {spreadMarket.outcomes.find(o => o.name === game.home_team)?.point ? 
                                `${(spreadMarket.outcomes.find(o => o.name === game.home_team)?.point || 0) > 0 ? '+' : ''}${spreadMarket.outcomes.find(o => o.name === game.home_team)?.point}` : 'N/A'}
                            </button>
                          )}
                          {/* Moneyline */}
                          {h2hMarket && (
                            <button
                              onClick={() => handleBetClick(
                                game,
                                'moneyline',
                                'home',
                                h2hMarket.outcomes.find(o => o.name === game.home_team)?.price || 0
                              )}
                              className={`bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded text-xs font-semibold transition-all duration-200 w-[55px] h-[36px] flex items-center justify-center ${
                                game.status === 'live' ? 'hover:bg-yellow-600/20 hover:border-yellow-400/50' : ''
                              }`}
                            >
                              {h2hMarket.outcomes.find(o => o.name === game.home_team)?.price ? 
                                (h2hMarket.outcomes.find(o => o.name === game.home_team)!.price > 0 ? 
                                  `+${h2hMarket.outcomes.find(o => o.name === game.home_team)!.price}` : 
                                  h2hMarket.outcomes.find(o => o.name === game.home_team)!.price) : 'N/A'}
                            </button>
                          )}
                          {/* Total Under */}
                          {totalMarket && (
                            <button
                              onClick={() => handleBetClick(
                                game,
                                'overUnder',
                                'under',
                                totalMarket.outcomes.find(o => o.name.toLowerCase() === 'under')?.price || 0,
                                totalMarket.outcomes.find(o => o.name.toLowerCase() === 'under')?.point || 0
                              )}
                              className={`bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded text-xs font-semibold transition-all duration-200 w-[55px] h-[36px] flex items-center justify-center ${
                                game.status === 'live' ? 'hover:bg-yellow-600/20 hover:border-yellow-400/50' : ''
                              }`}
                            >
                              u{totalMarket.outcomes.find(o => o.name.toLowerCase() === 'under')?.point || ''}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Game Header - Compact */}
                    <div className="hidden sm:block mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {game.status === 'live' && (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-red-400 font-bold text-sm">LIVE</span>
                            </div>
                          )}
                          <span className="text-gray-400 text-sm">
                            {game.status === 'live' ? (
                              game.scores ? `${game.scores.away} - ${game.scores.home}` : 'Live'
                            ) : (
                              new Date(game.commence_time).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric'
                              })
                            )}
                          </span>
                        </div>
                        {game.status === 'live' && game.period && (
                          <div className="text-white text-sm font-medium">
                            {game.sport_key.includes('baseball') ? `Inn ${game.period}` :
                             game.sport_key.includes('basketball') ? `Q${game.period}` :
                             game.sport_key.includes('hockey') ? `P${game.period}` :
                             game.sport_key.includes('football') ? `Q${game.period}` :
                             `P${game.period}`}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-lg mb-1">{formatTeamName(game.away_team)}</div>
                        <div className="text-gray-400 text-sm mb-1">@</div>
                        <div className="text-white font-bold text-lg">{formatTeamName(game.home_team)}</div>
                      </div>
                    </div>


                    {/* Desktop Odds Layout - Compact */}
                    <div className="hidden sm:block space-y-3">
                      {h2hMarket && (
                        <div>
                          <h3 className="font-semibold mb-2 text-white text-sm">Money Line</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {h2hMarket.outcomes
                              .sort((a, b) => {
                                if (a.name === game.away_team) return -1;
                                if (a.name === game.home_team) return 1;
                                return 0;
                              })
                              .map((o) => (
                                <button
                                  key={o.name}
                                  onClick={() => handleBetClick(
                                    game,
                                    'moneyline',
                                    o.name === game.home_team ? 'home' : 'away',
                                    o.price
                                  )}
                                  className={`bg-white/10 hover:bg-blue-600/20 border border-white/20 hover:border-blue-500/50 text-white py-3 px-3 rounded-xl transition-all duration-200 flex flex-col items-center transform hover:scale-105 ${
                                    game.status === 'live' ? 'hover:bg-yellow-600/20 hover:border-yellow-500/50' : ''
                                  }`}
                                >
                                  <div className="font-bold text-sm truncate mb-1">{formatTeamName(o.name)}</div>
                                  <div className={`text-sm font-semibold ${
                                    game.status === 'live' ? 'text-yellow-400' : 'text-green-400'
                                  }`}>
                                    {o.price > 0 ? `+${o.price}` : o.price}
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {spreadMarket && (
                        <div>
                          <h3 className="font-semibold mb-2 text-white text-sm">Spread</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {spreadMarket.outcomes
                              .sort((a, b) => {
                                if (a.name === game.away_team) return -1;
                                if (a.name === game.home_team) return 1;
                                return 0;
                              })
                              .map((o) => (
                                <button
                                  key={o.name}
                                  onClick={() => handleBetClick(
                                    game,
                                    'spread',
                                    o.name === game.home_team ? 'home' : 'away',
                                    o.price,
                                    o.point
                                  )}
                                  className={`bg-white/10 hover:bg-blue-600/20 border border-white/20 hover:border-blue-500/50 text-white py-3 px-3 rounded-xl transition-all duration-200 flex flex-col items-center transform hover:scale-105 ${
                                    game.status === 'live' ? 'hover:bg-yellow-600/20 hover:border-yellow-500/50' : ''
                                  }`}
                                >
                                  <div className="font-bold text-sm truncate mb-1">{formatTeamName(o.name)}</div>
                                  <div className={`text-sm font-semibold ${
                                    game.status === 'live' ? 'text-yellow-400' : 'text-green-400'
                                  }`}>
                                    {o.point ? `${o.point > 0 ? '+' : ''}${o.point} (${o.price > 0 ? '+' : ''}${o.price})` : o.price}
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {totalMarket && (
                        <div>
                          <h3 className="font-semibold mb-2 text-white text-sm">Total</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {totalMarket.outcomes.map((o) => (
                              <button
                                key={o.name}
                                onClick={() => handleBetClick(
                                  game,
                                  'overUnder',
                                  o.name.toLowerCase() === 'over' ? 'over' : 'under',
                                  o.price,
                                  o.point
                                )}
                                className={`bg-white/10 hover:bg-blue-600/20 border border-white/20 hover:border-blue-500/50 text-white py-3 px-3 rounded-xl transition-all duration-200 flex flex-col items-center transform hover:scale-105 ${
                                  game.status === 'live' ? 'hover:bg-yellow-600/20 hover:border-yellow-500/50' : ''
                                }`}
                              >
                                <div className="font-bold text-sm truncate mb-1">{o.name}</div>
                                <div className={`text-sm font-semibold ${
                                  game.status === 'live' ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                  {o.point ? `${o.name} ${o.point} (${o.price > 0 ? '+' : ''}${o.price})` : o.price}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selectedBet && (
          <BetModal
            isOpen={!!selectedBet}
            onClose={() => setSelectedBet(null)}
            bet={selectedBet}
            onBetPlaced={() => {
              setSelectedBet(null)
            }}
            isLiveBet={activeTab === 'live'}
          />
        )}
      </div>
    </div>
  )
} 