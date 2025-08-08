'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Wager {
  id: number
  eventId: string
  amount: number
  terms: string
  status: string
  createdAt: string
  sender: {
    id: number
    username: string
  }
  receiver: {
    id: number
    username: string
  }
}

export default function PendingWagers() {
  const [sentWagers, setSentWagers] = useState<Wager[]>([])
  const [receivedWagers, setReceivedWagers] = useState<Wager[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const fetchPendingWagers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/wagers/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pending wagers')
      }

      const data = await response.json()
      setSentWagers(data.sentWagers)
      setReceivedWagers(data.receivedWagers)
    } catch (error) {
      console.error('Error fetching pending wagers:', error)
      setError('Failed to load pending wagers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWagerResponse = async (wagerId: number, action: 'ACCEPT' | 'DENY') => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/wagers/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ wagerId, action })
      })

      if (!response.ok) {
        throw new Error('Failed to respond to wager')
      }

      // Refresh the wagers list
      fetchPendingWagers()
    } catch (error) {
      console.error('Error responding to wager:', error)
      setError('Failed to respond to wager')
    }
  }

  useEffect(() => {
    fetchPendingWagers()
  }, [])

  if (isLoading) {
    return <div className="text-white">Loading pending wagers...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-8">
      {/* Received Wagers */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Received Wagers</h2>
        {receivedWagers.length === 0 ? (
          <p className="text-gray-400">No pending wagers received</p>
        ) : (
          <div className="space-y-4">
            {receivedWagers.map((wager) => (
              <div
                key={wager.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-white font-medium">
                      From: {wager.sender.username}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Amount: ${wager.amount}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Terms: {wager.terms}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Sent: {new Date(wager.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWagerResponse(wager.id, 'ACCEPT')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleWagerResponse(wager.id, 'DENY')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Wagers */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Sent Wagers</h2>
        {sentWagers.length === 0 ? (
          <p className="text-gray-400">No pending wagers sent</p>
        ) : (
          <div className="space-y-4">
            {sentWagers.map((wager) => (
              <div
                key={wager.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div>
                  <p className="text-white font-medium">
                    To: {wager.receiver.username}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Amount: ${wager.amount}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Terms: {wager.terms}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Sent: {new Date(wager.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 