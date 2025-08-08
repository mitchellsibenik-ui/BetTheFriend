'use client'

import { useState } from 'react'
import { MOCK_FRIENDS } from '../data/mockData'

type Prop = {
  id: string
  player: string
  team: string
  opponent: string
  prop: string
  odds: number
  impliedProbability: number
}

type GroupChallenge = {
  id: string
  name: string
  participants: string[]
  currentDraftPosition: number
  draftOrder: string[]
  status: 'drafting' | 'active' | 'completed'
  amount: number
  picks: Record<string, Prop[]>
  scores: Record<string, number>
  endTime: string
}

const MOCK_PROPS: Prop[] = [
  // NBA Props
  {
    id: '1',
    player: 'Luka Doncic',
    team: 'Mavericks',
    opponent: 'Warriors',
    prop: 'Over 27.5 Points',
    odds: 265,
    impliedProbability: 0.27
  },
  {
    id: '2',
    player: 'Nikola Jokic',
    team: 'Nuggets',
    opponent: 'Lakers',
    prop: 'Triple Double',
    odds: 180,
    impliedProbability: 0.36
  },
  {
    id: '3',
    player: 'Stephen Curry',
    team: 'Warriors',
    opponent: 'Mavericks',
    prop: 'Over 4.5 Three Pointers',
    odds: 320,
    impliedProbability: 0.24
  },
  {
    id: '4',
    player: 'LeBron James',
    team: 'Lakers',
    opponent: 'Nuggets',
    prop: 'Over 7.5 Assists',
    odds: 150,
    impliedProbability: 0.40
  },
  {
    id: '5',
    player: 'Anthony Davis',
    team: 'Lakers',
    opponent: 'Nuggets',
    prop: 'Over 12.5 Rebounds',
    odds: 190,
    impliedProbability: 0.34
  },
  {
    id: '6',
    player: 'Kyrie Irving',
    team: 'Mavericks',
    opponent: 'Warriors',
    prop: 'Over 24.5 Points',
    odds: 210,
    impliedProbability: 0.32
  },
  // NFL Props
  {
    id: '7',
    player: 'Christian McCaffrey',
    team: '49ers',
    opponent: 'Cowboys',
    prop: '2+ Touchdowns',
    odds: 320,
    impliedProbability: 0.24
  },
  {
    id: '8',
    player: 'Travis Kelce',
    team: 'Chiefs',
    opponent: 'Bills',
    prop: 'Over 75.5 Receiving Yards',
    odds: 150,
    impliedProbability: 0.40
  },
  {
    id: '9',
    player: 'Patrick Mahomes',
    team: 'Chiefs',
    opponent: 'Bills',
    prop: 'Over 2.5 Touchdown Passes',
    odds: 180,
    impliedProbability: 0.36
  },
  {
    id: '10',
    player: 'Dak Prescott',
    team: 'Cowboys',
    opponent: '49ers',
    prop: 'Over 250.5 Passing Yards',
    odds: 165,
    impliedProbability: 0.38
  },
  {
    id: '11',
    player: 'Deebo Samuel',
    team: '49ers',
    opponent: 'Cowboys',
    prop: 'Over 85.5 Receiving Yards',
    odds: 220,
    impliedProbability: 0.31
  },
  {
    id: '12',
    player: 'Stefon Diggs',
    team: 'Bills',
    opponent: 'Chiefs',
    prop: 'Over 6.5 Receptions',
    odds: 195,
    impliedProbability: 0.34
  }
]

const MOCK_GROUP_CHALLENGES: GroupChallenge[] = [
  {
    id: '1',
    name: 'NBA Sunday Showdown',
    participants: ['You', 'Jessica Lane', 'Mike Smith', 'Sarah Johnson', 'Alex Brown'],
    currentDraftPosition: 3,
    draftOrder: ['You', 'Alex Brown', 'Sarah Johnson', 'Mike Smith', 'Jessica Lane'],
    status: 'drafting',
    amount: 50,
    picks: {
      'You': [MOCK_PROPS[0]],
      'Alex Brown': [MOCK_PROPS[1]],
      'Sarah Johnson': [MOCK_PROPS[2]],
      'Mike Smith': [],
      'Jessica Lane': []
    },
    scores: {
      'You': 0,
      'Alex Brown': 0,
      'Sarah Johnson': 0,
      'Mike Smith': 0,
      'Jessica Lane': 0
    },
    endTime: '2h 15m'
  }
]

export default function PlayerPropRoyale() {
  const [selectedProps, setSelectedProps] = useState<Prop[]>([])
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [showInfo, setShowInfo] = useState(true)
  const [challengeName, setChallengeName] = useState('')

  const handlePropSelect = (prop: Prop) => {
    if (selectedProps.length < 5 && !selectedProps.find(p => p.id === prop.id)) {
      setSelectedProps([...selectedProps, prop])
    }
  }

  const handlePropRemove = (propId: string) => {
    setSelectedProps(selectedProps.filter(p => p.id !== propId))
  }

  const handleSubmit = () => {
    // TODO: Implement challenge submission
    setShowChallengeModal(false)
    setSelectedProps([])
    setSelectedFriends([])
    setAmount('')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Player Prop Royale</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <span>{showInfo ? 'Hide Info' : 'Show Info'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowChallengeModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>New Group Challenge</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info Section */}
        {showInfo && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">How to Play</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-blue-400 mb-2">1. Create a Group Challenge</h3>
                <p className="text-gray-300">Invite up to 5 friends to join your challenge. Set the entry fee and challenge name.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-400 mb-2">2. Snake Draft</h3>
                <p className="text-gray-300">Take turns selecting player props in a snake draft format (1-2-3-4-5-5-4-3-2-1). Each player gets 2 props.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-400 mb-2">3. Score Points</h3>
                <p className="text-gray-300">Earn points for each prop that hits. Longshot props (odds {'>'} +200) are worth bonus points!</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-400 mb-2">4. Win the Challenge</h3>
                <p className="text-gray-300">The player with the most points at the end of the games wins the challenge and takes the pot!</p>
              </div>
              <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h3 className="text-lg font-medium text-blue-400 mb-2">Scoring System</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Regular Props: 1 point</li>
                  <li>Longshot Props (+200 to +300): 2 points</li>
                  <li>Super Longshot Props (+300+): 3 points</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Active Group Challenges */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Active Group Challenges</h3>
          <div className="space-y-4">
            {MOCK_GROUP_CHALLENGES.map(challenge => (
              <div key={challenge.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-white">{challenge.name}</h4>
                    <p className="text-sm text-gray-400">${challenge.amount} entry • {challenge.participants.length} players</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-blue-500/20 rounded-full text-xs font-bold text-blue-400">
                      {challenge.status === 'drafting' ? 'Drafting' : 'Active'}
                    </span>
                    <div className="text-sm text-gray-400 mt-1">Ends in {challenge.endTime}</div>
                  </div>
                </div>

                {/* Draft Status */}
                {challenge.status === 'drafting' && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Draft Order</h5>
                    <div className="flex flex-wrap gap-2">
                      {challenge.draftOrder.map((participant, index) => (
                        <div
                          key={participant}
                          className={`px-3 py-1 rounded-full text-sm ${
                            index === challenge.currentDraftPosition
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {participant}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Picks */}
                <div className="space-y-3">
                  {challenge.participants.map(participant => (
                    <div key={participant} className="flex items-center justify-between">
                      <span className="text-gray-300">{participant}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {challenge.picks[participant]?.length || 0}/2 picks
                        </span>
                        <span className="text-sm text-blue-400">
                          {challenge.scores[participant]} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Props */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* NBA Props */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">NBA Player Props</h3>
            <div className="space-y-3">
              {MOCK_PROPS.filter(p => p.team === 'Mavericks' || p.team === 'Nuggets').map(prop => (
                <div 
                  key={prop.id}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => handlePropSelect(prop)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-medium">{prop.player}</span>
                      <span className="text-gray-400 text-sm ml-2">vs {prop.opponent}</span>
                    </div>
                    <span className="text-blue-400 font-semibold">+{prop.odds}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-400">{prop.prop}</div>
                </div>
              ))}
            </div>
          </div>

          {/* NFL Props */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">NFL Player Props</h3>
            <div className="space-y-3">
              {MOCK_PROPS.filter(p => p.team === '49ers' || p.team === 'Chiefs').map(prop => (
                <div 
                  key={prop.id}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => handlePropSelect(prop)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-medium">{prop.player}</span>
                      <span className="text-gray-400 text-sm ml-2">vs {prop.opponent}</span>
                    </div>
                    <span className="text-blue-400 font-semibold">+{prop.odds}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-400">{prop.prop}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Props */}
        {selectedProps.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Selected Props ({selectedProps.length}/5)</h3>
            <div className="space-y-3">
              {selectedProps.map(prop => (
                <div key={prop.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-medium">{prop.player}</span>
                      <span className="text-gray-400 text-sm ml-2">vs {prop.opponent}</span>
                    </div>
                    <button
                      onClick={() => handlePropRemove(prop.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-1 text-sm text-gray-400">{prop.prop}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">New Group Challenge</h2>
            
            {/* Challenge Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Challenge Name</label>
              <input
                type="text"
                value={challengeName}
                onChange={(e) => setChallengeName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NBA Sunday Showdown"
              />
            </div>

            {/* Friend Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Friends (up to 5)</label>
              <div className="space-y-2">
                {MOCK_FRIENDS.map(friend => (
                  <label key={friend.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend.id)}
                      onChange={(e) => {
                        if (e.target.checked && selectedFriends.length < 5) {
                          setSelectedFriends([...selectedFriends, friend.id])
                        } else if (!e.target.checked) {
                          setSelectedFriends(selectedFriends.filter(id => id !== friend.id))
                        }
                      }}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-700 bg-gray-800"
                    />
                    <span className="text-gray-300">{friend.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Entry Fee</label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-gray-400">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add a message..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowChallengeModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!challengeName || selectedFriends.length === 0 || !amount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 