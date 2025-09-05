#!/bin/bash

echo "🚀 BetTheFriend Deployment Script"
echo "================================="

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  You have uncommitted changes. Please commit them first."
    echo ""
    echo "Run:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for deployment'"
    echo "  git push origin main"
    echo ""
    exit 1
fi

echo "✅ Git repository is clean"

# Generate a secure NextAuth secret
echo ""
echo "🔑 Generating secure NextAuth secret..."
SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET: $SECRET"
echo ""

echo "📋 Environment Variables Needed:"
echo "================================"
echo "DATABASE_URL=postgresql://username:password@hostname:port/database"
echo "NEXTAUTH_SECRET=$SECRET"
echo "NEXTAUTH_URL=https://www.BetTheFriend.com"
echo "NEXT_PUBLIC_ODDS_API_KEY=25b8f37b30aa217d54a543044a24401f"
echo ""

echo "📝 Next Steps:"
echo "=============="
echo "1. Set up a PostgreSQL database (recommended: Neon.tech - free tier)"
echo "2. Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Add the environment variables above"
echo "   - Deploy!"
echo ""
echo "3. Add your custom domain:"
echo "   - In Vercel dashboard, go to your project"
echo "   - Go to Settings > Domains"
echo "   - Add 'www.BetTheFriend.com'"
echo "   - Update NEXTAUTH_URL to 'https://www.BetTheFriend.com'"
echo ""
echo "4. After deployment, run database migrations:"
echo "   vercel env pull .env.production"
echo "   npx prisma migrate deploy"
echo "   npm run seed"
echo ""
echo "🎉 Your app will be live at www.BetTheFriend.com and ready for your friends!" 