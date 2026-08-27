# InfluDubai AI — Deployment Guide

## Architecture

The whole platform runs as **one Node process on GoDaddy**, backed by
GoDaddy's own MySQL:

```
GoDaddy Node.js hosting (one process, one port)
  ├── server.js — supervisor + reverse proxy
  │     /api/v1/*, /socket.io/*  ->  NestJS API
  │     everything else          ->  Next.js
  └── GoDaddy MySQL (private network, :3306)
```

| Piece | Where | Why |
|---|---|---|
| Frontend + API | One GoDaddy Node app | Same origin, so there is no CORS to misconfigure, and Socket.io messaging keeps a persistent server |
| Database | GoDaddy MySQL | The sandbox blocks outbound database ports entirely — a probe from inside it returns `EACCES` on 5432/6543 while :443 is reachable. No external database can be reached from there, so the host's own MySQL is the only option |
| File storage | The app's own disk | GoDaddy keeps uploaded files across deploys, so avatars, logos and media kits need no external object store. Served from `/uploads` on the same origin |

### How a deploy happens

GoDaddy's build sandbox writes incomplete `node_modules` — five separate
builds each failed on a different missing file. So nothing is built on
GoDaddy. Instead:

1. Push to `master`.
2. `.github/workflows/deploy-bundle.yml` builds both apps on GitHub Actions,
   prunes to runtime dependencies, and force-pushes a ready-to-run `bundle/`
   to the **`deploy`** branch as a single orphan commit.
3. In the GoDaddy panel, **Retry build** (or **Update Preview**) pulls
   `deploy`. The root `package.json` there has no dependencies, so GoDaddy's
   `npm install` has nothing to do — which is the entire point.
4. `server.js` runs `prisma migrate deploy` at boot, then starts both apps.

### The database connection

There is **no connection string to paste anywhere**. `database-url.js`
composes `DATABASE_URL` at boot from the variables GoDaddy injects —
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — URL-encoding each
part, so a password containing `@ : / #` is handled correctly. If any part is
missing the startup log names the exact variable rather than failing with a
generic connection error.

Setting `DATABASE_URL` explicitly always wins, which is how local development
and any other host keep working.

---

## Create your admin account

The simplest route needs no shell at all: `BOOTSTRAP_ADMIN_EMAIL` is set in
the hosting panel, so registering with that address on the live site promotes
it to admin automatically. The guard is "no admin exists yet", so it goes
permanently inert the moment one does.

To create one by hand instead, run this against the database directly.
Nothing is committed — the credentials come from your shell:

```bash
cd backend
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DBNAME" \
ADMIN_EMAIL="you@yourdomain.com" \
ADMIN_PASSWORD="a-long-unique-passphrase" \
ADMIN_NAME="Your Name" \
npm run admin:create
```

Then sign in at `/login` and open `/admin`.

The script is safe to re-run: an existing user is promoted to ADMIN and their
password is left alone unless you pass `ADMIN_RESET_PASSWORD=true`. It refuses
passwords under 12 characters and any password that appears in this repo.

> **Do not run `npm run prisma:seed` against production.** That is the demo
> seed: it inserts fake creators, brands and campaigns into your live
> marketplace, and creates an admin whose password is published in this
> repository. It now refuses to run when `NODE_ENV=production`.

### Close the loop

Set Render's `ALLOWED_ORIGINS` and `FRONTEND_URL` to the real Vercel domain,
then redeploy the API.

---

## Configure integrations — no redeploy needed

Sign in as an admin and open **Admin → Settings → Integrations**. Keys entered
here are encrypted with AES-256-GCM, take effect immediately, and override the
environment variables.

| Section | Enables | Without it |
|---|---|---|
| OpenAI | Creator insights, campaign suggestions, AI fraud scoring | Falls back to rule-based logic |
| Stripe | Subscriptions and campaign funding | Billing runs in mock mode — no real charges |
| Email (SMTP) | Verification, reset and contact-form email | Links are written to the server log |
| Platform | Commission rate, support email, dashboard banner | Defaults to a 10% fee |

Each section has a **Test connection** button that makes a real authenticated
call to the provider.

### Stripe webhook

Point a Stripe webhook at `https://www.infludubai.ae/api/v1/billing/webhook`
and subscribe to `checkout.session.completed`, `invoice.paid` and
`customer.subscription.deleted`. Paste the signing secret into
Admin → Settings → Stripe. The API **refuses to process unverified webhooks**,
so this is required before billing works.

---

## Custom domain

1. Vercel → Project → **Domains** → add `infludubai.com`, follow the DNS records.
2. Update Render's `ALLOWED_ORIGINS` and `FRONTEND_URL` to the custom domain and redeploy.
3. Update `NEXT_PUBLIC_SITE_URL` on Vercel and redeploy so canonicals and the sitemap follow.

---

## Post-deploy smoke test

- [ ] `/api/v1/health/ready` returns `database.ok = true`
- [ ] Home, `/marketplace`, `/pricing`, `/how-it-works` load
- [ ] `/sitemap.xml` and `/robots.txt` show the production domain, not localhost
- [ ] Register a creator → verification email arrives (or the link appears in Render logs)
- [ ] Register a brand → create a campaign → invite the creator
- [ ] Creator submits a deliverable → brand approves → payout appears in Admin → Payouts
- [ ] Contact form delivers to your support inbox
- [ ] Admin → Settings shows every key as **Saved here** or **From env var**

---

## Environment variable reference

### Backend

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL connection string. On GoDaddy it is composed from `DB_*` at boot — see *The database connection* above |
| `JWT_ACCESS_SECRET` | ✅ | Signs access tokens (min 32 chars, enforced at boot) |
| `JWT_ACCESS_EXPIRES_IN` | — | Access token lifetime, default `15m` |
| `SETTINGS_ENCRYPTION_KEY` | Recommended | Encrypts admin-managed API keys |
| `ALLOWED_ORIGINS` | — | Extra origins for CORS. The site and its API are one origin, so this is only for external callers |
| `FRONTEND_URL` | ✅ | Base URL used in email links |
| `OPENAI_API_KEY` | — | AI features |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | — | Billing |
| `SMTP_*`, `MAIL_FROM` | — | Transactional email |

Required variables are validated at boot — the API exits with an actionable
message rather than failing on the first request.

### Frontend

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | API base, including `/api/v1` |
| `NEXT_PUBLIC_WS_URL` | ✅ | WebSocket origin for real-time messaging |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical URLs, sitemap, OG images |

---

## Local development

```bash
# Backend — needs MySQL on :3306 (docker compose up db)
cd backend && npm install && npx prisma migrate dev && npm run build && node dist/main.js

# Frontend
cd frontend && npm install && npx next dev -p 3002
```

Frontend runs on `:3002`, API on `:4001`. Every optional integration degrades
gracefully, so the whole app is usable with only `DATABASE_URL` and
`JWT_ACCESS_SECRET` set.
