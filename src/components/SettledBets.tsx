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
      <div className="text-center py-4">
        <div className="text-gray-400">Loading settled bets...</div>
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

  if (settledBets.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-400">No settled bets</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
          <div key={bet.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {gameDetails.homeTeam} vs {gameDetails.awayTeam}
                </h3>
                <p className="text-sm text-gray-400">
                  Settled on {new Date(bet.resolvedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">${bet.amount}</p>
                <p className="text-sm text-gray-400">
                  Against: {isReceiver ? bet.sender.username : bet.receiver.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`rounded p-3 ${isWinner ? 'bg-green-900/30' : isLoser ? 'bg-red-900/30' : 'bg-gray-700'}`}>
                <p className="text-sm text-gray-400 mb-1">Your Pick</p>
                <p className="text-white">
                  {isReceiver ? bet.receiverTeam : bet.senderTeam}
                </p>
                <p className="text-sm text-gray-400">
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
                {isWinner && (
                  <p className="text-sm text-green-400 mt-2">✓ Won</p>
                )}
                {isLoser && (
                  <p className="text-sm text-red-400 mt-2">✗ Lost</p>
                )}
                {isInvolved && !isWinner && !isLoser && (
                  <p className="text-sm text-gray-400 mt-2">Push</p>
                )}
              </div>
              <div className={`rounded p-3 ${isWinner ? 'bg-red-900/30' : isLoser ? 'bg-green-900/30' : 'bg-gray-700'}`}>
                <p className="text-sm text-gray-400 mb-1">Their Pick</p>
                <p className="text-white">
                  {isReceiver ? bet.senderTeam : bet.receiverTeam}
                </p>
                <p className="text-sm text-gray-400">
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
                {isWinner && (
                  <p className="text-sm text-red-400 mt-2">✗ Lost</p>
                )}
                {isLoser && (
                  <p className="text-sm text-green-400 mt-2">✓ Won</p>
                )}
                {isInvolved && !isWinner && !isLoser && (
                  <p className="text-sm text-gray-400 mt-2">Push</p>
                )}
              </div>
            </div>

            {bet.trashTalk && (
              <div className="bg-gray-700 rounded p-3">
                <p className="text-sm text-gray-400 mb-1">Trash Talk</p>
                <p className="text-white italic">"{bet.trashTalk}"</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
} 