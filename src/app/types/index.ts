export type Event = {
  id: string;
  sport: string;
  teams: string[];
  time: string;
  odds: Record<string, string>;
  spread: Record<string, string>;
  overUnder: string;
  live: boolean;
}

export type Wager = {
  id: string;
  event: Event;
  team: string;
  amount: number;
  message?: string;
  sender: string;
  receiver: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  timestamp: Date;
} 