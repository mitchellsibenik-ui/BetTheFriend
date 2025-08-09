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
      <div className="text-center py-4">
        <div className="text-gray-400">Loading pending bets...</div>
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

  if (pendingBets.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-400">No pending bets</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pendingBets.map((bet) => {
        const details = formatBetDetails(bet)
        const isReceiver = bet.receiverId === session?.user?.id
        const yourOdds = isReceiver ? bet.receiverValue : bet.senderValue
        const theirOdds = isReceiver ? bet.senderValue : bet.receiverValue
        const yourPayout = calculatePayout(bet.amount, yourOdds, bet.betType)
        const theirPayout = calculatePayout(bet.amount, theirOdds, bet.betType)

        return (
          <div key={bet.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {details.game}
                </h3>
                <p className="text-sm text-gray-400">
                  Game: {details.time}
                </p>
                <p className="text-sm text-gray-400">
                  Bet Placed: {details.betTime}
                </p>
              </div>
              <div className="text-right min-w-0">
                <p className="text-white font-medium">{details.amount}</p>
                <p className="text-sm text-gray-400 whitespace-nowrap">
                  {isReceiver ? 'From' : 'To'}: {isReceiver ? bet.sender.username : bet.receiver.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-700 rounded p-3">
                <p className="text-sm text-gray-400 mb-1">Your Pick</p>
                <p className="text-white font-medium">
                  {isReceiver ? bet.receiverTeam : bet.senderTeam}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-400">
                    {formatBetType(bet.betType)}
                  </p>
                  <p className="text-lg font-bold text-green-400">
                    {formatOdds(yourOdds, bet.betType)}
                  </p>
                  <p className="text-sm text-gray-400">
                    Potential Payout: ${yourPayout}
                  </p>
                </div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <p className="text-sm text-gray-400 mb-1">Their Pick</p>
                <p className="text-white font-medium">
                  {isReceiver ? bet.senderTeam : bet.receiverTeam}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-400">
                    {formatBetType(bet.betType)}
                  </p>
                  <p className="text-lg font-bold text-blue-400">
                    {formatOdds(theirOdds, bet.betType)}
                  </p>
                  <p className="text-sm text-gray-400">
                    Potential Payout: ${theirPayout}
                  </p>
                </div>
              </div>
            </div>

            {bet.trashTalk && (
              <div className="bg-gray-700 rounded p-3 mb-4">
                <p className="text-sm text-gray-400 mb-1">Message</p>
                <p className="text-white italic">"{bet.trashTalk}"</p>
              </div>
            )}

            {isReceiver && (
              <div className="flex space-x-4">
                <button
                  onClick={() => handleBetResponse(bet.id, 'accept')}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleBetResponse(bet.id, 'decline')}
                  className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
} 