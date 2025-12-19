import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatTeamName } from '@/lib/utils/teamNames'

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
  resolvedAt: string
  result: 'win' | 'lose' | 'push'
  winnerId: string | null
  loserId: string | null
  sender: {
    id: string
    username: string
  }
  receiver: {
    id: string
    username: string
  }
  winner: {
    id: string
    username: string
  } | null
  loser: {
    id: string
    username: string
  } | null
}

export default function SettledBets() {
  const { data: session } = useSession()
  const [settledBets, setSettledBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const fetchSettledBets = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/bets/settled')
      if (!response.ok) {
        throw new Error('Failed to fetch settled bets')
      }
      const data = await response.json()
      setSettledBets(data.bets)
    } catch (error) {
      console.error('Error fetching settled bets:', error)
      setError('Failed to load settled bets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettledBets()
  }, [])

  useEffect(() => {
    // Listen for bet settlement updates
    const handleBetSettlement = () => {
      fetchSettledBets()
    }
    
    window.addEventListener('betSettlement', handleBetSettlement)
    return () => window.removeEventListener('betSettlement', handleBetSettlement)
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400 text-lg">Loading settled bets...</div>
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

  if (settledBets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Settled Bets</h3>
        <p className="text-gray-400">You don't have any settled bets yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {settledBets.map((bet) => {
        const gameDetails = JSON.parse(bet.gameDetails)
        const isReceiver = bet.receiverId === session?.user?.id
        const isSender = bet.senderId === session?.user?.id
        const isWinner = bet.winnerId === session?.user?.id
        const isLoser = bet.loserId === session?.user?.id
        const isInvolved = isSender || isReceiver

        // Only show bets where the current user is involved
        if (!isInvolved) return null

        return (
          <div key={bet.id} className={`group bg-white/5 hover:bg-white/10 border rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            isWinner ? 'border-green-500/50 bg-green-500/5' : 
            isLoser ? 'border-red-500/50 bg-red-500/5' : 
            'border-white/10'
          }`}>
            {/* Header */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white flex-1 min-w-0">
                  <div className="truncate">{formatTeamName(gameDetails.away_team)} @ {formatTeamName(gameDetails.home_team)}</div>
                </h3>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    isWinner ? 'bg-green-500/20 text-green-400' :
                    isLoser ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {isWinner ? 'WON' : isLoser ? 'LOST' : 'PUSH'}
                  </div>
                  <div className={`px-2 py-1 rounded text-sm font-bold ${
                    isWinner ? 'bg-green-600 text-white' :
                    isLoser ? 'bg-red-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    ${bet.amount}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Settled: {new Date(bet.resolvedAt).toLocaleDateString()}</div>
                <div>vs {isReceiver ? bet.sender.username : bet.receiver.username}</div>
                {/* Final Score Display */}
                {gameDetails.scores && (
                  <div className="bg-gray-800/50 rounded p-2 mt-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Final Score</p>
                      <p className="text-lg font-bold text-white">
                        {gameDetails.scores.away} - {gameDetails.scores.home}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bet Details - Mobile Optimized */}
            <div className="space-y-2 mb-3">
              {/* Your Pick */}
              <div className={`bg-gray-800/50 border rounded-lg p-3 ${
                isWinner ? 'border-green-500/30' : 
                isLoser ? 'border-red-500/30' : 
                'border-gray-600/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs uppercase tracking-wide ${
                    isWinner ? 'text-green-400' : 
                    isLoser ? 'text-red-400' : 
                    'text-gray-400'
                  }`}>
                    Your Pick
                  </span>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    isWinner ? 'bg-green-600 text-white' :
                    isLoser ? 'bg-red-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {bet.betType === 'moneyline' ? 'ML' : 
                     bet.betType === 'spread' ? 'SPR' :
                     bet.betType === 'overUnder' ? 'O/U' : 'TOT'}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {(isReceiver ? bet.receiverTeam : bet.senderTeam) === 'Over' || (isReceiver ? bet.receiverTeam : bet.senderTeam) === 'Under' 
                        ? (isReceiver ? bet.receiverTeam : bet.senderTeam)
                        : formatTeamName(isReceiver ? bet.receiverTeam : bet.senderTeam)}
                    </p>
                    <p className={`text-xs ${
                      isWinner ? 'text-green-400' : 
                      isLoser ? 'text-red-400' : 
                      'text-gray-400'
                    }`}>
                      {bet.betType === 'moneyline' ? 'Moneyline' : 
                       bet.betType === 'spread' ? (() => {
                         const parts = bet.senderValue.split('|')
                         const spread = parts[0]
                         const odds = parts[1] ? parseInt(parts[1]) : -110
                         const displaySpread = parseFloat(spread) > 0 ? `+${spread}` : spread
                         return `Spread ${displaySpread} (${odds > 0 ? '+' : ''}${odds})`
                       })() :
                       bet.betType === 'overUnder' ? (() => {
                         const parts = bet.senderValue.split('|')
                         const line = parts[0]
                         const odds = parts[1] ? parseInt(parts[1]) : -110
                         return `O/U ${line} (${odds > 0 ? '+' : ''}${odds})`
                       })() :
                       `Total ${bet.senderValue}`}
                    </p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-white font-bold text-sm">${bet.amount}</p>
                    <p className={`text-xs ${
                      isWinner ? 'text-green-400' : 
                      isLoser ? 'text-red-400' : 
                      'text-gray-400'
                    }`}>
                      {isWinner ? `+$${calculatePayout(bet.amount, isReceiver ? bet.receiverValue : bet.senderValue, bet.betType)}` : 
                       isLoser ? `-$0` : 
                       `$0`}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {isWinner && (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isLoser && (
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {isInvolved && !isWinner && !isLoser && (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                      <span className={`text-xs font-bold ${
                        isWinner ? 'text-green-400' : 
                        isLoser ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {isWinner ? 'Won' : isLoser ? 'Lost' : 'Push'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Their Pick */}
              <div className={`bg-gray-800/50 border rounded-lg p-3 ${
                isWinner ? 'border-red-500/30' : 
                isLoser ? 'border-green-500/30' : 
                'border-gray-600/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs uppercase tracking-wide ${
                    isWinner ? 'text-red-400' : 
                    isLoser ? 'text-green-400' : 
                    'text-gray-400'
                  }`}>
                    Their Pick
                  </span>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    isWinner ? 'bg-red-600 text-white' :
                    isLoser ? 'bg-green-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {bet.betType === 'moneyline' ? 'ML' : 
                     bet.betType === 'spread' ? 'SPR' :
                     bet.betType === 'overUnder' ? 'O/U' : 'TOT'}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {(isReceiver ? bet.senderTeam : bet.receiverTeam) === 'Over' || (isReceiver ? bet.senderTeam : bet.receiverTeam) === 'Under'
                        ? (isReceiver ? bet.senderTeam : bet.receiverTeam)
                        : formatTeamName(isReceiver ? bet.senderTeam : bet.receiverTeam)}
                    </p>
                    <p className={`text-xs ${
                      isWinner ? 'text-red-400' : 
                      isLoser ? 'text-green-400' : 
                      'text-gray-400'
                    }`}>
                      {bet.betType === 'moneyline' ? 'Moneyline' : 
                       bet.betType === 'spread' ? (() => {
                         const parts = bet.receiverValue.split('|')
                         const spread = parts[0]
                         const odds = parts[1] ? parseInt(parts[1]) : -110
                         const displaySpread = parseFloat(spread) > 0 ? `+${spread}` : spread
                         return `Spread ${displaySpread} (${odds > 0 ? '+' : ''}${odds})`
                       })() :
                       bet.betType === 'overUnder' ? (() => {
                         const parts = bet.receiverValue.split('|')
                         const line = parts[0]
                         const odds = parts[1] ? parseInt(parts[1]) : -110
                         return `O/U ${line} (${odds > 0 ? '+' : ''}${odds})`
                       })() :
                       `Total ${bet.receiverValue}`}
                    </p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-white font-bold text-sm">${bet.amount}</p>
                    <p className={`text-xs ${
                      isWinner ? 'text-red-400' : 
                      isLoser ? 'text-green-400' : 
                      'text-gray-400'
                    }`}>
                      {isWinner ? `-$0` : 
                       isLoser ? `+$${calculatePayout(bet.amount, isReceiver ? bet.senderValue : bet.receiverValue, bet.betType)}` : 
                       `$0`}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {isWinner && (
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {isLoser && (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isInvolved && !isWinner && !isLoser && (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                      <span className={`text-xs font-bold ${
                        isWinner ? 'text-red-400' : 
                        isLoser ? 'text-green-400' : 
                        'text-gray-400'
                      }`}>
                        {isWinner ? 'Lost' : isLoser ? 'Won' : 'Push'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trash Talk */}
            {bet.trashTalk && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1 font-medium">Trash Talk</p>
                    <p className="text-white italic">"{bet.trashTalk}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
} 