import { Event } from '../types';

interface GameEvent {
  id: string;
  sport: string;
  teams: {
    home: {
      name: string;
      odds: number;
    };
    away: {
      name: string;
      odds: number;
    };
  };
  startTime: Date;
  spread?: {
    [key: string]: number;
  };
  overUnder?: number;
}

const NFL_TEAMS = [
  'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
  'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
  'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
  'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
  'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
  'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
  'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
  'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
];

const NBA_TEAMS = [
  'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets',
  'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets',
  'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers',
  'Los Angeles Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat',
  'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks',
  'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns',
  'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors',
  'Utah Jazz', 'Washington Wizards'
];

const MLB_TEAMS = [
  'Arizona Diamondbacks', 'Atlanta Braves', 'Baltimore Orioles', 'Boston Red Sox',
  'Chicago Cubs', 'Chicago White Sox', 'Cincinnati Reds', 'Cleveland Guardians',
  'Colorado Rockies', 'Detroit Tigers', 'Houston Astros', 'Kansas City Royals',
  'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins', 'Milwaukee Brewers',
  'Minnesota Twins', 'New York Mets', 'New York Yankees', 'Oakland Athletics',
  'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres', 'San Francisco Giants',
  'Seattle Mariners', 'St. Louis Cardinals', 'Tampa Bay Rays', 'Texas Rangers',
  'Toronto Blue Jays', 'Washington Nationals'
];

const NHL_TEAMS = [
  'Anaheim Ducks', 'Arizona Coyotes', 'Boston Bruins', 'Buffalo Sabres',
  'Calgary Flames', 'Carolina Hurricanes', 'Chicago Blackhawks', 'Colorado Avalanche',
  'Columbus Blue Jackets', 'Dallas Stars', 'Detroit Red Wings', 'Edmonton Oilers',
  'Florida Panthers', 'Los Angeles Kings', 'Minnesota Wild', 'Montreal Canadiens',
  'Nashville Predators', 'New Jersey Devils', 'New York Islanders', 'New York Rangers',
  'Ottawa Senators', 'Philadelphia Flyers', 'Pittsburgh Penguins', 'San Jose Sharks',
  'Seattle Kraken', 'St. Louis Blues', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
  'Vancouver Canucks', 'Vegas Golden Knights', 'Washington Capitals', 'Winnipeg Jets'
];

const getTeamsForSport = (sport: string): string[] => {
  switch (sport.toLowerCase()) {
    case 'nfl':
      return NFL_TEAMS;
    case 'nba':
      return NBA_TEAMS;
    case 'mlb':
      return MLB_TEAMS;
    case 'nhl':
      return NHL_TEAMS;
    default:
      return [];
  }
};

export const generateGamesForSport = (sport: string, count: number): GameEvent[] => {
  const games: GameEvent[] = [];
  const teams = getTeamsForSport(sport);
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const homeTeam = teams[Math.floor(Math.random() * teams.length)];
    let awayTeam;
    do {
      awayTeam = teams[Math.floor(Math.random() * teams.length)];
    } while (awayTeam === homeTeam);

    const gameDate = new Date(startDate);
    gameDate.setDate(startDate.getDate() + Math.floor(i / 2));
    gameDate.setHours(12 + Math.floor(Math.random() * 12));

    const homeOdds = Math.floor(Math.random() * 200) - 100;
    const awayOdds = Math.floor(Math.random() * 200) - 100;
    const spread = Math.floor(Math.random() * 20) - 10;
    const overUnder = Math.floor(Math.random() * 50) + 150;

    games.push({
      id: `mock-${sport}-${i}`,
      sport: sport,
      teams: {
        home: {
          name: homeTeam,
          odds: homeOdds,
        },
        away: {
          name: awayTeam,
          odds: awayOdds,
        },
      },
      startTime: gameDate,
      spread: {
        [homeTeam]: spread,
        [awayTeam]: -spread,
      },
      overUnder,
    });
  }

  return games;
}; 