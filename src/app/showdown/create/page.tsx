'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function CreateRoomPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [entryFee, setEntryFee] = useState(10)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) {
      toast.error('Please sign in to create a room')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/showdown/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          entryFee,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create room')
      }

      const data = await response.json()
      toast.success('Room created successfully!')
      router.push('/showdown')
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Create Showdown Room</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Room Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter room name"
              />
            </div>
            <div>
              <label htmlFor="entryFee" className="block text-sm font-medium text-gray-700">
                Entry Fee ($)
              </label>
              <input
                type="number"
                id="entryFee"
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 