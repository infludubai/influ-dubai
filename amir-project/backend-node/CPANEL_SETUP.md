# One-Time cPanel Setup for Node.js Backend

Do this ONCE on Namecheap cPanel. After this, all future deployments happen automatically via GitHub Actions.

---

## Step 1: Create Subdomain in cPanel

1. Log into cPanel (Namecheap → Manage → cPanel)
2. Go to **Domains** → **Subdomains**
3. Create subdomain: `node-api`
4. Domain: `amirnazir.site`
5. Document Root: `node-api` (auto-filled)
6. Click **Create**

This creates `node-api.amirnazir.site` pointing to `~/node-api/`

---

## Step 2: Set Up Node.js App in cPanel

1. In cPanel, find **Software** → **Setup Node.js App**
2. Click **Create Application**
3. Fill in:
   - **Node.js version**: 20 (or latest LTS available)
   - **Application mode**: Production
   - **Application root**: `node-api`
   - **Application URL**: `node-api.amirnazir.site`
   - **Application startup file**: `app.js`
4. Click **Create**

cPanel will install Node and set up Phusion Passenger to serve the app.

---

## Step 3: Verify It Works

Visit: `https://node-api.amirnazir.site/api`

You should see:
```json
{
  "name": "Amir Nazir Node API",
  "status": "active",
  "version": "0.2.0"
}
```

---

## Step 4: Switch Frontend to Node

Once verified, tell Claude to "switch frontend to Node" — this updates `VITE_API_URL` to `https://node-api.amirnazir.site/api` in GitHub Actions and rebuilds the frontend.

---

## After Setup: Automatic Deployments

Every `git push` to master that changes files in `backend-node/` will:
1. Sync files to `~/node-api/`
2. Run `npm install --production`
3. Touch `tmp/restart.txt` → Passenger restarts Node automatically

No manual steps needed after the initial cPanel setup.

---

## Troubleshooting

**App shows 500 error:**
- SSH into server: `ssh -p 21098 mkuwqnjx@198.187.31.49`
- Check logs: `cat ~/node-api/logs/error.log`
- Restart: `touch ~/node-api/tmp/restart.txt`

**DB connection error:**
- Check `~/node-api/.env` was created correctly
- Verify DB credentials match `~/laravel-api/.env`

**Still showing Laravel API:**
- cPanel Passenger setup not done yet (see Step 2)
- Or DNS hasn't propagated (wait 5 min)
