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
      <div className="text-center py-4">
        <div className="text-gray-400">Loading active bets...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (activeBets.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-400">No active bets</div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {activeBets.map((bet) => {
        const gameDetails = JSON.parse(bet.gameDetails)
        const isReceiver = bet.receiverId === session?.user?.id
        const yourOdds = isReceiver ? bet.receiverValue : bet.senderValue
        const theirOdds = isReceiver ? bet.senderValue : bet.receiverValue
        const yourPayout = calculatePayout(bet.amount, yourOdds, bet.betType)
        const theirPayout = calculatePayout(bet.amount, theirOdds, bet.betType)
        const isLive = gameDetails.status === 'live'

        return (
          <div key={bet.id} className={`bg-gray-800 rounded-lg shadow-lg border ${
            isLive ? 'border-red-500' : 'border-gray-700'
          } hover:border-blue-500 transition-all duration-200`}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-700">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {gameDetails.away_team} @ {gameDetails.home_team}
                    </h3>
                    {isLive && (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                        <span className="text-red-500 font-medium text-sm">LIVE</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 mb-1">
                    {new Date(gameDetails.commence_time).toLocaleString()}
                  </p>
                  <p className="text-sm sm:text-lg font-semibold text-white">
                    Against: {isReceiver ? bet.sender.username : bet.receiver.username}
                  </p>
                  {isLive && gameDetails.scores && (
                    <p className="text-base sm:text-lg font-bold text-white mt-1">
                      {gameDetails.scores.away} - {gameDetails.scores.home}
                    </p>
                  )}
                </div>
                <div className="text-right mt-2 sm:mt-0">
                  <p className="text-xs text-gray-500">
                    Accepted: {new Date(bet.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Bet Details */}
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Your Pick */}
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <h4 className="text-base sm:text-lg font-semibold text-white">Your Pick</h4>
                    <span className="px-2 sm:px-3 py-1 bg-blue-600 rounded-full text-xs sm:text-sm font-medium text-white">
                      {formatBetType(bet.betType)}
                    </span>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Team</span>
                      <span className="text-white font-medium text-sm">
                        {bet.betType === 'overUnder' 
                          ? (isReceiver ? (bet.receiverTeam === 'Over' ? 'Over' : 'Under') : (bet.senderTeam === 'Over' ? 'Over' : 'Under'))
                          : (isReceiver ? bet.receiverTeam : bet.senderTeam)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Odds</span>
                      <span className="text-base sm:text-lg font-bold text-green-400">
                        {formatOdds(yourOdds, bet.betType)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Risk</span>
                      <span className="text-white font-medium">${bet.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">To Win</span>
                      <span className="text-base sm:text-lg font-bold text-green-400">${yourPayout}</span>
                    </div>
                  </div>
                </div>

                {/* Their Pick */}
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <h4 className="text-base sm:text-lg font-semibold text-white">Their Pick</h4>
                    <span className="px-2 sm:px-3 py-1 bg-red-600 rounded-full text-xs sm:text-sm font-medium text-white">
                      {formatBetType(bet.betType)}
                    </span>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Team</span>
                      <span className="text-white font-medium text-sm">
                        {bet.betType === 'overUnder' 
                          ? (isReceiver ? (bet.senderTeam === 'Over' ? 'Over' : 'Under') : (bet.receiverTeam === 'Over' ? 'Over' : 'Under'))
                          : (isReceiver ? bet.senderTeam : bet.receiverTeam)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Odds</span>
                      <span className="text-base sm:text-lg font-bold text-blue-400">
                        {formatOdds(theirOdds, bet.betType)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Risk</span>
                      <span className="text-white font-medium">${bet.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">To Win</span>
                      <span className="text-base sm:text-lg font-bold text-blue-400">${theirPayout}</span>
                    </div>
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