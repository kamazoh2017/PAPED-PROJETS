# Deployment: Supabase + Vercel

## 1. Create Supabase project
1. Create a new project in Supabase.
2. Open `Project Settings > Database`.
3. Copy:
- pooled connection string (port `6543`) for `DATABASE_URL`
- direct connection string (port `5432`) for `DIRECT_URL` (optional but useful)

## 2. Configure environment variables
Set these in Vercel (`Project Settings > Environment Variables`):

```env
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-xx-xx.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>
NODE_ENV=production
```

## 3. Import the project in Vercel
1. Push repository to GitHub.
2. Import repo in Vercel.
3. Framework preset: `Next.js`.
4. Build command: `npm run build`
5. Install command: `npm install`

## 4. Database schema deployment
This project currently uses the standard `build` script, which can initialize PostgreSQL idempotently during deployment:

```bash
npm run build
```

This is intentional to bootstrap PostgreSQL quickly from Prisma schema while remaining safe to run multiple times.

## 5. Local production-like check
Before first deployment, run locally with Supabase connection string in `.env.local`:

```bash
npm install
npm run prisma:push
npm run build
npm start
```

## 6. Important notes
- SQLite is no longer used for deployment.
- Runtime now reads `DATABASE_URL` directly.
- If you later want strict migration history for PostgreSQL, create a PostgreSQL baseline migration and switch from `db push` to `migrate deploy`.
