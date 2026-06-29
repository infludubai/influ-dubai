# InfluDubai AI — Deployment Guide

## Stack
| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | Vercel | Next.js 15 |
| Backend API | Render | NestJS |
| Database | Render Postgres | PostgreSQL 17 |
| File Storage | Supabase | Avatars, logos, media kits |

---

## 1. Supabase — File Storage

1. Go to [supabase.com](https://supabase.com) → New project → name it `infludubai`
2. Once created: **Storage** → **New bucket** — create these three:

   | Bucket name | Public |
   |------------|--------|
   | `avatars`  | ✅ Yes |
   | `logos`    | ✅ Yes |
   | `media-kits` | ✅ Yes |

3. For each bucket: **Policies** → Add policy → "Allow public read" (template: `SELECT` for `anon` role)
4. Copy from **Settings → API**:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (backend only, never frontend)
   - **anon** key → `NEXT_PUBLIC_SUPABASE_URL` (just the URL, not the key, goes to frontend)

---

## 2. Render — Backend + Database

### 2a. Create Postgres database
1. [render.com](https://render.com) → New → **PostgreSQL**
2. Name: `infludubai-db`, Region: **Frankfurt (EU Central)**
3. After creation, copy the **Internal Database URL**

### 2b. Deploy backend
1. Render → New → **Web Service** → connect `infludubai/influ-dubai`
2. Settings:
   - **Root directory**: `backend`
   - **Build command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start command**: `node dist/main.js`
   - **Region**: Frankfurt
3. Environment variables — add all from `backend/.env.example`:
   ```
   DATABASE_URL          = <Internal DB URL from step 2a>
   JWT_SECRET            = <generate: openssl rand -base64 48>
   JWT_REFRESH_SECRET    = <generate: openssl rand -base64 48>
   ALLOWED_ORIGINS       = https://influ-dubai.vercel.app
   SUPABASE_URL          = <from step 1>
   SUPABASE_SERVICE_KEY  = <service_role key from step 1>
   PORT                  = 10000
   NODE_ENV              = production
   ```
4. Deploy → wait for "Live" status
5. Copy your Render URL: `https://infludubai-api.onrender.com`

---

## 3. Vercel — Frontend

1. [vercel.com](https://vercel.com) → New Project → Import `infludubai/influ-dubai`
2. Settings:
   - **Root directory**: `frontend`
   - **Framework preset**: Next.js (auto-detected)
3. Environment variables:
   ```
   NEXT_PUBLIC_API_URL         = https://infludubai-api.onrender.com/api/v1
   NEXT_PUBLIC_WS_URL          = wss://infludubai-api.onrender.com
   NEXT_PUBLIC_SUPABASE_URL    = https://xxxxxxxxxxxx.supabase.co
   ```
4. Deploy → your frontend is live at `https://influ-dubai.vercel.app`

---

## 4. Post-deploy: Run seed (optional)

SSH into Render shell or run locally with production DATABASE_URL:
```bash
cd backend
DATABASE_URL="..." npx ts-node -P tsconfig.seed.json prisma/seed.ts
```

---

## 5. Wire up CORS

After you have your Vercel URL, update the Render env var:
```
ALLOWED_ORIGINS = https://influ-dubai.vercel.app
```
Then redeploy the backend.

---

## Upload endpoint

`POST /api/v1/upload?bucket=avatars` — multipart/form-data, field name `file`  
Requires JWT. Returns `{ url: "https://xxxx.supabase.co/storage/v1/object/public/..." }`

Buckets: `avatars` · `logos` · `media-kits`
