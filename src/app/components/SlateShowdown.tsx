'use client'

import { useState } from 'react'
import { Event } from '../types'

interface Slate {
  id: string
  sport: string
  name: string
  games: Event[]
  startTime: string
  endTime: string
  status: 'upcoming' | 'live' | 'completed'
}

const TEAMS: Record<string, string[]> = {
  NFL: ['Chiefs', '49ers', 'Eagles', 'Bills', 'Cowboys', 'Packers', 'Ravens', 'Bears', 'Dolphins', 'Bengals', 'Steelers', 'Raiders', 'Chargers', 'Broncos', 'Jets', 'Patriots'],
  NBA: ['Lakers', 'Celtics', 'Warriors', 'Nets', 'Bucks', 'Heat', 'Suns', 'Knicks', 'Bulls', 'Mavericks', 'Clippers', 'Grizzlies', 'Pelicans', 'Timberwolves', 'Thunder', 'Kings'],
  MLB: ['Yankees', 'Red Sox', 'Dodgers', 'Cubs', 'Astros', 'Braves', 'Mets', 'Giants', 'Cardinals', 'Phillies', 'Blue Jays', 'White Sox', 'Guardians', 'Twins', 'Mariners', 'Rangers'],
  NHL: ['Rangers', 'Bruins', 'Maple Leafs', 'Blackhawks', 'Avalanche', 'Penguins', 'Oilers', 'Canadiens', 'Lightning', 'Panthers', 'Capitals', 'Hurricanes', 'Golden Knights', 'Stars', 'Wild', 'Blues']
};

function getRandomTime() {
  const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
  const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getRandomOdds(sport: string) {
  if (sport === 'MLB') {
    const odds = ['-150', '+150', '-160', '+160', '-170', '+170', '-180', '+180', '-190', '+190', '-200', '+200', '-210', '+210', '-220', '+220'];
    return odds[Math.floor(Math.random() * odds.length)];
  } else {
    const odds = ['-110', '+110', '-120', '+120', '-130', '+130', '-140', '+140', '-150', '+150', '-160', '+160', '-170', '+170', '-180', '+180'];
    return odds[Math.floor(Math.random() * odds.length)];
  }
}

function getRandomSpread(sport: string) {
  if (sport === 'NBA') {
    const spreads = ['-2.5', '+2.5', '-3.5', '+3.5', '-4.5', '+4.5', '-5.5', '+5.5', '-6.5', '+6.5', '-7.5', '+7.5', '-8.5', '+8.5', '-9.5', '+9.5'];
    return spreads[Math.floor(Math.random() * spreads.length)];
  } else if (sport === 'NFL') {
    const spreads = ['-3.5', '+3.5', '-4.5', '+4.5', '-5.5', '+5.5', '-6.5', '+6.5', '-7.5', '+7.5', '-8.5', '+8.5', '-9.5', '+9.5', '-10.5', '+10.5'];
    return spreads[Math.floor(Math.random() * spreads.length)];
  } else {
    // MLB uses run lines instead of spreads
    const runLines = ['-1.5', '+1.5', '-2.5', '+2.5', '-3.5', '+3.5', '-4.5', '+4.5'];
    return runLines[Math.floor(Math.random() * runLines.length)];
  }
}

function getRandomOverUnder(sport: string) {
  if (sport === 'NBA') {
    const overUnders = ['220.5', '225.5', '230.5', '235.5', '240.5', '245.5', '250.5', '255.5', '260.5', '265.5', '270.5', '275.5', '280.5', '285.5', '290.5', '295.5'];
    return overUnders[Math.floor(Math.random() * overUnders.length)];
  } else if (sport === 'MLB') {
    const overUnders = ['7.5', '8.5', '9.5', '10.5', '11.5', '12.5', '13.5', '14.5', '15.5', '16.5'];
    return overUnders[Math.floor(Math.random() * overUnders.length)];
  } else {
    // NFL
    const overUnders = ['42.5', '43.5', '44.5', '45.5', '46.5', '47.5', '48.5', '49.5', '50.5', '51.5', '52.5', '53.5', '54.5', '55.5', '56.5', '57.5'];
    return overUnders[Math.floor(Math.random() * overUnders.length)];
  }
}

function generateSlateGames(sport: string): Event[] {
  const teams = TEAMS[sport];
  const games: Event[] = [];
  const usedTeams = new Set<string>();

  // Generate 8 games for each slate
  for (let i = 0; i < 8; i++) {
    let t1, t2;
    do {
      t1 = teams[Math.floor(Math.random() * teams.length)];
      t2 = teams[Math.floor(Math.random() * teams.length)];
    } while (t1 === t2 || usedTeams.has(t1) || usedTeams.has(t2));

    usedTeams.add(t1);
    usedTeams.add(t2);

    games.push({
      id: `${sport}-${i}`,
      sport,
      teams: [t1, t2],
      time: getRandomTime(),
      odds: { [t1]: getRandomOdds(sport), [t2]: getRandomOdds(sport) },
      spread: { [t1]: getRandomSpread(sport), [t2]: getRandomSpread(sport) },
      overUnder: getRandomOverUnder(sport),
      live: false
    });
  }

  return games;
}

const MOCK_SLATES: Slate[] = [
  {
    id: 'nfl-sunday',
    sport: 'NFL',
    name: 'Sunday Night Football',
    games: generateSlateGames('NFL'),
    startTime: '2024-03-24T20:00:00Z',
    endTime: '2024-03-25T04:00:00Z',
    status: 'upcoming'
  },
  {
    id: 'nba-saturday',
    sport: 'NBA',
    name: 'Saturday Showdown',
    games: generateSlateGames('NBA'),
    startTime: '2024-03-23T18:00:00Z',
    endTime: '2024-03-24T02:00:00Z',
    status: 'upcoming'
  },
  {
    id: 'mlb-friday',
    sport: 'MLB',
    name: 'Friday Night Baseball',
    games: generateSlateGames('MLB'),
    startTime: '2024-03-22T19:00:00Z',
    endTime: '2024-03-23T03:00:00Z',
    status: 'upcoming'
  }
];

export default function SlateShowdown() {
  const [selectedSport, setSelectedSport] = useState<string>('NFL')
  const [selectedSlate, setSelectedSlate] = useState<Slate | null>(null)
  const [selectedGame, setSelectedGame] = useState<Event | null>(null)
  const [selectedFriend, setSelectedFriend] = useState<string>('')
  const [wagerAmount, setWagerAmount] = useState<string>('')
  const [trashTalk, setTrashTalk] = useState<string>('')
  const [picks, setPicks] = useState<{ gameId: string; team: string; odds: string }[]>([])
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [challengeStep, setChallengeStep] = useState<'friend' | 'picks' | 'wager'>('friend')

  const filteredSlates = MOCK_SLATES.filter(slate => slate.sport === selectedSport)

  const handlePickTeam = (gameId: string, team: string, odds: string) => {
    const existingPickIndex = picks.findIndex(pick => pick.gameId === gameId);
    if (existingPickIndex >= 0) {
      const newPicks = [...picks];
      newPicks[existingPickIndex] = { gameId, team, odds };
      setPicks(newPicks);
    } else {
      setPicks([...picks, { gameId, team, odds }]);
    }
  };

  const handleOpenChallenge = (slate: Slate) => {
    setSelectedSlate(slate);
    setSelectedGame(null);
    setPicks([]);
    setSelectedFriend('');
    setWagerAmount('');
    setTrashTalk('');
    setChallengeStep('friend');
    setShowChallengeModal(true);
  };

  const handleNextStep = () => {
    if (challengeStep === 'friend' && selectedFriend) {
      setChallengeStep('picks');
    } else if (challengeStep === 'picks' && picks.length === selectedSlate?.games.length) {
      setChallengeStep('wager');
    }
  };

  const handleSubmitSlate = () => {
    if (!selectedSlate) {
      alert('No slate selected');
      return;
    }
    if (!selectedFriend) {
      alert('Please select a friend to challenge');
      return;
    }
    if (!wagerAmount || isNaN(Number(wagerAmount)) || Number(wagerAmount) <= 0) {
      alert('Please enter a valid wager amount');
      return;
    }
    if (picks.length !== selectedSlate.games.length) {
      alert('Please make a pick for every game in the slate');
      return;
    }

    // Create the challenge object
    const challenge = {
      slate: {
        id: selectedSlate.id,
        name: selectedSlate.name,
        sport: selectedSlate.sport,
        startTime: selectedSlate.startTime,
        endTime: selectedSlate.endTime,
        status: selectedSlate.status
      },
      friend: selectedFriend,
      amount: Number(wagerAmount),
      trashTalk,
      picks: picks.map(pick => ({
        gameId: pick.gameId,
        team: pick.team,
        odds: pick.odds
      })),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Here you would typically send this to your backend
    console.log('Sending challenge:', challenge);

    // Reset the form
    setShowChallengeModal(false);
    setSelectedSlate(null);
    setSelectedGame(null);
    setPicks([]);
    setSelectedFriend('');
    setWagerAmount('');
    setTrashTalk('');
    setChallengeStep('friend');

    // Show success message
    alert('Challenge sent successfully!');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Slate Showdown</h2>
          <div className="flex gap-1">
            {['NFL', 'NBA', 'MLB'].map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  selectedSport === sport
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowRulesModal(true)}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="How to Play"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {filteredSlates.map((slate) => (
          <div key={slate.id} className="bg-gray-900 rounded border border-gray-700">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-white">{slate.name}</h3>
                <span className="text-xs text-gray-400">{new Date(slate.startTime).toLocaleDateString()}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">{slate.games.length} Games</span>
              </div>
              <button
                onClick={() => handleOpenChallenge(slate)}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Challenge
              </button>
            </div>
          </div>
        ))}
      </div>

      {showChallengeModal && selectedSlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-5 w-full max-w-3xl border border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-white">Challenge Friend</h3>
              <button
                onClick={() => setShowChallengeModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {challengeStep === 'friend' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Friend</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    value={selectedFriend}
                    onChange={(e) => setSelectedFriend(e.target.value)}
                  >
                    <option value="">Choose a friend...</option>
                    <option value="friend1">Jessica Lane</option>
                    <option value="friend2">Chris Park</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    onClick={() => setShowChallengeModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    onClick={handleNextStep}
                    disabled={!selectedFriend}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {challengeStep === 'picks' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300">Make Your Picks</h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {selectedSlate.games.map((game) => (
                    <div key={game.id} className="bg-gray-800 rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">{game.time}</span>
                        <span className="text-xs text-gray-400">O/U: {game.overUnder}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {game.teams.map((team) => (
                          <button
                            key={team}
                            onClick={() => handlePickTeam(game.id, team, game.odds[team])}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              picks.find(p => p.gameId === game.id && p.team === team)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <div className="font-medium">{team}</div>
                            <div className="text-[10px]">
                              {game.odds[team]} ({game.spread[team]})
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    className="flex-1 px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    onClick={() => setChallengeStep('friend')}
                  >
                    Back
                  </button>
                  <button
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    onClick={handleNextStep}
                    disabled={picks.length !== selectedSlate.games.length}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {challengeStep === 'wager' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Wager Amount ($)</label>
                  <input
                    type="number"
                    placeholder="Enter amount..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(e.target.value)}
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trash Talk (Optional)</label>
                  <textarea
                    placeholder="Add some friendly banter..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    value={trashTalk}
                    onChange={(e) => setTrashTalk(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    onClick={() => setChallengeStep('picks')}
                  >
                    Back
                  </button>
                  <button
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    onClick={handleSubmitSlate}
                    disabled={!wagerAmount || isNaN(Number(wagerAmount)) || Number(wagerAmount) <= 0}
                  >
                    Send Challenge
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-5 w-full max-w-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-white">How to Play Slate Showdown</h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">1. Select a Slate</h4>
                <p>Choose from available slates of games for NFL, NBA, or MLB. Each slate contains multiple games happening on the same day.</p>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">2. Challenge a Friend</h4>
                <p>Select a friend to challenge to a head-to-head competition. You'll both make picks for every game in the slate.</p>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">3. Make Your Picks</h4>
                <p>For each game in the slate, pick which team you think will win. You must make a pick for every game to proceed.</p>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">4. Set the Wager</h4>
                <p>Decide how much you want to bet. The winner takes all - whoever gets the most correct picks wins the entire wager amount.</p>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">5. Add Some Trash Talk (Optional)</h4>
                <p>Make it more fun by adding some friendly banter to your challenge.</p>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">6. Wait for Results</h4>
                <p>After all games are complete, the person with the most correct picks wins the challenge and collects the wager.</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 