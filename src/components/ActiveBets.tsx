import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Bet {
  id: string
  gameId: string
  senderId: string
  receiverId: string
  senderTeam: string
  receiverTeam: string
  betType: string
  senderValue: string
  receiverValue: string
  amount: number
  trashTalk?: string
  status: string
  gameDetails: string
  createdAt: string
  sender: {
    id: string
    username: string
  }
  receiver: {
    id: string
    username: string
  }
}

export default function ActiveBets() {
  const { data: session } = useSession()
  const [activeBets, setActiveBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchActiveBets()

    // Add event listener for bet acceptance
    const handleBetAccepted = () => {
      fetchActiveBets()
    }

    window.addEventListener('betAccepted', handleBetAccepted)

    // Cleanup
    return () => {
      window.removeEventListener('betAccepted', handleBetAccepted)
    }
  }, [])

  const fetchActiveBets = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/bets/active')
      if (!response.ok) {
        throw new Error('Failed to fetch active bets')
      }
      const data = await response.json()
      setActiveBets(data.bets)
    } catch (error) {
      console.error('Error fetching active bets:', error)
      setError('Failed to load active bets')
    } finally {
      setLoading(false)
    }
  }

  const calculatePayout = (amount: number, odds: string, betType: string) => {
    let oddsValue: number
    
    if (betType === 'spread' || betType === 'overUnder') {
      // Parse the new format: "line|odds" or just "odds" for backward compatibility
      const parts = odds.split('|')
      oddsValue = parts[1] ? parseInt(parts[1]) : parseInt(odds)
    } else {
      // For moneyline, odds is just the odds value
      oddsValue = parseInt(odds)
    }
    
    if (oddsValue > 0) {
      // Positive odds: bet $100 to win $X
      // Example: +118 means bet $100 to win $118
      return ((amount * oddsValue) / 100).toFixed(2)
    } else {
      // Negative odds: bet $X to win $100
      // Example: -142 means bet $142 to win $100
      return ((amount * 100) / Math.abs(oddsValue)).toFixed(2)
    }
  }

  const formatOdds = (value: string, betType: string) => {
    if (betType === 'moneyline') {
      const odds = parseInt(value)
      return odds > 0 ? `+${odds}` : odds.toString()
    } else if (betType === 'spread') {
      // Parse the new format: "line|odds" or just "line" for backward compatibility
      const parts = value.split('|')
      const spread = parts[0]
      const odds = parts[1] ? parseInt(parts[1]) : -110
      // Add + sign for positive spreads
      const displaySpread = parseFloat(spread) > 0 ? `+${spread}` : spread
      return `${displaySpread} (${odds > 0 ? '+' : ''}${odds})`
    } else if (betType === 'overUnder') {
      // Parse the new format: "line|odds" or just "line" for backward compatibility
      const parts = value.split('|')
      const line = parts[0]
      const odds = parts[1] ? parseInt(parts[1]) : -110
      return `O/U ${line} (${odds > 0 ? '+' : ''}${odds})`
    }
    return value
  }

  const formatBetType = (betType: string) => {
    switch (betType.toLowerCase()) {
      case 'moneyline':
        return 'Moneyline'
      case 'spread':
        return 'Spread'
      case 'overunder':
        return 'O/U'
      default:
        return betType.charAt(0).toUpperCase() + betType.slice(1).toLowerCase()
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400 text-lg">Loading active bets...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="text-red-400 text-lg font-medium">{error}</div>
      </div>
    )
  }

  if (activeBets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Active Bets</h3>
        <p className="text-gray-400">You don't have any active bets at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {activeBets.map((bet) => {
        const gameDetails = JSON.parse(bet.gameDetails)
        const isReceiver = bet.receiverId === session?.user?.id
        const yourOdds = isReceiver ? bet.receiverValue : bet.senderValue
        const theirOdds = isReceiver ? bet.senderValue : bet.receiverValue
        const yourPayout = calculatePayout(bet.amount, yourOdds, bet.betType)
        const theirPayout = calculatePayout(bet.amount, theirOdds, bet.betType)
        const isLive = gameDetails.status === 'live'

        return (
          <div key={bet.id} className={`group bg-white/5 hover:bg-white/10 border rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            isLive ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'
          }`}>
            {/* Header */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white flex-1 min-w-0">
                  <div className="truncate">{gameDetails.away_team} @ {gameDetails.home_team}</div>
                </h3>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {isLive && (
                    <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/50 rounded px-2 py-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400 font-bold text-xs">LIVE</span>
                    </div>
                  )}
                  <div className="bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">
                    ${bet.amount}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Game: {new Date(gameDetails.commence_time).toLocaleString()}</div>
                <div>vs {isReceiver ? bet.sender.username : bet.receiver.username}</div>
                <div>Accepted: {new Date(bet.createdAt).toLocaleDateString()}</div>
                {isLive && gameDetails.scores && (
                  <div className="bg-gray-800/50 rounded p-2 mt-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Current Score</p>
                      <p className="text-lg font-bold text-white">
                        {gameDetails.scores.away} - {gameDetails.scores.home}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bet Details - Mobile Optimized */}
            <div className="space-y-2">
              {/* Your Pick */}
              <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Your Pick</span>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                    {formatBetType(bet.betType)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {bet.betType === 'overUnder' 
                        ? (isReceiver ? (bet.receiverTeam === 'Over' ? 'Over' : 'Under') : (bet.senderTeam === 'Over' ? 'Over' : 'Under'))
                        : (isReceiver ? bet.receiverTeam : bet.senderTeam)
                      }
                    </p>
                    <p className="text-blue-400 text-xs">
                      {formatOdds(yourOdds, bet.betType)}
                    </p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-white font-bold text-sm">${bet.amount}</p>
                    <p className="text-green-400 text-xs">+${yourPayout}</p>
                  </div>
                </div>
              </div>

              {/* Their Pick */}
              <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Their Pick</span>
                  <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold">
                    {formatBetType(bet.betType)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {bet.betType === 'overUnder' 
                        ? (isReceiver ? (bet.senderTeam === 'Over' ? 'Over' : 'Under') : (bet.receiverTeam === 'Over' ? 'Over' : 'Under'))
                        : (isReceiver ? bet.senderTeam : bet.receiverTeam)
                      }
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatOdds(theirOdds, bet.betType)}
                    </p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-white font-bold text-sm">${bet.amount}</p>
                    <p className="text-blue-400 text-xs">+${theirPayout}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 