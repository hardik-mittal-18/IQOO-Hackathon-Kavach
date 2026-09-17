# IQOO Hackathon Kavach

Kavach is an AI-powered safety platform that helps detect scam calls, explain
the risk, and help users stop fraudulent transfers before money is lost.

## Project Structure

- `src/` - React and Vite frontend
- `backend/` - FastAPI backend and scam-analysis services
- `supabase_schema.sql` - Supabase database schema

## Run Locally

### Frontend

```bash
pnpm install
pnpm dev
```

### Backend

Create a Python virtual environment, install `backend/requirements.txt`, and
start the API with:

```bash
uvicorn backend.main:app --reload
```

Configure local Supabase and other service credentials in a `.env` file. Do
not commit secrets.

## Hackathon Submission

**Product:** Kavach  
**Event:** iQOO Hackathon 2026  
**Tagline:** Your AI Shield Against Scam Calls