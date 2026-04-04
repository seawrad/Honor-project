# Deployment Guide - RunCrew

This guide explains how to deploy RunCrew to the internet.

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

3. **Run database migrations** (first time only):

```bash
docker exec group-running-app node -e "
  const { runMigrations } = require('./dist/database/migrate.js');
  runMigrations().then(() => process.exit(0));
"
```

Or use: `npm run migrate --workspace=backend` before building if you have local DB.

4. **Optional: Seed initial data**:

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
