# Vercel Deployment

## 1. Architecture

This repository contains a Vite React frontend at the repository root and a
FastAPI backend in `backend/`. Vercel Services builds both from one project:

```text
Internet
   |
   v
Vercel Services
   |-- /       -> frontend service -> React/Vite dist/
   |-- /api/* -> backend service  -> FastAPI main:app
   `--        -> Supabase and other external services
```

The repository does not contain a `frontend/` directory. The frontend service
therefore correctly uses `.` as its root.

## 2. Vercel configuration

The root `vercel.json` uses the current `services` configuration. It defines:

- `frontend`: root `.`, framework `vite`, `npm run build`, output `dist`
- `backend`: root `backend/`, framework `fastapi`, entrypoint `main:app`
- `/api/*`: routed to `backend`
- all other paths: routed to `frontend`

The backend receives the original `/api/...` path, so the health endpoint is
available at `/api/health`.

## 3. Environment variables

Add these in Vercel Project Settings. Use the appropriate Environment scope.
Never commit real values.

### Frontend variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (optional; leave empty for the same-domain `/api` routes)
- `VITE_BACKEND_URL` (optional; use a separately hosted WebSocket service)

Only the `VITE_` variables are bundled into browser JavaScript. The Supabase
anon key is intended for the frontend; do not use a service-role key here.

### Backend-only variables

- `CORS_ORIGINS` (optional comma-separated frontend origins)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `TWILIO_MEDIA_STREAM_URL`
- `TWILIO_STATUS_CALLBACK_URL` (optional)
- `DEEPGRAM_API_KEY`

Set backend-only variables on the backend service/environment. Do not prefix
them with `VITE_`.

## 4. Frontend deployment

1. Import the Git repository into Vercel.
2. Use the repository root as the project root.
3. Ensure Services are enabled for the project and keep the checked-in
   `vercel.json` configuration.
4. Add the two required `VITE_SUPABASE_*` variables.
5. Leave `VITE_API_URL` empty when the Vercel backend service handles HTTP API
   traffic through `/api`.
6. Deploy and verify the landing page and `/login`, `/signup`,
   `/forgot-password`, and `/dashboard` routes.

## 5. Backend deployment

The exact FastAPI entrypoint discovered is `main:app` in `backend/main.py`.
The backend service installs `backend/requirements.txt` and is exposed through
the `/api/*` rewrite. Add all backend-only variables before deploying.

## 6. API URL structure

Frontend HTTP calls use the same-domain paths:

- `POST /api/calls`
- `POST /api/test-call`
- `POST /api/test-call/disconnect`
- `POST /api/twilio/status`
- `GET /api/health`

The health response should be `{ "status": "ok" }`.

## 7. Supabase

The frontend continues to initialize Supabase using `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` in `src/lib/supabase.ts`. Keep the existing Supabase
project and configure the same public values in Vercel. No backend Supabase
variables are currently used by this repository.

## 8. WebSocket limitation

The existing `/ws` and `/ws/media` endpoints are persistent WebSocket
connections. Vercel Functions are request-oriented and are not a suitable host
for this persistent WebSocket server. The Vercel HTTP APIs are prepared for
deployment, but live dashboard events and Twilio media streaming require a
separate persistent WebSocket-capable service.

To use live WebSocket functionality, deploy the existing backend to a service
such as Render, Railway, Fly.io, or a VM, then set:

- `VITE_API_URL` to that backend's HTTPS origin
- `VITE_BACKEND_URL` to its `wss://.../ws` endpoint
- `TWILIO_MEDIA_STREAM_URL` to its public `wss://.../ws/media` endpoint
- `TWILIO_STATUS_CALLBACK_URL` to its public `/api/twilio/status` URL

The frontend falls back to the same-origin WebSocket URL when
`VITE_BACKEND_URL` is absent, so it remains functional without hard-coded
localhost URLs, but Vercel will not provide the persistent socket service.

## 9. Test `/api/health`

After deployment, run:

```bash
curl https://YOUR_VERCEL_DOMAIN/api/health
```

Expected output:

```json
{"status":"ok"}
```

## 10. Local development

Frontend:

```bash
npm install
npm run dev
```

Backend, from the repository root:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

For local frontend-to-backend HTTP calls, set `VITE_API_URL=http://127.0.0.1:8000`
and `VITE_BACKEND_URL=ws://127.0.0.1:8000/ws` in a local ignored `.env` file.