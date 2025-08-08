'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  startTime: string
  sport: string
  league: string
}

interface ShowdownRoom {
  id: string
  name: string
  creatorId: string
  entryFee: number
  status: string
  participants: {
    id: string
    userId: string
    username: string
    score: number
    picks: {
      gameId: string
      selectedTeam: string
      type: string
      isCorrect: boolean | null
    }[]
  }[]
}

export default function ShowdownRoomPage({ params }: { params: { roomId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [room, setRoom] = useState<ShowdownRoom | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userPicks, setUserPicks] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [roomRes, gamesRes] = await Promise.all([
        fetch(`/api/showdown/rooms/${params.roomId}`),
        fetch('/api/showdown/games')
      ])

      if (!roomRes.ok || !gamesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [roomData, gamesData] = await Promise.all([
        roomRes.json(),
        gamesRes.json()
      ])

      setRoom(roomData)
      setGames(gamesData || [])

      // If user has existing picks, load them
      const currentUser = roomData.participants.find(
        (p: any) => p.userId === session?.user?.id
      )
      if (currentUser?.picks) {
        const picks: Record<string, string> = {}
        currentUser.picks.forEach((pick: any) => {
          picks[pick.gameId] = pick.selectedTeam
        })
        setUserPicks(picks)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()

      // Set up polling for real-time updates
      const interval = setInterval(fetchData, 30000) // Poll every 30 seconds
      setRefreshInterval(interval)

      return () => {
        if (interval) {
          clearInterval(interval)
        }
      }
    }
  }, [status, params.roomId, session?.user?.id])

  const handlePick = (gameId: string, team: string) => {
    setUserPicks(prev => ({
      ...prev,
      [gameId]: team
    }))
  }

  const handleSubmitPicks = async () => {
    if (Object.keys(userPicks).length !== games.length) {
      toast.error('Please make a pick for every game')
      return
    }

    try {
      setSubmitting(true)
      const picks = Object.entries(userPicks).map(([gameId, team]) => ({
        gameId,
        selectedTeam: team,
        type: 'moneyline'
      }))

      const res = await fetch(`/api/showdown/rooms/${params.roomId}/picks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ picks }),
      })

      if (!res.ok) {
        throw new Error('Failed to submit picks')
      }

      toast.success('Picks submitted successfully')
      fetchData() // Refresh data to show updated picks
    } catch (err) {
      console.error('Error submitting picks:', err)
      toast.error('Failed to submit picks')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-xl text-gray-300">Loading room data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-300 text-lg font-medium mb-2">Room not found</p>
              <button
                onClick={() => router.push('/showdown')}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Back to Showdown
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentUser = room.participants.find(p => p.userId === session?.user?.id)
  const hasSubmittedPicks = currentUser?.picks.length === games.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Info and Standings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{room.name}</h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-300">Entry Fee: <span className="text-green-400">${room.entryFee}</span></p>
                    <p className="text-gray-300">Status: <span className="capitalize text-blue-400">{room.status}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/showdown')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Back
                </button>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Standings</h3>
                <div className="space-y-3">
                  {room.participants
                    .sort((a, b) => b.score - a.score)
                    .map((participant, index) => (
                      <div
                        key={participant.id}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          participant.userId === session?.user?.id
                            ? 'bg-blue-900/50 border border-blue-500'
                            : 'bg-gray-700/50 border border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`text-lg font-bold ${
                            index === 0 ? 'text-yellow-400' : 
                            index === 1 ? 'text-gray-300' : 
                            index === 2 ? 'text-amber-600' : 
                            'text-gray-400'
                          }`}>{index + 1}.</span>
                          <div>
                            <p className="font-medium text-white">{participant.username}</p>
                            <p className="text-sm text-gray-400">
                              {participant.picks.length} picks
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-green-400">{participant.score} pts</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Games and Picks */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Games</h3>
                {currentUser && !hasSubmittedPicks && (
                  <div className="text-sm text-gray-400">
                    {Object.keys(userPicks).length} of {games.length} games selected
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {games.map((game) => (
                  <div key={game.id} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900/50">
                    {/* Game Header */}
                    <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-400">{game.sport}</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-sm text-gray-400">{game.league}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(game.startTime).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Teams and Selection */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Home Team */}
                        <div className={`rounded-lg p-4 transition-all duration-200 ${
                          userPicks[game.id] === game.homeTeam
                            ? 'bg-blue-900/50 border-2 border-blue-500'
                            : 'bg-gray-800/50 border border-gray-700 hover:border-blue-500/50'
                        }`}>
                          <button
                            onClick={() => handlePick(game.id, game.homeTeam)}
                            disabled={!currentUser || hasSubmittedPicks}
                            className={`w-full text-left ${
                              !currentUser || hasSubmittedPicks ? 'cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">{game.homeTeam}</span>
                              {userPicks[game.id] === game.homeTeam && (
                                <span className="text-blue-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          </button>
                        </div>

                        {/* Away Team */}
                        <div className={`rounded-lg p-4 transition-all duration-200 ${
                          userPicks[game.id] === game.awayTeam
                            ? 'bg-blue-900/50 border-2 border-blue-500'
                            : 'bg-gray-800/50 border border-gray-700 hover:border-blue-500/50'
                        }`}>
                          <button
                            onClick={() => handlePick(game.id, game.awayTeam)}
                            disabled={!currentUser || hasSubmittedPicks}
                            className={`w-full text-left ${
                              !currentUser || hasSubmittedPicks ? 'cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">{game.awayTeam}</span>
                              {userPicks[game.id] === game.awayTeam && (
                                <span className="text-blue-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {currentUser && !hasSubmittedPicks && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSubmitPicks}
                    disabled={submitting || Object.keys(userPicks).length !== games.length}
                    className={`px-6 py-3 rounded-lg font-medium text-base ${
                      submitting || Object.keys(userPicks).length !== games.length
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                    } transition-all duration-200`}
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit Picks'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 