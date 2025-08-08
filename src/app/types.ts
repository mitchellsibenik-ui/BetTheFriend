export interface Event {
  id: string
  time: string
  teams: [string, string]
  odds: Record<string, string>
  spread: Record<string, string>
  overUnder: string
} 