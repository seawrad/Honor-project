# Deployment Guide - Group Running App

This guide explains how to deploy the Group Running App so others can access it (not just localhost).

---

## Quick Share Options (for FYP demo / testing)

| Method | Best for | Effort | Cost |
|--------|----------|--------|------|
| **ngrok** | Share localhost with others quickly | 5 min | Free |
| **Railway** | Deploy to internet, no server needed | 15 min | Free tier |
| **Render** | Similar to Railway | 15 min | Free tier |
| **VPS + Docker** | Full control, production | 30 min | ~$5/mo |

### Option 1: ngrok (fastest – share your localhost)

1. Install ngrok: https://ngrok.com/download
2. Start app in production mode (single port):
   ```bash
   docker-compose up -d
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```
3. Run: `ngrok http 5000`
4. Share the ngrok URL (e.g. `https://abc123.ngrok.io`) with others

**Note:** Your computer must stay on. Good for quick demos.

### Option 2: Railway (deploy to cloud, free tier)

1. Sign up at https://railway.app
2. Create new project → Deploy from GitHub
3. Add PostgreSQL from Railway's add-ons
4. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` (your Railway app URL)
5. Railway will build and deploy. You get a URL like `https://your-app.railway.app`

### Option 3: Render (similar to Railway)

1. Sign up at https://render.com
2. New → Web Service → Connect repo
3. Add PostgreSQL from Render
4. Set environment variables
5. Deploy

### Option 4: Netlify (frontend) + Railway/Render (backend)

If you've used Netlify before, you can use it for the **frontend only**. The backend must run elsewhere (Railway, Render) because Netlify doesn't run Node.js servers or WebSockets.

**Step 1 – Deploy backend** (Railway or Render):

- Deploy the full app (or backend only) to Railway/Render
- Get the backend URL, e.g. `https://your-backend.railway.app`
- Set `CORS_ORIGIN` and `PRODUCTION_ORIGIN` to your Netlify URL (you'll get this in Step 2)

**Step 2 – Deploy frontend to Netlify**:

1. New site → Import from Git (or drag `frontend` folder)
2. **Build settings:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
3. **Environment variables** (Site settings → Environment variables):
   - `VITE_API_URL` = `https://your-backend.railway.app` (no trailing slash)
   - `VITE_WS_URL` = `https://your-backend.railway.app` (for Socket.io)
4. Deploy

**Step 3 – Update backend CORS:**

- Set `CORS_ORIGIN` = `https://your-site.netlify.app`
- Redeploy backend

**Backend-only on Railway:** New Project → Deploy from GitHub → Select repo → Set Root Directory to `backend` → Build: `npm install && npm run build` → Start: `node dist/index.js` → Add PostgreSQL add-on → Set env vars.

---

## What Has Been Prepared

1. **Dockerfile** - Multi-stage build that bundles frontend + backend into one image
2. **docker-compose.prod.yml** - Production override for running the app with PostgreSQL and Redis
3. **Backend static serving** - In production, the backend serves the frontend from the same origin (no CORS issues)

## Option A: Deploy with Docker (Recommended)

### Prerequisites

- Docker and Docker Compose
- A server (VPS) or cloud VM (e.g. DigitalOcean, AWS EC2, Railway, Render)

### Steps

1. **Set environment variables** - Create a `.env` file in the project root:

```
POSTGRES_PASSWORD=your-secure-db-password
JWT_SECRET=your-long-random-jwt-secret
JWT_REFRESH_SECRET=your-long-random-refresh-secret
CORS_ORIGIN=https://yourdomain.com
```

2. **Build and run**:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Migrations run automatically on app startup. To disable, set `SKIP_AUTO_MIGRATE=1`.

3. **Optional: Seed initial data**:

```bash
docker exec -it group-running-app node dist/database/seed.js
```

### Expose to Internet

- The app listens on port 5000. Use a reverse proxy (Nginx, Caddy) or cloud load balancer.
- Set up **HTTPS** with Let's Encrypt (free SSL).

---

## Option B: Deploy to Cloud Platforms

### Railway / Render / Fly.io

1. Connect your Git repository
2. Set environment variables (DATABASE_URL, JWT_SECRET, etc.)
3. Use a managed PostgreSQL add-on
4. Build command: `docker build -t app .` or use their Node.js buildpack
5. Start command: `node dist/index.js`

### Vercel (Frontend) + Railway (Backend)

If you prefer to split:

1. **Backend**: Deploy to Railway with PostgreSQL. Set CORS_ORIGIN to your Vercel URL.
2. **Frontend**: Deploy to Vercel. Set `VITE_API_URL=https://your-backend.railway.app` in build env.

---

## What You Still Need To Do

1. **Get a domain** - Register a domain (e.g. from Namecheap, Google Domains)
2. **Point DNS** - Add an A record pointing to your server IP
3. **Set up HTTPS** - Use Caddy (`caddy reverse-proxy`) or Nginx with Certbot
4. **Secure secrets** - Never commit .env. Use your platform's secret management
5. **Database backup** - Set up automated PostgreSQL backups
6. **Monitoring** - Consider Sentry (errors) and uptime monitoring

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | Secret for access tokens |
| JWT_REFRESH_SECRET | Yes | Secret for refresh tokens |
| CORS_ORIGIN | Yes | Your frontend URL (e.g. https://app.example.com) |
| PORT | No | Default 5000 |
| REDIS_URL | No | Redis URL (if using) |
| AWS_* | No | For S3/SNS if using file upload |

---

## Quick Test Locally

```bash
# 1. Start DB
docker-compose up -d

# 2. Build and run app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. Open http://localhost:5000
```
