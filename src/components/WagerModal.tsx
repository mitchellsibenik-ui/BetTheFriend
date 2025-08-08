'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Event } from '@/app/types'

interface Friend {
  id: number
  username: string
}

interface WagerModalProps {
  open: boolean
  onClose: () => void
  event: Event
  team: string
  betType: 'moneyline' | 'spread' | 'over' | 'under'
  wagers: any[]
  setWagers: (wagers: any[]) => void
}

export default function WagerModal({
  open,
  onClose,
  event,
  team,
  betType,
  wagers,
  setWagers
}: WagerModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedFriend, setSelectedFriend] = useState<number | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Fetch friends when modal opens
  useEffect(() => {
    if (open) {
      fetchFriends()
    }
  }, [open])

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/friends/wager-list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch friends')
      }

      const data = await response.json()
      setFriends(data.friends)
    } catch (error) {
      console.error('Error fetching friends:', error)
      setError('Failed to load friends')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFriend) {
      setError('Please select a friend')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Send wager to backend
      const response = await fetch('/api/wagers/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          amount,
          team,
          betType,
          recipientId: selectedFriend
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send wager')
      }

      // Add to local state (optional, for instant UI feedback)
      setWagers([...wagers, data.wager])
      setSuccess(true)
      setAmount('')
      setSelectedFriend(null)
      setTimeout(() => setSuccess(false), 3000)
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to create wager')
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Place Wager</h2>
          <button
            className="text-gray-400 hover:text-white transition"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="text-white font-semibold">{event.teams[0]} vs {event.teams[1]}</div>
          <div className="text-gray-400 text-sm mt-1">
            {betType === 'moneyline' && `${team}: ${event.odds[team]}`}
            {betType === 'spread' && `${team}: ${event.spread[team]}`}
            {betType === 'over' && `Over ${event.overUnder}`}
            {betType === 'under' && `Under ${event.overUnder}`}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Friend
            </label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
              value={selectedFriend || ''}
              onChange={(e) => setSelectedFriend(Number(e.target.value))}
              required
            >
              <option value="">Choose a friend...</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Wager Amount
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          {success && (
            <div className="text-green-500 text-sm">Wager sent successfully! 🎉</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Placing Wager...' : 'Place Wager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 