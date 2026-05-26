# Deployment Guide

This repository is a monorepo with `backend/` for the Express API and `frontend/` for the React/Vite app.

Production targets:

- Frontend: https://wordle-clone-pearl-psi.vercel.app
- Backend: https://wordle-clone-production-40ea.up.railway.app
- Database: Neon PostgreSQL
- Cache: Upstash Redis REST API

## Google OAuth

In Google Cloud Console, open APIs and Services, then Credentials, then edit the OAuth 2.0 Client ID.

Authorized JavaScript origins:

- `https://wordle-clone-pearl-psi.vercel.app`
- `http://localhost:5173`

Authorized redirect URIs:

- `https://wordle-clone-pearl-psi.vercel.app/auth/callback`
- `http://localhost:5173/auth/callback`

After saving, copy the OAuth client values into deployment environment variables. Do not commit the client secret.

## Vercel Frontend

Project settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://wordle-clone-production-40ea.up.railway.app` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

`frontend/.env.production` contains only the non-secret backend URL used by `vite build`. Set real production OAuth values in the Vercel dashboard.

## Railway Backend

Project settings:

- Build Command: `cd backend && npm install && npm run build`
- Start Command: `cd backend && npm run start`

Environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://wordle-clone-pearl-psi.vercel.app` |
| `DATABASE_URL` | Neon connection string |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `JWT_SECRET` | Strong production secret |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `PERF_ADMIN_KEY` | Strong admin key |

`FRONTEND_URL` supports comma-separated origins, for example:

```env
FRONTEND_URL=https://wordle-clone-pearl-psi.vercel.app,http://localhost:5173
```

The backend `start` script already runs `prisma generate && prisma migrate deploy && node dist/server.js`, so Railway must run the build command before the start command.

## Cross-Origin Cookies

Production auth cookies are httpOnly and use `SameSite=None; Secure` so the Vercel frontend can call the Railway backend with credentials. Browsers require HTTPS for these cookies. Use the Railway HTTPS URL:

```text
https://wordle-clone-production-40ea.up.railway.app
```

If the backend is accessed over plain HTTP in production, browsers will block the secure cross-origin cookies and login persistence will fail.

## Local Development

Start local PostgreSQL:

```bash
docker compose up -d postgres
```

Use this backend database URL locally:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wordle_dev?schema=public
```

Redis is not provided by Docker Compose because this app uses `@upstash/redis` over REST. Use a separate Upstash development database and set `UPSTASH_REDIS_REST_URL` plus `UPSTASH_REDIS_REST_TOKEN`.

## Verification

Run before opening a pull request:

```bash
cd backend
npm run typecheck
npm test
```

```bash
cd frontend
npm test
```

Manual production checks:

- Open `https://wordle-clone-pearl-psi.vercel.app`
- Confirm daily game loads
- Sign in with Google and verify redirect back to `/auth/callback`
- Confirm auth cookies are set with `HttpOnly`, `Secure`, and `SameSite=None`
- Confirm `GET https://wordle-clone-production-40ea.up.railway.app/health/ready` returns a ready response
