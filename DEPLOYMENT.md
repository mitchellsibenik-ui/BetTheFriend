# 🚀 BetTheFriend Deployment Guide

## Quick Start - Deploy to Vercel (Recommended)

### 1. **Prepare Your Repository**
```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. **Set Up Database (Neon PostgreSQL - Free)**
1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Create a new project called "BetTheFriend"
3. Copy the connection string (it looks like: `postgresql://username:password@host/database`)

### 3. **Deploy to Vercel**
1. Go to [Vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project" and import your BetTheFriend repository
3. Configure environment variables in Vercel dashboard:

#### Environment Variables to Add:
```
DATABASE_URL=postgresql://your-neon-connection-string
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_ODDS_API_KEY=25b8f37b30aa217d54a543044a24401f
```

### 4. **Generate Secrets**
For `NEXTAUTH_SECRET`, run this command and copy the output:
```bash
openssl rand -base64 32
```

### 5. **Deploy and Setup Database**
1. Click "Deploy" in Vercel
2. Once deployed, run database migrations:
   - Go to your Vercel project dashboard
   - Go to "Functions" tab
   - Create a new function to run: `npx prisma migrate deploy`

---

## Alternative: Railway Deployment

### 1. **Deploy to Railway**
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your BetTheFriend repository

### 2. **Add PostgreSQL Database**
1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set the `DATABASE_URL` environment variable

### 3. **Configure Environment Variables**
Add these in Railway dashboard:
```
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=https://your-app-name.up.railway.app
NEXT_PUBLIC_ODDS_API_KEY=25b8f37b30aa217d54a543044a24401f
```

---

## Post-Deployment Setup

### 1. **Run Database Migrations**
After deployment, you need to set up your database schema:

```bash
# If using Vercel, run this in your local terminal:
DATABASE_URL="your-production-database-url" npx prisma migrate deploy

# Or use Vercel CLI:
vercel env pull .env.production
npx prisma migrate deploy
```

### 2. **Seed Default Users (Optional)**
Create a seed script to add test users:

```bash
# Run this once after deployment
DATABASE_URL="your-production-database-url" npx prisma db seed
```

### 3. **Test Your Deployment**
1. Visit your deployed URL
2. Register a new account
3. Add some friends
4. Place a test bet
5. Check that all features work

---

## Custom Domain Setup (Optional)

### 1. **Vercel Custom Domain**
1. Go to your Vercel project dashboard
2. Click "Domains" tab
3. Add your custom domain (e.g., `betthefriend.com`)
4. Follow the DNS configuration instructions

### 2. **Update Environment Variables**
Update `NEXTAUTH_URL` to your custom domain:
```
NEXTAUTH_URL=https://betthefriend.com
```

---

## Monitoring and Maintenance

### 1. **Set Up Monitoring**
- Vercel provides built-in analytics
- Monitor API usage for The Odds API
- Set up error tracking with Sentry (optional)

### 2. **Database Backups**
- Neon provides automatic backups
- Railway provides point-in-time recovery

### 3. **API Rate Limits**
- Monitor The Odds API usage
- Consider upgrading the plan if needed
- Implement caching for better performance

---

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Ensure database is accessible from Vercel/Railway

2. **Environment Variables Not Working**
   - Check spelling and formatting
   - Redeploy after changing environment variables

3. **Authentication Issues**
   - Verify `NEXTAUTH_URL` matches your domain
   - Check `NEXTAUTH_SECRET` is set

4. **API Rate Limits**
   - Monitor The Odds API usage
   - Implement caching or upgrade plan

### Getting Help:
- Check Vercel/Railway logs for errors
- Review Next.js deployment documentation
- Check Prisma deployment guides

---

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **Database Security**: Use strong passwords and connection strings
3. **HTTPS**: Always use HTTPS in production (automatic with Vercel/Railway)
4. **API Keys**: Rotate API keys regularly
5. **User Data**: Ensure GDPR compliance if needed

---

## Scaling Considerations

1. **Database**: Monitor connection limits
2. **API Calls**: Implement caching for The Odds API
3. **Storage**: Monitor database size
4. **Performance**: Use Vercel Analytics to track performance

---

Your BetTheFriend app should now be live and accessible to your friends! 🎉 