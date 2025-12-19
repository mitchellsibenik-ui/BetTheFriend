/**
 * Team name mapping to sportsbook-style formatting
 * Maps various team name formats to their proper display names
 */

const teamNameMap: Record<string, string> = {
  // College Football - Common teams that need special formatting
  'Miami': 'Miami (FL)',
  'Miami FL': 'Miami (FL)',
  'Miami (FL)': 'Miami (FL)',
  'Miami Hurricanes': 'Miami (FL)',
  
  'Texas A&M': 'Texas A&M',
  'Texas A & M': 'Texas A&M',
  'Texas A and M': 'Texas A&M',
  'Texas A&M Aggies': 'Texas A&M',
  
  'Tulane': 'Tulane',
  'Tulane Green Wave': 'Tulane',
  
  'Ole Miss': 'Ole Miss',
  'Mississippi': 'Ole Miss',
  'Mississippi Rebels': 'Ole Miss',
  
  'Florida State': 'Florida State',
  'FSU': 'Florida State',
  'Florida State Seminoles': 'Florida State',
  
  'Florida': 'Florida',
  'Florida Gators': 'Florida',
  
  'Alabama': 'Alabama',
  'Alabama Crimson Tide': 'Alabama',
  
  'Georgia': 'Georgia',
  'Georgia Bulldogs': 'Georgia',
  
  'Ohio State': 'Ohio State',
  'Ohio St': 'Ohio State',
  'Ohio State Buckeyes': 'Ohio State',
  
  'Michigan': 'Michigan',
  'Michigan Wolverines': 'Michigan',
  
  'Penn State': 'Penn State',
  'Penn St': 'Penn State',
  'Penn State Nittany Lions': 'Penn State',
  
  'Notre Dame': 'Notre Dame',
  'Notre Dame Fighting Irish': 'Notre Dame',
  
  'USC': 'USC',
  'Southern California': 'USC',
  'USC Trojans': 'USC',
  
  'UCLA': 'UCLA',
  'UCLA Bruins': 'UCLA',
  
  'Oregon': 'Oregon',
  'Oregon Ducks': 'Oregon',
  
  'Washington': 'Washington',
  'Washington Huskies': 'Washington',
  
  'Texas': 'Texas',
  'Texas Longhorns': 'Texas',
  
  'Oklahoma': 'Oklahoma',
  'Oklahoma Sooners': 'Oklahoma',
  
  'LSU': 'LSU',
  'Louisiana State': 'LSU',
  'LSU Tigers': 'LSU',
  
  'Auburn': 'Auburn',
  'Auburn Tigers': 'Auburn',
  
  'Tennessee': 'Tennessee',
  'Tennessee Volunteers': 'Tennessee',
  
  'Clemson': 'Clemson',
  'Clemson Tigers': 'Clemson',
  
  'Michigan State': 'Michigan State',
  'Michigan St': 'Michigan State',
  'Michigan State Spartans': 'Michigan State',
  
  'Wisconsin': 'Wisconsin',
  'Wisconsin Badgers': 'Wisconsin',
  
  'Iowa': 'Iowa',
  'Iowa Hawkeyes': 'Iowa',
  
  'Nebraska': 'Nebraska',
  'Nebraska Cornhuskers': 'Nebraska',
  
  'Oregon State': 'Oregon State',
  'Oregon St': 'Oregon State',
  'Oregon State Beavers': 'Oregon State',
  
  'Washington State': 'Washington State',
  'Washington St': 'Washington State',
  'Washington State Cougars': 'Washington State',
  
  'Arizona State': 'Arizona State',
  'Arizona St': 'Arizona State',
  'Arizona State Sun Devils': 'Arizona State',
  
  'Arizona': 'Arizona',
  'Arizona Wildcats': 'Arizona',
  
  'Utah': 'Utah',
  'Utah Utes': 'Utah',
  
  'Colorado': 'Colorado',
  'Colorado Buffaloes': 'Colorado',
  
  'Stanford': 'Stanford',
  'Stanford Cardinal': 'Stanford',
  
  'California': 'California',
  'Cal': 'California',
  'California Golden Bears': 'California',
  
  'North Carolina': 'North Carolina',
  'UNC': 'North Carolina',
  'North Carolina Tar Heels': 'North Carolina',
  
  'Duke': 'Duke',
  'Duke Blue Devils': 'Duke',
  
  'Virginia Tech': 'Virginia Tech',
  'Virginia Tech Hokies': 'Virginia Tech',
  
  'Miami (OH)': 'Miami (OH)',
  'Miami OH': 'Miami (OH)',
  'Miami RedHawks': 'Miami (OH)',
  
  'TCU': 'TCU',
  'Texas Christian': 'TCU',
  'TCU Horned Frogs': 'TCU',
  
  'Baylor': 'Baylor',
  'Baylor Bears': 'Baylor',
  
  'Oklahoma State': 'Oklahoma State',
  'Oklahoma St': 'Oklahoma State',
  'Oklahoma State Cowboys': 'Oklahoma State',
  
  'Kansas State': 'Kansas State',
  'Kansas St': 'Kansas State',
  'Kansas State Wildcats': 'Kansas State',
  
  'Iowa State': 'Iowa State',
  'Iowa St': 'Iowa State',
  'Iowa State Cyclones': 'Iowa State',
  
  'West Virginia': 'West Virginia',
  'West Virginia Mountaineers': 'West Virginia',
  
  'Pittsburgh': 'Pittsburgh',
  'Pitt': 'Pittsburgh',
  'Pittsburgh Panthers': 'Pittsburgh',
  
  'Louisville': 'Louisville',
  'Louisville Cardinals': 'Louisville',
  
  'Kentucky': 'Kentucky',
  'Kentucky Wildcats': 'Kentucky',
  
  'South Carolina': 'South Carolina',
  'South Carolina Gamecocks': 'South Carolina',
  
  'Arkansas': 'Arkansas',
  'Arkansas Razorbacks': 'Arkansas',
  
  'Missouri': 'Missouri',
  'Missouri Tigers': 'Missouri',
  
  'Mississippi State': 'Mississippi State',
  'Mississippi St': 'Mississippi State',
  'Mississippi State Bulldogs': 'Mississippi State',
  
  'Vanderbilt': 'Vanderbilt',
  'Vanderbilt Commodores': 'Vanderbilt',
  
  'Indiana': 'Indiana',
  'Indiana Hoosiers': 'Indiana',
  
  'Purdue': 'Purdue',
  'Purdue Boilermakers': 'Purdue',
  
  'Illinois': 'Illinois',
  'Illinois Fighting Illini': 'Illinois',
  
  'Northwestern': 'Northwestern',
  'Northwestern Wildcats': 'Northwestern',
  
  'Minnesota': 'Minnesota',
  'Minnesota Golden Gophers': 'Minnesota',
  
  'Maryland': 'Maryland',
  'Maryland Terrapins': 'Maryland',
  
  'Rutgers': 'Rutgers',
  'Rutgers Scarlet Knights': 'Rutgers',
  
  'Boston College': 'Boston College',
  'Boston College Eagles': 'Boston College',
  
  'Syracuse': 'Syracuse',
  'Syracuse Orange': 'Syracuse',
  
  'Wake Forest': 'Wake Forest',
  'Wake Forest Demon Deacons': 'Wake Forest',
  
  'NC State': 'NC State',
  'North Carolina State': 'NC State',
  'NC State Wolfpack': 'NC State',
  
  'Georgia Tech': 'Georgia Tech',
  'Georgia Tech Yellow Jackets': 'Georgia Tech',
  
  'Virginia': 'Virginia',
  'Virginia Cavaliers': 'Virginia',
  
  'Boise State': 'Boise State',
  'Boise St': 'Boise State',
  'Boise State Broncos': 'Boise State',
  
  'Fresno State': 'Fresno State',
  'Fresno St': 'Fresno State',
  'Fresno State Bulldogs': 'Fresno State',
  
  'San Diego State': 'San Diego State',
  'San Diego St': 'San Diego State',
  'San Diego State Aztecs': 'San Diego State',
  
  'Utah State': 'Utah State',
  'Utah St': 'Utah State',
  'Utah State Aggies': 'Utah State',
  
  'BYU': 'BYU',
  'Brigham Young': 'BYU',
  'BYU Cougars': 'BYU',
  
  'Cincinnati': 'Cincinnati',
  'Cincinnati Bearcats': 'Cincinnati',
  
  'UCF': 'UCF',
  'Central Florida': 'UCF',
  'UCF Knights': 'UCF',
  
  'Houston': 'Houston',
  'Houston Cougars': 'Houston',
  
  'SMU': 'SMU',
  'Southern Methodist': 'SMU',
  'SMU Mustangs': 'SMU',
  
  'Memphis': 'Memphis',
  'Memphis Tigers': 'Memphis',
  
  'Navy': 'Navy',
  'Navy Midshipmen': 'Navy',
  
  'Army': 'Army',
  'Army Black Knights': 'Army',
  
  'Air Force': 'Air Force',
  'Air Force Falcons': 'Air Force',
  
  // NFL Teams - Keep full names
  'Los Angeles Chargers': 'Los Angeles Chargers',
  'Los Angeles Rams': 'Los Angeles Rams',
  'New York Jets': 'New York Jets',
  'New York Giants': 'New York Giants',
  'Tampa Bay Buccaneers': 'Tampa Bay Buccaneers',
  'Green Bay Packers': 'Green Bay Packers',
  'Kansas City Chiefs': 'Kansas City Chiefs',
  'San Francisco 49ers': 'San Francisco 49ers',
  'New Orleans Saints': 'New Orleans Saints',
  'Las Vegas Raiders': 'Las Vegas Raiders',
  
  // NBA Teams
  'Los Angeles Lakers': 'Los Angeles Lakers',
  'Los Angeles Clippers': 'Los Angeles Clippers',
  'Golden State Warriors': 'Golden State Warriors',
  'New York Knicks': 'New York Knicks',
  'Oklahoma City Thunder': 'Oklahoma City Thunder',
  'San Antonio Spurs': 'San Antonio Spurs',
  
  // MLB Teams
  'Los Angeles Dodgers': 'Los Angeles Dodgers',
  'Los Angeles Angels': 'Los Angeles Angels',
  'New York Yankees': 'New York Yankees',
  'New York Mets': 'New York Mets',
  'San Francisco Giants': 'San Francisco Giants',
  'San Diego Padres': 'San Diego Padres',
  
  // NHL Teams
  'Los Angeles Kings': 'Los Angeles Kings',
  'New York Rangers': 'New York Rangers',
  'New York Islanders': 'New York Islanders',
  'San Jose Sharks': 'San Jose Sharks',
}

/**
 * Formats a team name to match sportsbook-style display
 * @param teamName - The team name from the API or database
 * @returns Formatted team name matching sportsbook conventions
 */
export function formatTeamName(teamName: string): string {
  if (!teamName) return teamName
  
  // Trim whitespace
  const trimmed = teamName.trim()
  
  // Check exact match first
  if (teamNameMap[trimmed]) {
    return teamNameMap[trimmed]
  }
  
  // Check case-insensitive match
  const lowerTrimmed = trimmed.toLowerCase()
  for (const [key, value] of Object.entries(teamNameMap)) {
    if (key.toLowerCase() === lowerTrimmed) {
      return value
    }
  }
  
  // Check if team name contains any mapped key (for partial matches)
  for (const [key, value] of Object.entries(teamNameMap)) {
    if (trimmed.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(trimmed.toLowerCase())) {
      return value
    }
  }
  
  // For college teams, check common patterns
  // If it's a single word that might be a college team, return as-is
  // Otherwise, return the original name
  return trimmed
}

/**
 * Gets all team name mappings (useful for debugging or admin tools)
 */
export function getAllTeamMappings(): Record<string, string> {
  return { ...teamNameMap }
}

