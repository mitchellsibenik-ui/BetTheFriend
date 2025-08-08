export type Friend = {
  id: string
  name: string
  status: 'online' | 'offline'
  lastActive?: string
  avatar?: string
}

export const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL'];

export const MOCK_SPORTS = SPORTS.map(s => ({ key: s.toLowerCase(), name: s }));

export const MOCK_FRIENDS: Friend[] = [
  {
    id: '1',
    name: 'Jessica Lane',
    status: 'online',
    lastActive: '2m ago'
  },
  {
    id: '2',
    name: 'Chris Park',
    status: 'offline',
    lastActive: '1h ago'
  },
  {
    id: '3',
    name: 'Alex Rivera',
    status: 'online',
    lastActive: '5m ago'
  },
  {
    id: '4',
    name: 'Sarah Chen',
    status: 'offline',
    lastActive: '3h ago'
  }
] 