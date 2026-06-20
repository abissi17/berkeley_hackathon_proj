# 🧭 Compass

AI-powered care navigation for families of children with developmental concerns. Built for the UC Berkeley AI Hackathon (June 20–21, 2026).

## What It Does

Compass takes a 5-minute intake form and generates:

1. **Personalized action roadmap** — prioritized next steps
2. **Ready-to-send letters** — school, insurance, and regional center
3. **Local therapy providers** — scraped by zip code
4. **AI chatbot** — context-aware follow-up assistant

Two user modes: **Parent** (session-based, no login) and **Clinic** (persistent PostgreSQL storage).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router, Tailwind CSS, Vite |
| Backend | Flask (Python) |
| AI | Anthropic Claude (mock fallback included) |
| Scraping | Browserbase (mock fallback included) |
| Cache | Redis (in-memory fallback included) |
| Database | PostgreSQL |

## Quick Start (Local Dev)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
flask run --port 5000
```

The backend starts on http://localhost:5000. `init_db()` runs automatically on startup.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on http://localhost:3000. API calls are proxied to the Flask backend.

### 3. Optional Services

```bash
# Redis (for provider caching + chat history)
docker run -p 6379:6379 redis
# OR: redis-server

# PostgreSQL (for clinic persistence)
createdb compass
```

**The app runs without Redis or PostgreSQL** — in-memory fallbacks are built in.

## Environment Variables

Copy `.env.example` to `.env` and fill in your keys. The app works with mock data when keys are absent.

```
ANTHROPIC_API_KEY=
BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://localhost:5432/compass
FLASK_SECRET_KEY=any-random-string-here
```

## Project Structure

```
compass/
├── CLAUDE.md
├── .env.example
├── README.md
├── backend/
│   ├── app.py                    # Flask app + all routes
│   ├── requirements.txt
│   ├── models/
│   │   └── database.py           # PostgreSQL schema + queries
│   ├── services/
│   │   ├── claude_service.py     # Anthropic API (w/ mock)
│   │   ├── browserbase_service.py # Provider scraping (w/ mock)
│   │   └── redis_service.py      # Caching + chat memory (w/ fallback)
│   └── prompts/
│       ├── roadmap_prompt.py     # Roadmap + letters system prompt
│       └── letter_prompt.py      # Chat system prompt
└── frontend/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx               # React Router (4 routes)
        ├── index.css             # Tailwind + component classes
        ├── api/
        │   └── compassApi.js     # All fetch() calls
        ├── pages/
        │   ├── LandingPage.jsx   # Parent vs Clinic CTA
        │   ├── IntakePage.jsx    # Intake form
        │   ├── DashboardPage.jsx # Parent dashboard (4 tabs)
        │   └── ClinicPage.jsx    # Clinic dashboard
        └── components/
            ├── RoadmapTab.jsx
            ├── LettersTab.jsx
            ├── ProvidersTab.jsx
            ├── ChatTab.jsx
            └── ChildRow.jsx
```
