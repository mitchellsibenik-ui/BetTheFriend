# 🛠️ Local Development Guide

## Quick Start - Run Locally Without Deploying

You can develop and test changes locally without deploying to Vercel every time!

### 1. **Set Up Environment Variables**

Create a `.env.local` file in the root directory:

```bash
# Database (use your production database or create a local one)
DATABASE_URL="your_postgresql_connection_string"

# Authentication
NEXTAUTH_SECRET="d3jZKGKbrKkugEQhU+gQeOQ0BVy3B/o3JMawwp43nKY="
NEXTAUTH_URL="http://localhost:3000"

# The Odds API
NEXT_PUBLIC_ODDS_API_KEY="25b8f37b30aa217d54a543044a24401f"
```

**Note:** You can use your production database URL for local development, or set up a separate local database.

### 2. **Install Dependencies** (if not already done)

```bash
npm install
```

### 3. **Set Up Database** (if using a new database)

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed the database
npm run seed
```

### 4. **Start Development Server**

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

### 5. **Make Changes**

- Edit any file in `src/`
- Changes will **automatically reload** in your browser (Hot Module Replacement)
- No need to restart the server or deploy!

## Development Workflow

1. **Make changes** → Files auto-save
2. **See changes instantly** → Browser auto-refreshes
3. **Test locally** → Everything works on `localhost:3000`
4. **Commit when ready** → `git add . && git commit -m "message"`
5. **Deploy when satisfied** → `git push origin main` (auto-deploys to Vercel)

## Benefits of Local Development

✅ **Instant feedback** - See changes immediately  
✅ **No deployment wait** - Test before pushing  
✅ **Faster iteration** - No build/deploy cycle  
✅ **Debug easily** - Full access to console logs  
✅ **Test safely** - Break things without affecting production  

## Common Commands

```bash
# Start dev server
npm run dev

# Build for production (test locally)
npm run build
npm start

# Database commands
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create new migration
npx prisma generate        # Regenerate Prisma client

# Linting
npm run lint
```

## Troubleshooting

### Port 3000 already in use?
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Database connection issues?
- Check your `DATABASE_URL` in `.env.local`
- Ensure the database is accessible from your local machine
- For production databases, check firewall/network settings

### Changes not showing?
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Check browser console for errors
- Restart dev server: `Ctrl+C` then `npm run dev`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Secret for JWT tokens | Random 32+ character string |
| `NEXTAUTH_URL` | Base URL for auth callbacks | `http://localhost:3000` |
| `NEXT_PUBLIC_ODDS_API_KEY` | The Odds API key | `25b8f37b30aa217d54a543044a24401f` |

---

**Pro Tip:** Keep your `.env.local` file in `.gitignore` (it should already be) so you don't accidentally commit secrets!

