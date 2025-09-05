'use client'

import { useState } from 'react'
import PendingBets from '@/components/PendingBets'
import ActiveBets from '@/components/ActiveBets'
import SettledBets from '@/components/SettledBets'

type Tab = 'pending' | 'active' | 'settled'

export default function MyBetsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pending')

  const tabs = [
    { id: 'pending' as Tab, label: 'Pending', count: 0 },
    { id: 'active' as Tab, label: 'Active', count: 0 },
    { id: 'settled' as Tab, label: 'Settled', count: 0 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Enhanced Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-b-3xl blur-3xl"></div>
        <div className="relative bg-white/5 backdrop-blur-xl border-b border-white/10 rounded-b-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                My Bets
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-2">
                Track your betting activity and manage wagers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-1 shadow-2xl">
          <div className="grid grid-cols-3 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-300 font-medium text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-blue-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8">
            {/* Content with smooth transitions */}
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === 'pending' && <PendingBets />}
              {activeTab === 'active' && <ActiveBets />}
              {activeTab === 'settled' && <SettledBets />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 