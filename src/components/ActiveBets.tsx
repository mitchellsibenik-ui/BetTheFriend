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
    <div className="space-y-6">
      {activeBets.map((bet) => {
        const gameDetails = JSON.parse(bet.gameDetails)
        const isReceiver = bet.receiverId === session?.user?.id
        const yourOdds = isReceiver ? bet.receiverValue : bet.senderValue
        const theirOdds = isReceiver ? bet.senderValue : bet.receiverValue
        const yourPayout = calculatePayout(bet.amount, yourOdds, bet.betType)
        const theirPayout = calculatePayout(bet.amount, theirOdds, bet.betType)
        const isLive = gameDetails.status === 'in_progress'

        return (
          <div key={bet.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            {/* Game Header */}
            <div className="bg-gray-900 p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-white">
                      {gameDetails.homeTeam} {gameDetails.awayTeam}
                    </h3>
                    {isLive && (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                        <span className="text-red-500 font-medium">LIVE</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {new Date(gameDetails.commence_time).toLocaleString()}
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    Against: {isReceiver ? bet.sender.username : bet.receiver.username}
                  </p>
                  {isLive && gameDetails.scores && (
                    <p className="text-lg font-bold text-white mt-1">
                      {gameDetails.scores.away} - {gameDetails.scores.home}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Accepted: {new Date(bet.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Bet Details */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Your Pick */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-white">Your Pick</h4>
                    <span className="px-3 py-1 bg-blue-600 rounded-full text-sm font-medium text-white">
                      {formatBetType(bet.betType)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Team</span>
                      <span className="text-white font-medium">
                        {isReceiver ? bet.receiverTeam : bet.senderTeam}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Odds</span>
                      <span className="text-lg font-bold text-green-400">
                        {formatOdds(yourOdds, bet.betType)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Risk</span>
                      <span className="text-white font-medium">${bet.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">To Win</span>
                      <span className="text-lg font-bold text-green-400">${yourPayout}</span>
                    </div>
                  </div>
                </div>

                {/* Their Pick */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-white">Their Pick</h4>
                    <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-medium text-white">
                      {formatBetType(bet.betType)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Team</span>
                      <span className="text-white font-medium">
                        {isReceiver ? bet.senderTeam : bet.receiverTeam}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Odds</span>
                      <span className="text-lg font-bold text-purple-400">
                        {formatOdds(theirOdds, bet.betType)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Risk</span>
                      <span className="text-white font-medium">${bet.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">To Win</span>
                      <span className="text-lg font-bold text-purple-400">${theirPayout}</span>
                    </div>
                  </div>
                </div>
              </div>

              {bet.trashTalk && (
                <div className="mt-4 bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Trash Talk</p>
                  <p className="text-white italic">"{bet.trashTalk}"</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 