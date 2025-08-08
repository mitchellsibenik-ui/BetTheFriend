# BetTheFriend 🎯

<!-- Trigger deployment with import fixes -->

A peer-to-peer sports betting platform where friends can bet against each other on real games with automated settlement based on actual game results.

## ✨ Features

- 🏈 **Real Sports Betting**: Live odds from major sportsbooks
- 👥 **Social Betting**: Bet against friends, not the house
- 💰 **Automated Settlement**: Games are settled automatically with real results
- 📊 **Leaderboards**: Track your wins/losses against friends
- 🔔 **Real-time Notifications**: Get notified when friends send you bets
- 📱 **Responsive Design**: Works on desktop and mobile
- 🎮 **Multiple Bet Types**: Moneyline, Spread, Over/Under

## 🚀 Quick Deployment

### 1. **One-Click Deploy to Vercel** (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/BetTheFriend)

### 2. **Manual Deployment**

1. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

2. **Set up database** (Neon.tech - Free):
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

3. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables (see script output)
   - Deploy!

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (or use SQLite for dev)
- The Odds API key

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/BetTheFriend
cd BetTheFriend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🔧 Environment Variables

Create a `.env.local` file with:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/betthefriend"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# The Odds API
NEXT_PUBLIC_ODDS_API_KEY="your-odds-api-key"
```

## 📊 Database Schema

The app uses PostgreSQL with Prisma ORM. Key models:

- **Users**: User accounts with balances and stats
- **Bets**: Peer-to-peer bets with real odds
- **Games**: Sports games with results
- **Friendships**: Social connections between users
- **Notifications**: Real-time bet notifications

## 🎮 How It Works

1. **Sign Up**: Create an account and get $10,000 play money
2. **Add Friends**: Send friend requests to other users
3. **Browse Games**: View live odds for upcoming games
4. **Place Bets**: Challenge friends to bet on games
5. **Auto Settlement**: Bets are settled automatically when games end
6. **Track Performance**: View your record against each friend

## 🏗️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Sports Data**: The Odds API
- **Deployment**: Vercel
- **Cron Jobs**: Vercel Cron for automated settlement

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── my-bets/           # Bet management
│   ├── social/            # Friends and leaderboards
│   └── sportsbook/        # Main betting interface
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   └── betSettlement.ts  # Automated bet settlement
└── prisma/               # Database schema and migrations
```

## 🔄 Automated Bet Settlement

Bets are automatically settled every 5 minutes using:

1. **Real Game Results**: Fetched from The Odds API
2. **Smart Grading**: Handles moneyline, spread, and over/under bets
3. **Push Handling**: Refunds bets that tie
4. **Balance Updates**: Winners receive payouts automatically
5. **Notifications**: Users are notified of bet results

## 🎯 Bet Types Supported

- **Moneyline**: Pick the winner
- **Spread/Run Line**: Team must win by X points/runs
- **Over/Under**: Total points/runs over or under X

All bets use real odds from major sportsbooks, not fixed odds.

## 🔐 Security Features

- Secure authentication with NextAuth.js
- Password hashing with bcrypt
- HTTPS in production
- Environment variable protection
- SQL injection prevention with Prisma

## 📈 Scaling Considerations

- **Database**: PostgreSQL with connection pooling
- **API Rate Limits**: Caching for The Odds API
- **Performance**: Optimized queries and lazy loading
- **Monitoring**: Built-in Vercel analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The Odds API for sports data
- Vercel for hosting and deployment
- Next.js team for the amazing framework

---

**Ready to bet with friends?** 🎉 Deploy your own instance and start the fun! 