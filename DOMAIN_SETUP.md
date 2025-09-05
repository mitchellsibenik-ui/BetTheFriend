# Domain Setup for BetTheFriend.com

## Adding Your Custom Domain to Vercel

### Step 1: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository: `mitchellsibenik-ui/BetTheFriend`
3. Add the environment variables from the deployment script
4. Deploy!

### Step 2: Add Custom Domain
1. In your Vercel dashboard, go to your project
2. Navigate to **Settings** > **Domains**
3. Click **Add Domain**
4. Enter: `www.BetTheFriend.com`
5. Click **Add**

### Step 3: Update Environment Variables
After adding the domain, update your environment variables:
1. Go to **Settings** > **Environment Variables**
2. Update `NEXTAUTH_URL` to: `https://www.BetTheFriend.com`
3. Save the changes

### Step 4: DNS Configuration
If you own the domain `BetTheFriend.com`, you'll need to configure DNS:
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add a CNAME record:
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com`
3. Wait for DNS propagation (can take up to 24 hours)

### Step 5: Verify Domain
1. Check that `www.BetTheFriend.com` resolves to your Vercel app
2. Test authentication and all features
3. Run database migrations if needed

## Environment Variables for Production
```
DATABASE_URL=your_postgresql_connection_string
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=https://www.BetTheFriend.com
NEXT_PUBLIC_ODDS_API_KEY=25b8f37b30aa217d54a543044a24401f
```

## Troubleshooting
- If domain doesn't work immediately, wait for DNS propagation
- Check Vercel's domain status in the dashboard
- Ensure all environment variables are set correctly
- Test both `www.BetTheFriend.com` and the Vercel subdomain
