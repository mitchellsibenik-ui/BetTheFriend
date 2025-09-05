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

export default function PendingBets() {
  const { data: session } = useSession()
  const [pendingBets, setPendingBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPendingBets()
  }, [])

  const fetchPendingBets = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/bets/pending')
      if (!response.ok) {
        throw new Error('Failed to fetch pending bets')
      }
      const data = await response.json()
      setPendingBets(data.bets)
    } catch (error) {
      console.error('Error fetching pending bets:', error)
      setError('Failed to load pending bets')
    } finally {
      setLoading(false)
    }
  }

  const handleBetResponse = async (betId: string, action: 'accept' | 'decline') => {
    try {
      setError('')
      const response = await fetch(`/api/bets/${betId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to respond to bet')
      }

      // Remove the bet from the list
      setPendingBets(prev => prev.filter(bet => bet.id !== betId))

      // Trigger balance refresh for both accept and decline
      window.dispatchEvent(new Event('balanceUpdate'))
      
      // Also trigger a small delay to ensure the balance updates
      setTimeout(() => {
        window.dispatchEvent(new Event('balanceUpdate'))
      }, 100)

      // If the bet was accepted, trigger a refresh of active bets
      if (action === 'accept') {
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('betAccepted', { detail: { betId } }))
      }
    } catch (error) {
      console.error('Error responding to bet:', error)
      setError(error instanceof Error ? error.message : 'Failed to respond to bet')
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

  const formatBetDetails = (bet: Bet) => {
    const gameDetails = typeof bet.gameDetails === 'string' ? JSON.parse(bet.gameDetails) : bet.gameDetails
    const gameTime = new Date(gameDetails.commence_time).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short'
    })

    const betTime = new Date(bet.createdAt).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short'
    })

    let betDescription = ''
    if (bet.betType === 'moneyline') {
      betDescription = `${bet.senderTeam} (${formatOdds(bet.senderValue, 'moneyline')}) vs ${bet.receiverTeam} (${formatOdds(bet.receiverValue, 'moneyline')})`
    } else if (bet.betType === 'spread') {
      const senderParts = bet.senderValue.split('|')
      const receiverParts = bet.receiverValue.split('|')
      const senderSpread = senderParts[0]
      const receiverSpread = receiverParts[0]
      const senderOdds = senderParts[1] ? parseInt(senderParts[1]) : -110
      const receiverOdds = receiverParts[1] ? parseInt(receiverParts[1]) : -110
      const displaySenderSpread = parseFloat(senderSpread) > 0 ? `+${senderSpread}` : senderSpread
      const displayReceiverSpread = parseFloat(receiverSpread) > 0 ? `+${receiverSpread}` : receiverSpread
      betDescription = `${bet.senderTeam} ${displaySenderSpread} (${senderOdds > 0 ? '+' : ''}${senderOdds}) vs ${bet.receiverTeam} ${displayReceiverSpread} (${receiverOdds > 0 ? '+' : ''}${receiverOdds})`
    } else if (bet.betType === 'overUnder') {
      const senderParts = bet.senderValue.split('|')
      const receiverParts = bet.receiverValue.split('|')
      const senderLine = senderParts[0]
      const receiverLine = receiverParts[0]
      const senderOdds = senderParts[1] ? parseInt(senderParts[1]) : -110
      const receiverOdds = receiverParts[1] ? parseInt(receiverParts[1]) : -110
      betDescription = `Over ${senderLine} (${senderOdds > 0 ? '+' : ''}${senderOdds}) vs Under ${receiverLine} (${receiverOdds > 0 ? '+' : ''}${receiverOdds})`
    }

    return {
      game: `${gameDetails.away_team} @ ${gameDetails.home_team}`,
      time: gameTime,
      betTime: betTime,
      bet: betDescription,
      amount: `$${bet.amount}`,
      potentialPayout: `$${calculatePayout(bet.amount, bet.senderValue, bet.betType)}`
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
      return ((amount * oddsValue) / 100).toFixed(2)
    } else {
      return ((amount * 100) / Math.abs(oddsValue)).toFixed(2)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400 text-lg">Loading pending bets...</div>
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

  if (pendingBets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Pending Bets</h3>
        <p className="text-gray-400">You don't have any pending bet requests at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {pendingBets.map((bet) => {
        const details = formatBetDetails(bet)
        const isReceiver = bet.receiverId === session?.user?.id
        const yourOdds = isReceiver ? bet.receiverValue : bet.senderValue
        const theirOdds = isReceiver ? bet.senderValue : bet.receiverValue
        const yourPayout = calculatePayout(bet.amount, yourOdds, bet.betType)
        const theirPayout = calculatePayout(bet.amount, theirOdds, bet.betType)

        return (
          <div key={bet.id} className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            {/* Header */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white flex-1 min-w-0">
                  <div className="truncate">{details.game}</div>
                </h3>
                <div className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold ml-2 flex-shrink-0">
                  {details.amount}
                </div>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Game: {details.time}</div>
                <div>Placed: {details.betTime}</div>
                <div>{isReceiver ? 'From' : 'To'}: {isReceiver ? bet.sender.username : bet.receiver.username}</div>
              </div>
            </div>

            {/* Bet Details - Mobile Optimized */}
            <div className="space-y-2 mb-4">
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

            {/* Action Buttons */}
            {isReceiver && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleBetResponse(bet.id, 'accept')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 px-6 rounded-xl transition-all duration-200 font-bold text-base shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept Bet
                  </div>
                </button>
                <button
                  onClick={() => handleBetResponse(bet.id, 'decline')}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white py-3 px-6 rounded-xl transition-all duration-200 font-bold text-base shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Decline Bet
                  </div>
                </button>
              </div>
            )}

            {!isReceiver && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-gray-400">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Waiting for {bet.receiver.username} to respond...</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
} 