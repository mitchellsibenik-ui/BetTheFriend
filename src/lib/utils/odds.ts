export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : odds.toString()
}

export function calculatePayout(odds: number, amount: number): number {
  if (odds > 0) {
    return (amount * (odds / 100)) + amount
  } else {
    return (amount / (Math.abs(odds) / 100)) + amount
  }
} 