'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { formatOdds } from '@/lib/utils/odds'

interface BetModalProps {
  isOpen: boolean
  onClose: () => void
  bet: {
    id: string
    home_team: string
    away_team: string
    commence_time: string
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
    selectedTeam?: 'home' | 'away' | 'over' | 'under' | null
    betType?: 'moneyline' | 'spread' | 'overUnder' | null
  }
  onBetPlaced: () => void
  isLiveBet?: boolean
}

interface Friend {
  id: string
  name: string
}

export default function BetModal({ isOpen, onClose, bet, onBetPlaced, isLiveBet = false }: BetModalProps) {
  const { data: session } = useSession()
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [selectedFriend, setSelectedFriend] = useState('')
  const [loading, setLoading] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendsLoading, setFriendsLoading] = useState(true)
  const [friendsError, setFriendsError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | 'over' | 'under' | null>(bet.selectedTeam || null)
  const [selectedBetType, setSelectedBetType] = useState<'moneyline' | 'spread' | 'overUnder' | null>(bet.betType || null)

  // Get the first bookmaker's odds
  const bookmaker = bet.bookmakers[0]
  const moneylineMarket = bookmaker?.markets.find(m => m.key === 'h2h')
  const spreadMarket = bookmaker?.markets.find(m => m.key === 'spreads')
  const totalsMarket = bookmaker?.markets.find(m => m.key === 'totals')

  const homeOdds = moneylineMarket?.outcomes.find(o => o.name === bet.home_team)?.price
  const awayOdds = moneylineMarket?.outcomes.find(o => o.name === bet.away_team)?.price
  const homeSpread = spreadMarket?.outcomes.find(o => o.name === bet.home_team)?.point
  const awaySpread = spreadMarket?.outcomes.find(o => o.name === bet.away_team)?.point
  const homeSpreadOdds = spreadMarket?.outcomes.find(o => o.name === bet.home_team)?.price
  const awaySpreadOdds = spreadMarket?.outcomes.find(o => o.name === bet.away_team)?.price
  const overUnder = totalsMarket?.outcomes[0]?.point
  const overOdds = totalsMarket?.outcomes.find(o => o.name === 'Over')?.price
  const underOdds = totalsMarket?.outcomes.find(o => o.name === 'Under')?.price

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchFriends()
    }
  }, [isOpen, session?.user?.id])

  useEffect(() => {
    if (bet.betType && bet.selectedTeam) {
      setSelectedBetType(bet.betType)
      setSelectedTeam(bet.selectedTeam)
    }
  }, [bet])

  const fetchFriends = async () => {
    setFriendsLoading(true)
    setFriendsError(null)
    try {
      const response = await fetch('/api/friends')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch friends')
      }
      const data = await response.json()
      if (!data.friends || !Array.isArray(data.friends)) {
        throw new Error('Invalid friends data format')
      }
      setFriends(data.friends.map((friend: any) => ({
        id: friend.id,
        name: friend.username
      })))
    } catch (error) {
      console.error('Error fetching friends:', error)
      setFriendsError(error instanceof Error ? error.message : 'Failed to load friends')
      toast.error('Failed to load friends')
    } finally {
      setFriendsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) {
      toast.error('You must be logged in to place a bet')
      return
    }

    if (!selectedFriend) {
      toast.error('Please select a friend to bet with')
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid bet amount')
      return
    }

    if (!selectedBetType || !selectedTeam) {
      toast.error('Please select a bet type and team')
      return
    }

    setLoading(true)
    try {
      // Log the bet data being sent
      const betData = {
        gameId: bet.id,
        senderTeam: selectedTeam === 'home' ? bet.home_team : 
                   selectedTeam === 'away' ? bet.away_team :
                   selectedTeam === 'over' ? 'Over' : 'Under',
        receiverTeam: selectedTeam === 'home' ? bet.away_team :
                     selectedTeam === 'away' ? bet.home_team :
                     selectedTeam === 'over' ? 'Under' : 'Over',
        betType: selectedBetType,
        senderValue: selectedBetType === 'moneyline' 
          ? (selectedTeam === 'home' ? homeOdds?.toString() : awayOdds?.toString())
          : selectedBetType === 'spread'
          ? (selectedTeam === 'home' ? homeSpread?.toString() : awaySpread?.toString())
          : overUnder?.toString(),
        receiverValue: selectedBetType === 'moneyline'
          ? (selectedTeam === 'home' ? awayOdds?.toString() : homeOdds?.toString())
          : selectedBetType === 'spread'
          ? (selectedTeam === 'home' ? awaySpread?.toString() : homeSpread?.toString())
          : overUnder?.toString(),
        senderOdds: selectedBetType === 'moneyline'
            ? (selectedTeam === 'home' ? homeOdds : awayOdds)
            : selectedBetType === 'spread'
            ? (selectedTeam === 'home' ? homeSpreadOdds : awaySpreadOdds)
            : selectedTeam === 'over' ? overOdds : underOdds,
        receiverOdds: selectedBetType === 'moneyline'
            ? (selectedTeam === 'home' ? awayOdds : homeOdds)
            : selectedBetType === 'spread'
            ? (selectedTeam === 'home' ? awaySpreadOdds : homeSpreadOdds)
            : selectedTeam === 'over' ? underOdds : overOdds,
        amount: Number(amount),
        receiverId: selectedFriend,
        message,
        gameDetails: bet,
        isLiveBet
      }
      console.log('Sending bet data:', betData)

      const response = await fetch('/api/bets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(betData),
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        console.error('Bet creation failed:', responseData)
        throw new Error(responseData.error || 'Failed to place bet')
      }

      toast.success('Bet placed successfully!', {
        duration: 2000,
        style: {
          maxWidth: '90vw',
        },
      })
      
      // Trigger balance refresh
      window.dispatchEvent(new Event('balanceUpdate'))
      
      // Also trigger a small delay to ensure the balance updates
      setTimeout(() => {
        window.dispatchEvent(new Event('balanceUpdate'))
      }, 100)
      
      onBetPlaced()
      onClose()
    } catch (error) {
      console.error('Error placing bet:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to place bet')
    } finally {
      setLoading(false)
    }
  }

  // Calculate payouts based on selected team and bet type
  const calculatePayout = (selectedTeam: string, betType: string, stake: number) => {
    if (!selectedTeam || !betType || !stake) return null

    let userOdds = 0
    let friendOdds = 0
    let userValue = ''
    let friendValue = ''

    if (betType === 'moneyline') {
      // For moneyline, use the actual odds from the API
      userOdds = selectedTeam === 'home' ? homeOdds || 0 : awayOdds || 0
      friendOdds = selectedTeam === 'home' ? awayOdds || 0 : homeOdds || 0
      userValue = userOdds.toString()
      friendValue = friendOdds.toString()
    } else if (betType === 'spread') {
      // For spread bets, use the actual odds from the API
      if (selectedTeam === 'home') {
        userOdds = homeSpreadOdds || -110
        friendOdds = awaySpreadOdds || -110
        userValue = homeSpread?.toString() || ''
        friendValue = awaySpread?.toString() || ''
      } else {
        userOdds = awaySpreadOdds || -110
        friendOdds = homeSpreadOdds || -110
        userValue = awaySpread?.toString() || ''
        friendValue = homeSpread?.toString() || ''
      }
    } else if (betType === 'overUnder') {
      // For over/under bets, use the actual odds from the API
      if (selectedTeam === 'over') {
        userOdds = overOdds || -110
        friendOdds = underOdds || -110
      } else {
        userOdds = underOdds || -110
        friendOdds = overOdds || -110
      }
      userValue = overUnder?.toString() || ''
      friendValue = overUnder?.toString() || ''
    }

    // Calculate payouts using proper sportsbook formulas
    const calculateSportsbookPayout = (odds: number, stake: number) => {
      if (odds > 0) {
        // Positive odds: bet $100 to win $X
        // Example: +162 means bet $100 to win $162
        const profit = (stake * odds) / 100
        return {
          stake,
          profit,
          payout: stake + profit
        }
      } else {
        // Negative odds: bet $X to win $100
        // Example: -110 means bet $110 to win $100
        const profit = (stake * 100) / Math.abs(odds)
        return {
          stake,
          profit,
          payout: stake + profit
        }
      }
    }

    return {
      user: calculateSportsbookPayout(userOdds, stake),
      friend: calculateSportsbookPayout(friendOdds, stake),
      userOdds,
      friendOdds,
      userValue,
      friendValue
    }
  }

  const payout = selectedTeam && selectedBetType && amount 
    ? calculatePayout(selectedTeam, selectedBetType, Number(amount))
    : null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-2 sm:p-3 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Place a Bet</h2>
            <p className="text-gray-400 text-xs">
              {new Date(bet.commence_time).toLocaleString('en-US', {
                timeZone: 'America/New_York',
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Game Info */}
        <div className="bg-gray-800 rounded-lg p-2 mb-3 border border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-white font-bold text-sm">{bet.away_team}</div>
            <div className="text-gray-400 text-sm">@</div>
            <div className="text-white font-bold text-sm">{bet.home_team}</div>
          </div>
          {isLiveBet && bet.scores && (
            <div className="text-center text-white font-bold text-lg mt-1">
              {bet.scores.away} - {bet.scores.home}
            </div>
          )}
        </div>

        {/* Bet Type Selection */}
        <div className="mb-3">
          <label className="block text-white font-semibold text-xs mb-1">Bet Type</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                setSelectedBetType('moneyline')
                setSelectedTeam(null)
              }}
              className={`p-1.5 rounded-lg text-center transition-all text-xs ${
                selectedBetType === 'moneyline'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Moneyline
            </button>
            <button
              onClick={() => {
                setSelectedBetType('spread')
                setSelectedTeam(null)
              }}
              className={`p-1.5 rounded-lg text-center transition-all text-xs ${
                selectedBetType === 'spread'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Spread
            </button>
            <button
              onClick={() => {
                setSelectedBetType('overUnder')
                setSelectedTeam(null)
              }}
              className={`p-1.5 rounded-lg text-center transition-all text-xs ${
                selectedBetType === 'overUnder'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Over/Under
            </button>
          </div>
        </div>

        {/* Team Selection */}
        {selectedBetType && (
          <div className="mb-3">
            <label className="block text-white font-semibold text-xs mb-1">Your Pick</label>
            <div className="grid grid-cols-2 gap-1">
              {selectedBetType === 'overUnder' ? (
                <>
                  <button
                    onClick={() => setSelectedTeam('over')}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedTeam === 'over'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-bold text-sm">Over</div>
                    <div className="text-xs mt-0.5">
                      {overUnder} ({formatOdds(overOdds || -110)})
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTeam('under')}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedTeam === 'under'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-bold text-sm">Under</div>
                    <div className="text-xs mt-0.5">
                      {overUnder} ({formatOdds(underOdds || -110)})
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedTeam('away')}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedTeam === 'away'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{bet.away_team}</div>
                    <div className="text-xs mt-0.5">
                      {selectedBetType === 'moneyline' 
                        ? formatOdds(awayOdds || 0) 
                        : selectedBetType === 'spread'
                        ? `${awaySpread ? (awaySpread > 0 ? '+' : '') + awaySpread : '0'} (${formatOdds(awaySpreadOdds || -110)})`
                        : ''}
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTeam('home')}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedTeam === 'home'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{bet.home_team}</div>
                    <div className="text-xs mt-0.5">
                      {selectedBetType === 'moneyline' 
                        ? formatOdds(homeOdds || 0) 
                        : selectedBetType === 'spread'
                        ? `${homeSpread ? (homeSpread > 0 ? '+' : '') + homeSpread : '0'} (${formatOdds(homeSpreadOdds || -110)})`
                        : ''}
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Friend Selection */}
        <div className="mb-3">
          <label className="block text-white font-semibold text-xs mb-1">Select Friend</label>
          <select
            value={selectedFriend}
            onChange={(e) => setSelectedFriend(e.target.value)}
            className="w-full p-1.5 rounded-lg bg-gray-800 text-white text-xs border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="">Select a friend</option>
            {friendsLoading ? (
              <option disabled>Loading friends...</option>
            ) : friendsError ? (
              <option disabled>Error loading friends</option>
            ) : friends.length === 0 ? (
              <option disabled>No friends found</option>
            ) : (
              friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Bet Amount */}
        <div className="mb-3">
          <label className="block text-white font-semibold text-xs mb-1">Wager Amount</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full p-1.5 pl-6 rounded-lg bg-gray-800 text-white text-sm border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Payout Information */}
        {payout && selectedTeam && (
          <div className="bg-gray-800 rounded-lg p-2 mb-3 border border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              {/* Your Side */}
              <div className="bg-gray-900 rounded-lg p-2">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Your Pick</div>
                <div className="text-white font-bold text-xs mb-0.5">
                  {selectedTeam === 'home' ? bet.home_team :
                   selectedTeam === 'away' ? bet.away_team :
                   selectedTeam === 'over' ? 'Over' : 'Under'}
                </div>
                {selectedBetType === 'spread' && (
                  <div className="text-blue-400 text-xs mb-0.5">Line: {selectedTeam === 'home' ? homeSpread : awaySpread}</div>
                )}
                {selectedBetType === 'overUnder' && (
                  <div className="text-blue-400 text-xs mb-0.5">Total: {overUnder}</div>
                )}
                <div className="text-blue-400 text-xs mb-2">
                  Odds: {formatOdds(payout.userOdds)}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Risk:</span>
                    <span className="text-white font-bold text-xs">${payout.user.stake.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">To Win:</span>
                    <span className="text-green-400 font-bold text-xs">${payout.user.profit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Payout:</span>
                    <span className="text-green-400 font-bold text-xs">${payout.user.payout.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Friend's Side */}
              <div className="bg-gray-900 rounded-lg p-2">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Friend's Pick</div>
                <div className="text-white font-bold text-xs mb-0.5">
                  {selectedTeam === 'home' ? bet.away_team :
                   selectedTeam === 'away' ? bet.home_team :
                   selectedTeam === 'over' ? 'Under' : 'Over'}
                </div>
                {selectedBetType === 'spread' && (
                  <div className="text-blue-400 text-xs mb-0.5">Line: {selectedTeam === 'home' ? awaySpread : homeSpread}</div>
                )}
                {selectedBetType === 'overUnder' && (
                  <div className="text-blue-400 text-xs mb-0.5">Total: {overUnder}</div>
                )}
                <div className="text-blue-400 text-xs mb-2">
                  Odds: {formatOdds(payout.friendOdds)}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Risk:</span>
                    <span className="text-white font-bold text-xs">${payout.friend.stake.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">To Win:</span>
                    <span className="text-green-400 font-bold text-xs">${payout.friend.profit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Payout:</span>
                    <span className="text-green-400 font-bold text-xs">${payout.friend.payout.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedBetType || !selectedTeam || !selectedFriend || !amount}
          className={`w-full p-2.5 rounded-lg text-white font-bold text-sm transition-all ${
            loading || !selectedBetType || !selectedTeam || !selectedFriend || !amount
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'
          }`}
        >
          {loading ? 'Placing Bet...' : 'Send Bet'}
        </button>
      </div>
    </div>
  )
} 