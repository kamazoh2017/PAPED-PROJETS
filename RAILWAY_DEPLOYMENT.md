# Deployment Guide: Railway (Next.js + Prisma + PostgreSQL)

## 1. Create a Railway Account
- Go to [railway.app](https://railway.app)
- Sign up (GitHub OAuth recommended for easier integration)
- Confirm email

## 2. Create a New Railway Project
1. Click **"New Project"** from the dashboard
2. Select **"Create New"** (not a template)
3. Give it a name: `PAPE-D`

## 3. Add PostgreSQL Database
1. In your Railway project, click **"Add +"** in the top right
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will generate a PostgreSQL instance automatically
4. The database URL will be available immediately as an environment variable

## 4. Connect GitHub Repository
1. Click **"Add +"** again
2. Select **"GitHub Repo"**
3. Authorize Railway to access your GitHub account
4. Select repository: `kamazoh2017/PAPED-PROJETS`
5. Choose branch: `master` (or `main`)
6. Railway will auto-detect it's a Next.js app

## 5. Configure Environment Variables
Railway automatically injects the PostgreSQL connection string. Verify in your project settings:

- **Go to**: Variables tab in the PostgreSQL service
- **Copy the generated URL**: Click the key icon next to the connection string
- **In the Next.js service**, Railway auto-links it as `DATABASE_URL`

Additionally, add if needed:
```
NODE_ENV=production
```

## 6. Configure Build Command
Railway auto-detects Next.js. In your service settings, set:

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

Railway will use your `package.json` scripts by default, so `npm start` runs Next.js in production mode.
The `build` script is Railway-aware and prepares Prisma + Next.js for PostgreSQL without modifying the database.
The `start` script is Railway-aware: if `DATABASE_URL` is PostgreSQL, it performs an idempotent `prisma db push`
and `prisma db seed` before starting the app. If `DATABASE_URL` is SQLite (local dev), it skips those deployment steps.

## 7. Deploy
1. Push your code to GitHub (any branch you configured):
   ```bash
   git push origin master
   ```

2. Railway automatically detects the push and starts building
3. Monitor the build in Railway dashboard → **Deployments** tab
4. Once green ✅, Railway provides a public URL (e.g., `https://pape-d-production.up.railway.app`)

## 8. Test Your Deployment
1. Visit the generated Railway URL
2. **Login page** should load at `/accueil`
3. Try login with:
   - Email: `super@super`
   - Password: `0123456789`
4. Check `/profil` or `/tableau-de-bord` to verify session works

## 9. Additional Notes

### Database Migrations
- Prisma db push runs during Railway start when `DATABASE_URL` points to PostgreSQL
- Prisma seed runs during Railway start and is idempotent for `super@super`
- Schema changes auto-sync on each deployment

### Custom Domain (Optional)
- Railway → Project Settings → "Domains"
- Add custom domain (requires DNS update)

### Logs
- Railway Dashboard → Deployments → View logs in real-time

### Common Issues
| Issue | Fix |
|-------|-----|
| Build fails - "DATABASE_URL not set" | Ensure PostgreSQL service is linked, redeploy |
| Build fails - `P1001` on Railway internal host | Do not run `db push` during build; keep it in `npm start` |
| Login not working | Check SESSION_COOKIE in code, verify `super@super` account exists |
| 500 error on pages | Check logs in Railway dashboard |
| Prisma generate fails | Ensure @prisma/client is in package.json dependencies |

### Environment Variables Reference
```env
# Auto-set by Railway (PostgreSQL plugin)
DATABASE_URL=postgresql://user:password@host:port/database

# Generated at runtime
SESSION_COOKIE=pape_session
NODE_ENV=production
```

### Scaling & Monitoring
- Railway shows CPU/Memory usage in real-time
- Upgrade storage/compute via plan selection
- Free tier: $5/month available credits, then $1/month base

---

**Next Steps After Deploy:**
1. ✅ App live at Railway URL
2. Test all auth flows (login, session persistence, redirect logic)
3. Optional: Add custom domain
4. Optional: Set up automatic deployments for `preprod` branch to staging instance

