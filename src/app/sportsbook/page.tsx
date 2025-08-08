'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Event } from '@/app/types'
import { generateGamesForSport } from '@/app/utils/mockData'
import { Event as ApiEventType } from '@/lib/api/odds'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Tab } from '@headlessui/react'
import BetModal from '@/components/BetModal'
import { formatOdds } from '@/lib/utils/odds'

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
  }, [activeTab])

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

  const formatTeamName = (fullName: string) => {
    const teamAbbreviations: { [key: string]: string } = {
      'New York': 'NY',
      'Los Angeles': 'LAA',
      'St. Louis': 'STL',
      'San Francisco': 'SF',
      'San Diego': 'SD',
      'Tampa Bay': 'TB',
      'Kansas City': 'KC',
      'Las Vegas': 'LV',
      'Oklahoma City': 'OKC',
      'Golden State': 'GSW',
      'Milwaukee': 'MIL',
      'Minnesota': 'MIN',
      'Phoenix': 'PHX',
      'Portland': 'POR',
      'Sacramento': 'SAC',
      'Utah': 'UTA',
      'Washington': 'WSH',
      'Boston': 'BOS',
      'Chicago': 'CHI',
      'Cleveland': 'CLE',
      'Dallas': 'DAL',
      'Denver': 'DEN',
      'Detroit': 'DET',
      'Houston': 'HOU',
      'Indiana': 'IND',
      'Memphis': 'MEM',
      'Miami': 'MIA',
      'New Orleans': 'NO',
      'Orlando': 'ORL',
      'Philadelphia': 'PHI',
      'Toronto': 'TOR',
      'Atlanta': 'ATL',
      'Brooklyn': 'BKN',
      'Charlotte': 'CHA',
      'Buffalo': 'BUF',
      'Carolina': 'CAR',
      'Columbus': 'CBJ',
      'New Jersey': 'NJ',
      'Pittsburgh': 'PIT',
      'Seattle': 'SEA',
      'Vancouver': 'VAN',
      'Winnipeg': 'WPG',
      'Anaheim': 'ANA',
      'Arizona': 'ARI',
      'Calgary': 'CGY',
      'Edmonton': 'EDM',
      'Montreal': 'MTL',
      'Nashville': 'NSH',
      'Ottawa': 'OTT',
      'San Jose': 'SJ',
      'Vegas': 'VGK'
    }

    // Handle special cases for Los Angeles teams
    if (fullName.startsWith('Los Angeles')) {
      const team = fullName.replace('Los Angeles ', '')
      if (team === 'Lakers') return 'LAL Lakers'
      if (team === 'Clippers') return 'LAC Clippers'
      if (team === 'Angels') return 'LA Angels'
      if (team === 'Dodgers') return 'LAD Dodgers'
      if (team === 'Rams') return 'LA Rams'
      return `LAA ${team}`
    }

    // Handle special cases for New York teams
    if (fullName.startsWith('New York')) {
      const team = fullName.replace('New York ', '')
      if (team === 'Yankees') return 'NYY Yankees'
      if (team === 'Mets') return 'NYM Mets'
      if (team === 'Knicks') return 'NYK Knicks'
      if (team === 'Nets') return 'BKN Nets'
      if (team === 'Giants') return 'NYG Giants'
      if (team === 'Jets') return 'NYJ Jets'
      if (team === 'Rangers') return 'NYR Rangers'
      if (team === 'Islanders') return 'NYI Islanders'
      return `NY ${team}`
    }

    // Handle special cases for Tampa Bay teams
    if (fullName.startsWith('Tampa Bay')) {
      const team = fullName.replace('Tampa Bay ', '')
      if (team === 'Rays') return 'TB Rays'
      if (team === 'Lightning') return 'TB Lightning'
      if (team === 'Buccaneers') return 'TB Buccaneers'
      return `TB ${team}`
    }

    // Handle special cases for Florida teams
    if (fullName.startsWith('Florida')) {
      const team = fullName.replace('Florida ', '')
      if (team === 'Panthers') return 'FLA Panthers'
      return `FLA ${team}`
    }

    // Handle special cases for Kansas City teams
    if (fullName.startsWith('Kansas City')) {
      const team = fullName.replace('Kansas City ', '')
      if (team === 'Royals') return 'KC Royals'
      if (team === 'Chiefs') return 'KC Chiefs'
      return `KC ${team}`
    }

    // Handle special cases for San Diego teams
    if (fullName.startsWith('San Diego')) {
      const team = fullName.replace('San Diego ', '')
      if (team === 'Padres') return 'SD Padres'
      return `SD ${team}`
    }

    // Handle special cases for Oklahoma City teams
    if (fullName.startsWith('Oklahoma City')) {
      const team = fullName.replace('Oklahoma City ', '')
      if (team === 'Thunder') return 'OKC Thunder'
      return `OKC ${team}`
    }

    // Handle special cases for New Orleans teams
    if (fullName.startsWith('New Orleans')) {
      const team = fullName.replace('New Orleans ', '')
      if (team === 'Saints') return 'NO Saints'
      return `NO ${team}`
    }

    // Handle special cases for Las Vegas teams
    if (fullName.startsWith('Las Vegas')) {
      const team = fullName.replace('Las Vegas ', '')
      if (team === 'Raiders') return 'LV Raiders'
      return `LV ${team}`
    }

    // Handle special cases for Green Bay teams
    if (fullName.startsWith('Green Bay')) {
      const team = fullName.replace('Green Bay ', '')
      if (team === 'Packers') return 'GB Packers'
      return `GB ${team}`
    }

    const parts = fullName.split(' ')
    if (parts.length > 1) {
      const city = parts[0]
      const team = parts.slice(1).join(' ')
      const cityAbbr = teamAbbreviations[city] || (city.length > 4 ? city.substring(0, 3).toUpperCase() : city)
      return `${cityAbbr} ${team}`
    }
    return fullName
  }

  const formatOdds = (odds: number) => {
    if (!odds) return 'N/A'
    return odds > 0 ? `+${odds}` : odds.toString()
  }

  const formatSpread = (spread: number) => {
    if (!spread) return ''
    return spread > 0 ? `+${spread}` : spread.toString()
  }

  const renderOdds = (game: any) => {
    const isLive = game.status === 'in_progress'
    const homeTeam = game.home_team
    const awayTeam = game.away_team

    return (
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isLive && (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                <span className="text-red-500 font-medium">LIVE</span>
              </span>
            )}
            <span className="text-gray-400">
              {new Date(game.commence_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {isLive && game.scores && (
            <div className="text-white font-medium">
              {game.scores.away_score} - {game.scores.home_score}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-gray-400 text-sm">Away</div>
            <div className="text-white font-medium">{awayTeam}</div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-400 text-sm">Home</div>
            <div className="text-white font-medium">{homeTeam}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-gray-400 text-sm mb-2">Money Line</div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleBetClick(
                  game,
                  'moneyline',
                  'away',
                  game.bookmakers[0]?.markets[0]?.outcomes[0]?.price
                )}
                className="bg-gray-700 hover:bg-gray-600 rounded p-2 text-left"
              >
                <div className="text-white">{awayTeam}</div>
                <div className="text-green-400">
                  {formatOdds(game.bookmakers[0]?.markets[0]?.outcomes[0]?.price)}
                </div>
              </button>
              <button
                onClick={() => handleBetClick(
                  game,
                  'moneyline',
                  'home',
                  game.bookmakers[0]?.markets[0]?.outcomes[1]?.price
                )}
                className="bg-gray-700 hover:bg-gray-600 rounded p-2 text-left"
              >
                <div className="text-white">{homeTeam}</div>
                <div className="text-green-400">
                  {formatOdds(game.bookmakers[0]?.markets[0]?.outcomes[1]?.price)}
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-2">Spread</div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleBetClick(
                  game,
                  'spread',
                  'away',
                  game.bookmakers[0]?.markets[1]?.outcomes[0]?.price,
                  game.bookmakers[0]?.markets[1]?.outcomes[0]?.point
                )}
                className="bg-gray-700 hover:bg-gray-600 rounded p-2 text-left"
              >
                <div className="text-white">
                  {awayTeam} {formatSpread(game.bookmakers[0]?.markets[1]?.outcomes[0]?.point)}
                </div>
                <div className="text-green-400">
                  {formatOdds(game.bookmakers[0]?.markets[1]?.outcomes[0]?.price)}
                </div>
              </button>
              <button
                onClick={() => handleBetClick(
                  game,
                  'spread',
                  'home',
                  game.bookmakers[0]?.markets[1]?.outcomes[1]?.price,
                  game.bookmakers[0]?.markets[1]?.outcomes[1]?.point
                )}
                className="bg-gray-700 hover:bg-gray-600 rounded p-2 text-left"
              >
                <div className="text-white">
                  {homeTeam} {formatSpread(game.bookmakers[0]?.markets[1]?.outcomes[1]?.point)}
                </div>
                <div className="text-green-400">
                  {formatOdds(game.bookmakers[0]?.markets[1]?.outcomes[1]?.price)}
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-2">Total</div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleBetClick(
                  game,
                  'overUnder',
                  'over',
                  game.bookmakers[0]?.markets[2]?.outcomes[0]?.price,
                  game.bookmakers[0]?.markets[2]?.outcomes[0]?.point
                )}
                className="bg-gray-700 hover:bg-gray-600 rounded p-2 text-left"
              >
                <div className="text-white">
                  Over {game.bookmakers[0]?.markets[2]?.outcomes[0]?.point}
                </div>
                <div className="text-green-400">
                  {formatOdds(game.bookmakers[0]?.markets[2]?.outcomes[0]?.price)}
                </div>
              </button>
              <button
                onClick={() => handleBetClick(
                  game,
                  'overUnder',
                  'under',
                  game.bookmakers[0]?.markets[2]?.outcomes[1]?.price,
                  game.bookmakers[0]?.markets[2]?.outcomes[1]?.point
                )}
                className="bg-gray-700 hover:bg-gray-600 rounded p-2 text-left"
              >
                <div className="text-white">
                  Under {game.bookmakers[0]?.markets[2]?.outcomes[1]?.point}
                </div>
                <div className="text-green-400">
                  {formatOdds(game.bookmakers[0]?.markets[2]?.outcomes[1]?.price)}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Filter games to only show those within the next 48 hours
  const now = new Date()
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const filteredGames = games.filter(game => {
    const start = new Date(game.commence_time)
    return start >= now && start <= in48Hours
  })

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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Sportsbook</h1>
          {refreshing && (
            <div className="flex items-center text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-2"></div>
              <span className="text-xs sm:text-sm">Updating...</span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm sm:text-base w-full sm:w-auto"
          >
            <option value="All">All Sports</option>
            <option value="NFL">NFL</option>
            <option value="NBA">NBA</option>
            <option value="MLB">MLB</option>
            <option value="NHL">NHL</option>
          </select>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base flex-1 sm:flex-initial"
            >
              Refresh
            </button>
            <Tab.Group>
              <Tab.List className="flex space-x-1 sm:space-x-2 bg-gray-800 p-1 rounded-lg">
                <Tab
                  className={({ selected }) =>
                    `px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      selected
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`
                  }
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      selected
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
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
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 animate-pulse">
              <div className="flex justify-between items-center mb-4">
                <div className="h-4 bg-gray-700 rounded w-20"></div>
                <div className="h-3 bg-gray-700 rounded w-16"></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-700 rounded w-12"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-700 rounded w-28"></div>
                  <div className="h-4 bg-gray-700 rounded w-12"></div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No games available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div 
                key={game.id} 
                className={`bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 border ${
                  game.status === 'live' ? 'border-red-500' : 'border-gray-700'
                } hover:border-blue-500 transition-all duration-200`}
              >
                <div className="mb-3 sm:mb-4">
                  <div className="text-gray-400 text-xs sm:text-sm mb-2">
                    {game.status === 'live' ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-red-500 font-medium animate-pulse text-xs sm:text-sm">LIVE</span>
                          {game.scores && (
                            <span className="text-white font-bold text-sm sm:text-base">
                              {game.scores.away} - {game.scores.home}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {game.period && (
                            <span className="text-white text-xs sm:text-sm">
                              {game.sport_key.includes('baseball') ? (
                                <span>Inn {game.period}</span>
                              ) : game.sport_key.includes('basketball') ? (
                                <span>Q{game.period}</span>
                              ) : game.sport_key.includes('hockey') ? (
                                <span>P{game.period}</span>
                              ) : game.sport_key.includes('football') ? (
                                <span>Q{game.period}</span>
                              ) : (
                                <span>P{game.period}</span>
                              )}
                            </span>
                          )}
                          {game.clock && !game.sport_key.includes('baseball') && (
                            <span className="text-white font-mono text-xs sm:text-sm">{game.clock}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      new Date(game.commence_time).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        timeZoneName: 'short'
                      })
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex-1 text-right">
                      <div className="text-white font-bold text-sm sm:text-base truncate max-w-[100px] sm:max-w-[120px] ml-auto">{formatTeamName(game.away_team)}</div>
                      <div className="text-gray-400 text-xs">Away</div>
                      {game.scores && (
                        <div className="text-lg sm:text-xl font-bold text-white mt-1">{game.scores.away}</div>
                      )}
                    </div>
                    <div className="mx-2 sm:mx-4 text-gray-400">@</div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-bold text-sm sm:text-base truncate max-w-[100px] sm:max-w-[120px]">{formatTeamName(game.home_team)}</div>
                      <div className="text-gray-400 text-xs">Home</div>
                      {game.scores && (
                        <div className="text-lg sm:text-xl font-bold text-white mt-1">{game.scores.home}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {h2hMarket && (
                    <div>
                      <h3 className="font-medium mb-2 text-gray-300">Money Line</h3>
                      <div className="flex justify-between">
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
                              className={`flex-1 mx-1 ${
                                game.status === 'live' ? 'bg-gray-800' : 'bg-gray-700'
                              } hover:bg-blue-600 text-white py-2 px-2 sm:px-4 rounded-lg transition-all duration-200 flex flex-col items-center`}
                            >
                              <div className="font-medium truncate text-xs sm:text-sm">{formatTeamName(o.name)}</div>
                              <div className={`text-xs sm:text-sm ${game.status === 'live' ? 'text-yellow-400' : 'text-green-400'}`}>
                                {o.price > 0 ? `+${o.price}` : o.price}
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {spreadMarket && (
                    <div>
                      <h3 className="font-medium mb-2 text-gray-300">Spread</h3>
                      <div className="flex justify-between">
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
                              className={`flex-1 mx-1 ${
                                game.status === 'live' ? 'bg-gray-800' : 'bg-gray-700'
                              } hover:bg-blue-600 text-white py-2 px-2 sm:px-4 rounded-lg transition-all duration-200 flex flex-col items-center`}
                            >
                              <div className="font-medium truncate text-xs sm:text-sm">{formatTeamName(o.name)}</div>
                              <div className={`text-xs sm:text-sm ${game.status === 'live' ? 'text-yellow-400' : 'text-green-400'}`}>
                                {o.point ? `${o.point > 0 ? '+' : ''}${o.point} (${o.price > 0 ? '+' : ''}${o.price})` : o.price}
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {totalMarket && (
                    <div>
                      <h3 className="font-medium mb-2 text-gray-300">Total</h3>
                      <div className="flex justify-between">
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
                            className={`flex-1 mx-1 ${
                              game.status === 'live' ? 'bg-gray-800' : 'bg-gray-700'
                            } hover:bg-blue-600 text-white py-2 px-2 sm:px-4 rounded-lg transition-all duration-200 flex flex-col items-center`}
                          >
                            <div className="font-medium truncate text-xs sm:text-sm">{o.name}</div>
                            <div className={`text-xs sm:text-sm ${game.status === 'live' ? 'text-yellow-400' : 'text-green-400'}`}>
                              {o.point ? `${o.name} ${o.point} (${o.price > 0 ? '+' : ''}${o.price})` : o.price}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
  )
} 