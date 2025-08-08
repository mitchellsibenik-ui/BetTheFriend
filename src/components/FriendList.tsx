'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Friend {
  id: string
  username: string
  createdAt: string
  status: string
}

export default function FriendList() {
  const { data: session } = useSession()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch('/api/friends')
        if (!response.ok) {
          throw new Error('Failed to fetch friends')
        }
        const data = await response.json()
        setFriends(data.friends)
      } catch (error) {
        console.error('Error fetching friends:', error)
        setError('Failed to load friends')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchFriends()
    }
  }, [session])

  if (loading) {
    return <div className="text-white">Loading friends...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (friends.length === 0) {
    return <div className="text-gray-400">No friends yet</div>
  }

  return (
    <div className="space-y-4">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <h3 className="text-lg font-medium text-white">{friend.username}</h3>
            <p className="text-sm text-gray-400">
              Friends since {new Date(friend.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-900 rounded-full">
            {friend.status}
          </span>
        </div>
      ))}
    </div>
  )
} 