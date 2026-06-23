# Deployment Plan

Target: FE → Vercel, BE + PostgreSQL → Railway.

---

## Architecture Overview

```
Browser
  └── Vercel (React SPA, static CDN)
        └── API calls → Railway (Express + Node.js)
                            └── Railway Postgres (managed PostgreSQL)
```

---

## Pre-requisites

- [ ] GitHub repo is public (or connected to Vercel/Railway)
- [ ] Railway account: [railway.app](https://railway.app)
- [ ] Vercel account: [vercel.com](https://vercel.com)

---

## Step 1 — Provision Railway PostgreSQL

1. Log in to Railway → **New Project** → **Provision PostgreSQL**
2. Once provisioned, go to the **Variables** tab of the Postgres service
3. Copy the `DATABASE_URL` value — format: `postgresql://user:pass@host:port/db`

---

## Step 2 — Deploy Backend to Railway

### 2a. Create BE service

1. In the same Railway project → **New Service** → **GitHub Repo**
2. Select the repo, set the **Root Directory** to `source/be`
3. Railway auto-detects the `Dockerfile` and uses it — no build/start command overrides needed.

### 2b. Set environment variables

In the BE service → **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (paste from Step 1) |
| `JWT_SECRET` | a strong random string (e.g. `openssl rand -hex 32`) |
| `PORT` | `3001` (Railway exposes this automatically) |
| `NODE_ENV` | `production` |

### 2c. Run database migration + seed

After first deploy, open the BE service → **Shell** tab (or use Railway CLI):

```bash
npm run db:deploy
```

This runs `prisma migrate deploy && ts-node -r tsconfig-paths/register prisma/seed.ts` (already in `package.json`).

### 2d. Confirm BE is live

Railway assigns a public URL like `https://be-<hash>.railway.app`.  
Test: `GET https://be-<hash>.railway.app/api/auth/login` should return 400 (missing body).

---

## Step 3 — Deploy Frontend to Vercel

### 3a. Create Vercel project

1. Log in to Vercel → **Add New Project** → Import from GitHub
2. Set **Root Directory** to `source/fe`
3. Framework preset: **Vite**
4. Build settings (auto-detected):
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`

### 3b. Set environment variable

In Vercel project → **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://be-<hash>.railway.app/api` (your Railway BE URL, include `/api`) |

### 3c. Verify `vite.config.ts` uses the env var

Confirm `source/fe/lib/api/client.ts` reads:
```typescript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
```

This is already in place — no changes needed.

### 3d. Deploy

Click **Deploy**. Vercel builds and assigns a URL like `https://papaya-<hash>.vercel.app`.

---

## Step 4 — CORS Configuration

The BE must allow requests from the Vercel domain.

In `source/be/src/app.ts` (already updated):

```typescript
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
```

Add to Railway BE variables:

| Variable | Value |
|----------|-------|
| `CORS_ORIGIN` | `https://papaya-<hash>.vercel.app` |

Redeploy BE after adding this variable.

---

## Step 5 — Smoke Test

| Check | Expected |
|-------|----------|
| `GET /api/health` (if exists) | 200 OK |
| Login with `admin@papaya.dev` / `Admin@1234` | JWT returned |
| Tenant list loads | 3 tenants visible |
| Create new tenant | Saved, appears in list |
| Process claim on SafeGuard | Returns approval tiers + SLA |
| Config diff between SafeGuard and HealthFirst | Differences listed |

---

## Step 6 — Custom Domain (optional)

### Vercel
Settings → **Domains** → Add domain → update DNS CNAME to `cname.vercel-dns.com`.

### Railway
BE service → **Settings** → **Custom Domain** → add subdomain (e.g. `api.yourdomain.com`).

---

## Environment Variables Summary

### BE (Railway)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✓ | From Railway Postgres |
| `JWT_SECRET` | ✓ | Min 32 chars random |
| `PORT` | ✓ | `3001` |
| `NODE_ENV` | ✓ | `production` |
| `CORS_ORIGIN` | ✓ | Vercel FE URL |

### FE (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_API_URL` | ✓ | Railway BE URL with `/api` suffix |

---

## Rollback

- **FE:** Vercel keeps all deployments — go to **Deployments** tab → **Promote** any previous build to production instantly
- **BE:** Railway keeps deployment history — redeploy previous commit from the **Deployments** tab
- **DB:** Prisma migrations are forward-only; for data rollback use Railway's **Backups** (available on Pro plan) or a manual `pg_dump`

---

## Cost Estimate (hobby tier)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Railway BE | Starter | ~$5/month (500h) |
| Railway PostgreSQL | Starter | ~$5/month (1GB) |
| **Total** | | **~$10/month** |

Railway's free trial gives $5 credit — enough for a short demo window at zero cost.
