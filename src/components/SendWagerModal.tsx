'use client'

import { useState } from 'react'

const MOCK_GAMES = [
  { id: 1, label: 'Eagles vs Cowboys (Spread)' },
  { id: 2, label: 'Lakers vs Celtics (Moneyline)' },
  { id: 3, label: 'Yankees vs Red Sox (Over/Under)' },
]
const MOCK_FRIENDS = [
  { id: 1, username: 'JohnDoe' },
  { id: 2, username: 'SarahJones' },
  { id: 3, username: 'MikeSmith' },
]

export default function SendWagerModal({ open, onClose, prefillGame, prefillFriend }: any) {
  const [game, setGame] = useState(prefillGame || '')
  const [friend, setFriend] = useState(prefillFriend || '')
  const [message, setMessage] = useState('')
  const [gifUrl, setGifUrl] = useState('')
  const [expiration, setExpiration] = useState('')
  const [showExpiration, setShowExpiration] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
          📤 Send Wager
        </h2>
        {/* Pick a game */}
        <div className="mb-3">
          <label className="block text-gray-400 mb-1">Game/Prop</label>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
            value={game}
            onChange={e => setGame(e.target.value)}
          >
            <option value="">Select a game or prop</option>
            {MOCK_GAMES.map(g => (
              <option key={g.id} value={g.label}>{g.label}</option>
            ))}
          </select>
        </div>
        {/* Choose a friend */}
        <div className="mb-3">
          <label className="block text-gray-400 mb-1">Friend</label>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
            value={friend}
            onChange={e => setFriend(e.target.value)}
          >
            <option value="">Select a friend</option>
            {MOCK_FRIENDS.map(f => (
              <option key={f.id} value={f.username}>{f.username}</option>
            ))}
          </select>
        </div>
        {/* Message */}
        <div className="mb-3">
          <label className="block text-gray-400 mb-1">Message</label>
          <input
            type="text"
            placeholder="You're crazy if you think the Eagles cover."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={120}
          />
        </div>
        {/* GIF/Meme */}
        <div className="mb-3">
          <label className="block text-gray-400 mb-1">GIF or Meme (optional)</label>
          <input
            type="url"
            placeholder="Paste a GIF or meme URL"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            value={gifUrl}
            onChange={e => setGifUrl(e.target.value)}
          />
          {gifUrl && (
            <div className="mt-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gifUrl} alt="GIF preview" className="max-h-32 rounded-lg border border-gray-700" />
            </div>
          )}
        </div>
        {/* Expiration */}
        {showExpiration && (
          <div className="mb-3">
            <label className="block text-gray-400 mb-1">Set Expiration</label>
            <input
              type="datetime-local"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
              value={expiration}
              onChange={e => setExpiration(e.target.value)}
            />
          </div>
        )}
        {/* Buttons */}
        <div className="flex justify-between items-center mt-6">
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold shadow-lg hover:from-yellow-300 hover:to-yellow-400 transition text-lg"
            onClick={() => {
              // TODO: Send wager logic here
              onClose()
            }}
          >
            🟩 Send It
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-blue-700 transition ${showExpiration ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setShowExpiration(v => !v)}
            type="button"
          >
            ⏳ Set Expiration
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
} 