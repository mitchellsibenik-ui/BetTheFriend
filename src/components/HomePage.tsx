import React from 'react';
import Link from 'next/link';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            {/* Decorative elements */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight animate-fade-in">
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-transparent bg-clip-text bg-size-200 animate-gradient">
                Bet Against Friends.{' '}
                No House, No Hassle.
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-delay">
              The first peer-to-peer sports betting platform that lets you challenge your friends directly.{' '}
              <span className="text-gray-400">No bookmakers, no house edge - just friendly competition.</span>
            </p>
            
            <Link href="/auth/login">
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 animate-fade-in-delay-2">
                Start Betting Now
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Info Cards Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-200">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Peer-to-Peer Betting
            </h3>
            <p className="text-gray-600">
              Challenge your friends directly with custom bets. No middleman, no house edge - just pure competition.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-200">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Customizable Odds
            </h3>
            <p className="text-gray-600">
              Set your own odds and terms. Make it fair, make it fun, make it yours.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-200">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Social Competition
            </h3>
            <p className="text-gray-600">
              Track your wins, build your reputation, and compete with friends in a whole new way.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Why BetTheFriend?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Traditional sportsbooks take a cut of every bet. We believe in fair play and friendly competition. 
            With BetTheFriend, you're betting directly with friends, setting your own terms, and keeping the fun in sports betting.
          </p>
          <button className="bg-green-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl">
            Join the Community
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 