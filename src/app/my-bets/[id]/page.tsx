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
        // Trigger immediate updates
        window.dispatchEvent(new Event('balanceUpdate'))
        window.dispatchEvent(new Event('notificationUpdate'))
        
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
      const odds = parseFloat(value)
      return odds > 0 ? `+${odds}` : `${odds}`
    } else if (betType === 'spread') {
      const parts = value.split('|')
      const spread = parts[0]
      const odds = parts[1] ? parseInt(parts[1]) : -110
      const displaySpread = parseFloat(spread) > 0 ? `+${spread}` : spread
      return `${displaySpread} (${odds > 0 ? '+' : ''}${odds})`
    } else if (betType === 'overUnder') {
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
        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-700">
          {/* Game Header - Clean and Clear */}
          {gameDetails && (
            <div className="mb-8 pb-6 border-b border-gray-700">
              <div className="text-center mb-4">
                <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Game</div>
                <div className="text-white font-bold text-2xl sm:text-3xl">
                  {gameDetails.away_team} <span className="text-gray-500 mx-2">@</span> {gameDetails.home_team}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm uppercase tracking-wider mb-1">Date</div>
                <div className="text-white text-lg">
                  {new Date(gameDetails.commence_time).toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bet Details - Side by Side Picks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Your Pick */}
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-6 border-2 border-blue-500/30">
              <div className="text-blue-400 text-sm uppercase tracking-wider mb-4 font-semibold">
                Your Pick
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Team</div>
                  <div className="text-white font-bold text-xl">
                    {bet.betType === 'overUnder' 
                      ? (isReceiver ? (bet.receiverTeam === 'Over' ? 'Over' : 'Under') : (bet.senderTeam === 'Over' ? 'Over' : 'Under'))
                      : (isReceiver ? bet.receiverTeam : bet.senderTeam)
                    }
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Bet</div>
                  <div className="text-white font-bold text-2xl">${bet.amount}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Odds</div>
                  <div className="text-blue-400 font-bold text-xl">
                    {formatOdds(isReceiver ? bet.receiverValue : bet.senderValue, bet.betType)}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Potential Win</div>
                  <div className="text-green-400 font-bold text-2xl">
                    ${calculatePayout(bet.amount, isReceiver ? bet.receiverValue : bet.senderValue, bet.betType)}
                  </div>
                </div>
              </div>
            </div>

            {/* Their Pick */}
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-6 border-2 border-purple-500/30">
              <div className="text-purple-400 text-sm uppercase tracking-wider mb-4 font-semibold">
                Their Pick
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Team</div>
                  <div className="text-white font-bold text-xl">
                    {bet.betType === 'overUnder' 
                      ? (isReceiver ? (bet.senderTeam === 'Over' ? 'Over' : 'Under') : (bet.receiverTeam === 'Over' ? 'Over' : 'Under'))
                      : (isReceiver ? bet.senderTeam : bet.receiverTeam)
                    }
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Bet</div>
                  <div className="text-white font-bold text-2xl">${bet.amount}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Odds</div>
                  <div className="text-purple-400 font-bold text-xl">
                    {formatOdds(isReceiver ? bet.senderValue : bet.receiverValue, bet.betType)}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Potential Win</div>
                  <div className="text-green-400 font-bold text-2xl">
                    ${calculatePayout(bet.amount, isReceiver ? bet.senderValue : bet.receiverValue, bet.betType)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {bet.message && (
            <div className="bg-gray-900/50 rounded-lg p-5 mb-6 border border-gray-700">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Message</div>
              <p className="text-white text-lg">{bet.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          {isReceiver && bet.status === 'PENDING' && (
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={() => handleBetResponse('accept')}
                disabled={responding}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02]"
              >
                {responding ? 'Accepting...' : 'Accept Bet'}
              </button>
              <button
                onClick={() => handleBetResponse('decline')}
                disabled={responding}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-red-500/50 transform hover:scale-[1.02]"
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