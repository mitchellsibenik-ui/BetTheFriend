# Bet Settlement Verification

## ✅ Confirmation: Your Active Bets Will Be Settled Correctly

### 1. **Bet Status Update** ✅
When a game ends, all active bets are automatically moved from `ACTIVE` to `RESOLVED`:
- Status changes: `ACTIVE` → `RESOLVED`
- `resolved` flag set to `true`
- `resolvedAt` timestamp recorded
- `winnerId` and `loserId` are set
- `result` description is stored

**Location**: `src/lib/betSettlement.ts` lines 656-666

### 2. **P/L (Profit/Loss) Update** ✅

#### For Winners:
- **Balance Update**: Winner receives `bet.amount + winnings` (stake + profit based on odds)
- **Calculation**: Uses standard sportsbook payout formula
  - Positive odds (+150): `(stake * odds) / 100` in winnings
  - Negative odds (-110): `(stake * 100) / |odds|` in winnings
- **Example**: If you bet $100 at +150 odds and win, you get $100 (stake) + $150 (winnings) = $250 total

**Location**: `src/lib/betSettlement.ts` lines 670-676

#### For Losers:
- **Balance**: Already deducted when bet was accepted (no additional change)
- **No refund**: The stake is already locked in the bet

#### For Pushes (Ties):
- **Balance**: Both players get their stake back ($bet.amount returned to each)

**Location**: `src/lib/betSettlement.ts` lines 620-630

### 3. **Win/Loss Record Update** ✅

#### For Winners:
- `wins` incremented by 1
- Balance increased by payout amount

#### For Losers:
- `losses` incremented by 1
- Balance unchanged (already deducted on acceptance)

#### For Pushes:
- No win/loss recorded (neither incremented)
- Both players get stake back

**Location**: `src/lib/betSettlement.ts` lines 673-683

### 4. **Automatic Settlement Process** ✅

**Cron Schedule**: Runs every 30 minutes (`*/30 * * * *`)
**Location**: `vercel.json` line 15

**Process Flow**:
1. Finds all bets with status `ACTIVE` or `ACCEPTED` and `resolved: false`
2. Groups bets by game
3. For each game:
   - Fetches real-time results from The Odds API
   - Falls back to database if API unavailable
   - Only processes games marked as "completed"
4. Grades each bet based on:
   - **Moneyline**: Team that won
   - **Spread**: Adjusted scores with spread applied
   - **Over/Under**: Total points vs. the line
5. Updates all data atomically in database transactions
6. Sends notifications to both users

**Location**: `src/lib/betSettlement.ts` lines 375-763

### 5. **Bet Grading Logic** ✅

The system uses standard sportsbook rules:

- **Moneyline**: Winner determined by final score (including overtime)
- **Spread**: Spread applied to the team you bet on, higher adjusted score wins
- **Over/Under**: Total points compared to the line
- **Payouts**: Calculated using American odds format matching industry standards

**Location**: `src/lib/betSettlement.ts` lines 148-347

### 6. **Transaction Safety** ✅

All updates happen in database transactions to ensure:
- Atomicity: All updates succeed or all fail
- Consistency: Balance and records always match
- No race conditions: Multiple bets can be settled simultaneously safely

**Location**: `src/lib/betSettlement.ts` lines 655-685

## Summary

✅ **Active bets** → Automatically move to **RESOLVED** after games end  
✅ **P/L (Balance)** → Updated correctly based on win/loss and odds  
✅ **Win/Loss Records** → Updated automatically (wins/losses incremented)  
✅ **Runs Automatically** → Every 30 minutes via cron job  
✅ **Real-Time Results** → Uses The Odds API for accurate game results  
✅ **Safe Transactions** → All updates are atomic and consistent  

Your bets will be settled automatically, and all balances and records will be updated correctly!

