'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

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
  message?: string
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

export default function BetDetailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const betId = params.id as string
  
  const [bet, setBet] = useState<Bet | null>(null)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    
    if (status === 'authenticated' && betId) {
      fetchBetDetails()
    }
  }, [status, betId, router])

  const fetchBetDetails = async () => {
    if (!betId) return
    
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/bets/${betId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch bet details')
      }

      const data = await response.json()
      setBet(data.bet)
    } catch (err) {
      console.error('Error fetching bet details:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bet details')
      toast.error('Failed to load bet details')
    } finally {
      setLoading(false)
    }
  }

  const handleBetResponse = async (action: 'accept' | 'decline') => {
    if (!bet) return

    try {
      setResponding(true)
      
      const response = await fetch(`/api/bets/${betId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        window.dispatchEvent(new Event('balanceUpdate'))
        window.dispatchEvent(new Event('notificationUpdate'))
        
        // Also trigger a small delay to ensure the counter updates
        setTimeout(() => {
          window.dispatchEvent(new Event('notificationUpdate'))
        }, 100)
        
        // Add another delay to ensure the notification is marked as read
        setTimeout(() => {
          window.dispatchEvent(new Event('notificationUpdate'))
        }, 500)
        
        toast.success(action === 'accept' ? 'Bet accepted!' : 'Bet declined', {
          duration: 2000,
        })
        router.push('/my-bets')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to respond to bet')
      }
    } catch (error) {
      console.error('Error responding to bet:', error)
      toast.error('Failed to respond to bet')
    } finally {
      setResponding(false)
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

  const calculatePayout = (amount: number, odds: string, betType: string): string => {
    if (betType === 'overUnder') {
      // Parse the new format: "line|odds" or just "line" for backward compatibility
      const parts = odds.split('|')
      const oddsValue = parts[1] ? parseInt(parts[1]) : -110
      return calculateSportsbookPayout(oddsValue, amount)
    } else if (betType === 'moneyline') {
      const oddsValue = parseInt(odds)
      return calculateSportsbookPayout(oddsValue, amount)
    } else if (betType === 'spread') {
      // Parse the new format: "line|odds" or just "line" for backward compatibility
      const parts = odds.split('|')
      const oddsValue = parts[1] ? parseInt(parts[1]) : -110
      return calculateSportsbookPayout(oddsValue, amount)
    }
    return '0.00'
  }

  const calculateSportsbookPayout = (odds: number, stake: number) => {
    if (odds > 0) {
      return ((stake * odds) / 100).toFixed(2)
    } else {
      return ((stake * 100) / Math.abs(odds)).toFixed(2)
    }
  }

  const getGameDetails = () => {
    if (!bet?.gameDetails) return null
    try {
      return JSON.parse(bet.gameDetails)
    } catch {
      return null
    }
  }

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-xl text-gray-300">Loading bet details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !bet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
              <p className="text-red-500 text-lg font-medium mb-2">{error || 'Bet not found'}</p>
              <button
                onClick={() => router.push('/my-bets')}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Back to My Bets
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const gameDetails = getGameDetails()
  const isReceiver = bet.receiverId === session?.user?.id
  const isSender = bet.senderId === session?.user?.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Bet Details</h1>
            <p className="text-gray-400 mt-2">Review the bet before accepting or declining</p>
          </div>
          <button
            onClick={() => router.push('/my-bets')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to My Bets
          </button>
        </div>

        {/* Bet Card */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          {/* Game Info */}
          {gameDetails && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-white font-bold text-lg">{gameDetails.away_team}</div>
                <div className="text-gray-400 text-sm">vs</div>
                <div className="text-white font-bold text-lg">{gameDetails.home_team}</div>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                {new Date(gameDetails.commence_time).toLocaleString('en-US', {
                  timeZone: 'America/New_York',
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  timeZoneName: 'short'
                })}
              </p>
            </div>
          )}

          {/* Bet Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Sender's Side */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">From: {bet.sender.username}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Team:</span>
                  <span className="text-white font-semibold">{bet.senderTeam}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bet Type:</span>
                  <span className="text-white font-semibold capitalize">{formatBetType(bet.betType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Odds/Line:</span>
                  <span className="text-blue-400 font-semibold">
                    {formatOdds(bet.senderValue, bet.betType)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk:</span>
                  <span className="text-white font-semibold">${bet.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To Win:</span>
                  <span className="text-green-400 font-bold">${calculatePayout(bet.amount, bet.senderValue, bet.betType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Payout:</span>
                  <span className="text-green-400 font-bold">${(parseFloat(calculatePayout(bet.amount, bet.senderValue, bet.betType)) + bet.amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Receiver's Side */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">To: {bet.receiver.username}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Team:</span>
                  <span className="text-white font-semibold">{bet.receiverTeam}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bet Type:</span>
                  <span className="text-white font-semibold capitalize">{formatBetType(bet.betType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Odds/Line:</span>
                  <span className="text-blue-400 font-semibold">
                    {formatOdds(bet.receiverValue, bet.betType)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk:</span>
                  <span className="text-white font-semibold">${bet.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To Win:</span>
                  <span className="text-green-400 font-bold">${calculatePayout(bet.amount, bet.receiverValue, bet.betType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Payout:</span>
                  <span className="text-green-400 font-bold">${(parseFloat(calculatePayout(bet.amount, bet.receiverValue, bet.betType)) + bet.amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {bet.message && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <h4 className="text-white font-semibold mb-2">Message:</h4>
              <p className="text-gray-300">{bet.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          {isReceiver && bet.status === 'PENDING' && (
            <div className="flex gap-4">
              <button
                onClick={() => handleBetResponse('accept')}
                disabled={responding}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {responding ? 'Accepting...' : 'Accept Bet'}
              </button>
              <button
                onClick={() => handleBetResponse('decline')}
                disabled={responding}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {responding ? 'Declining...' : 'Decline Bet'}
              </button>
            </div>
          )}

          {isSender && bet.status === 'PENDING' && (
            <div className="text-center">
              <p className="text-gray-400">Waiting for {bet.receiver.username} to respond...</p>
            </div>
          )}

          {bet.status !== 'PENDING' && (
            <div className="text-center">
              <p className={`text-lg font-semibold ${
                bet.status === 'ACTIVE' ? 'text-green-400' : 
                bet.status === 'DECLINED' ? 'text-red-400' : 'text-gray-400'
              }`}>
                Status: {bet.status}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 