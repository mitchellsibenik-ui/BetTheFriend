'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Friend {
  id: number
  username: string
  createdAt: string
  status: string
}

interface CreateWagerFormProps {
  friends: Friend[]
}

export default function CreateWagerForm({ friends }: CreateWagerFormProps) {
  const [selectedFriend, setSelectedFriend] = useState('')
  const [amount, setAmount] = useState('')
  const [terms, setTerms] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { data: session, status } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    if (status !== 'authenticated') {
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch('/api/wagers/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: parseInt(selectedFriend),
          amount: parseFloat(amount),
          terms
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create wager')
      }

      setSuccess('Wager sent successfully!')
      // Reset form
      setSelectedFriend('')
      setAmount('')
      setTerms('')
      
      // Refresh the page after 2 seconds
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error creating wager:', error)
      setError(error instanceof Error ? error.message : 'Failed to create wager')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="text-white">Loading...</div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Select Friend
        </label>
        <select
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          value={selectedFriend}
          onChange={(e) => setSelectedFriend(e.target.value)}
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
          Amount
        </label>
        <input
          type="number"
          min="1"
          step="0.01"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Terms
        </label>
        <textarea
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          required
          rows={3}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {success && (
        <div className="text-green-500 text-sm">{success}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Send Wager'}
      </button>
    </form>
  )
} 