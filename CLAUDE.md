# CLAUDE.md — Compass Project Context

> This file gives Claude Code full context on the Compass project. Read it before touching any code.

---

## What Is This Project?

**Compass** is an AI-powered care navigation tool with two distinct user types:

**Parents** — families of children with developmental and neurological conditions (autism, ADHD, speech delays, etc.) who fill out an intake form and receive a personalized care plan.

**Clinics** — therapy centers or care providers who use Compass as a case management tool, with a database of multiple children and their roadmaps stored persistently.

The core parent problem: when a parent suspects something is wrong with their child, they face a 6–18 month maze of specialists, therapists, insurance, school IEPs, and regional centers — with zero guidance on where to start.

Compass solves this with 4 core features generated from a 5-minute intake form:
1. A **personalized action roadmap** — prioritized next steps specific to the child's situation
2. **Ready-to-send letters** — draft letters to schools, insurance companies, and regional centers
3. **Local therapy centers** — live-scraped providers near the family's zip code
4. **AI chatbot** — context-aware follow-up assistant that knows the child's profile

This is built for the UC Berkeley AI Hackathon (June 20–21, 2026). The MVP must be demoed live on Sunday afternoon.

---

## The Two User Modes

### Parent Mode
A parent visits the app, fills out the intake form about their child, and lands on their personal dashboard with all 4 features. Their child's data lives in the Flask session (browser cookie) for the duration of the visit. No login required.

### Clinic Mode
A clinic logs in and sees a dashboard listing all children in their care, each with their own stored roadmap. Child records are persisted in PostgreSQL. The clinic can click into any child's profile and view their full roadmap, letters, providers, and chat. The clinic can also add new children via the same intake form.

These are two separate pages with separate flows. They share the same backend services (Claude, Browserbase, Redis) but differ in how data is stored and who is using them.

---

## The 4 Pages

### Page 1: Landing Page (`/`)
The entry point. Two clear calls to action:
- "I'm a parent" → goes to `/intake`
- "I'm a clinic" → goes to `/clinic`

Explains what Compass does in plain language. Shows the disclaimer. No form, no login.

### Page 2: Intake Form (`/intake`)
Parent-facing. Collects:
- Child's name
- Child's age (in months, via a slider or number input)
- Zip code
- Free-text description of concerns
- Diagnosis status: None / Suspected / Confirmed
- Diagnosis name (optional, appears only if Confirmed is selected)
- Insurance provider (optional)

On submit: POST to `/api/intake`. Shows a loading screen while Claude and Browserbase run in parallel. On completion, redirects to `/dashboard`.

### Page 3: Parent Dashboard (`/dashboard`)
Four tabs — one per core feature:
- **Roadmap** — prioritized step cards
- **Letters** — three draft letters with copy buttons
- **Providers** — clinic cards scraped by zip code
- **Chat** — AI assistant with full child context

Child data for this session lives in the Flask session cookie. No login, no account.

### Page 4: Clinic Dashboard (`/clinic`)
Clinic-facing. Shows a list of all children in the clinic's database (from PostgreSQL). Each row shows child name, age, diagnosis status, and date added. Clicking a row opens that child's full profile (roadmap, letters, providers, chat). There is also an "Add new child" button that takes the clinic through the same intake form and saves the result to the database.

---

## Tech Stack

### Frontend
- **React + Tailwind CSS** — multi-page app using React Router
- Entry point: `frontend/src/App.jsx`
- Pages: `LandingPage`, `IntakePage`, `DashboardPage`, `ClinicPage`
- Communicates with backend via `fetch()` calls to Flask API

### Backend
- **Flask (Python)** — REST API server
- Entry point: `backend/app.py`
- Uses `ThreadPoolExecutor` for parallel API calls (Claude + Browserbase run simultaneously)
- Do NOT use async/await — Flask is synchronous. Use `concurrent.futures.ThreadPoolExecutor` for parallelism.

### External Services

| Service | What It Does in Compass | SDK / Docs |
|---|---|---|
| **Anthropic Claude API** | Generates roadmap, letters, and chat replies | `anthropic` Python SDK |
| **Browserbase** | Headless browser that scrapes local provider results by zip code | `browserbase` Python SDK + Stagehand |
| **Redis** | Caches provider results by zip code; stores chat conversation history | `redis` Python SDK |
| **PostgreSQL** | Persists child profiles and roadmaps for the clinic dashboard | `psycopg2` Python SDK |

All API keys and DB credentials live in `.env`. Never hardcode them.

---

## Project Structure

```
compass/
├── CLAUDE.md                        ← you are here
├── .env                             ← API keys + DB credentials (never commit)
├── .env.example                     ← template
├── README.md
│
├── backend/
│   ├── app.py                       ← Flask app, all routes defined here
│   ├── requirements.txt
│   ├── models/
│   │   └── database.py              ← PostgreSQL connection + schema + queries
│   ├── services/
│   │   ├── claude_service.py        ← All Anthropic API calls
│   │   ├── browserbase_service.py   ← Provider scraping logic
│   │   └── redis_service.py         ← Caching + chat memory
│   └── prompts/
│       ├── roadmap_prompt.py        ← System prompt for roadmap generation
│       └── letter_prompt.py         ← System prompt for letter drafting
│
└── frontend/
    ├── package.json
    ├── public/
    └── src/
        ├── App.jsx                  ← React Router setup, 4 routes
        ├── pages/
        │   ├── LandingPage.jsx      ← Entry point, parent vs clinic CTA
        │   ├── IntakePage.jsx       ← Intake form
        │   ├── DashboardPage.jsx    ← Parent dashboard (4 tabs)
        │   └── ClinicPage.jsx       ← Clinic dashboard (child list + profiles)
        ├── components/
        │   ├── RoadmapTab.jsx       ← Roadmap step cards
        │   ├── LettersTab.jsx       ← Letter cards + copy modal
        │   ├── ProvidersTab.jsx     ← Provider/clinic cards
        │   ├── ChatTab.jsx          ← AI chat panel
        │   └── ChildRow.jsx         ← Single row in clinic child list
        └── api/
            └── compassApi.js        ← All fetch() calls to Flask backend
```

---

## API Routes (Flask)

### `POST /api/intake`
Main endpoint. Accepts intake form data, runs Claude + Browserbase in parallel, returns all 4 feature outputs.

**Request body:**
```json
{
  "child_name": "string",
  "child_age_months": "number",
  "zip_code": "string",
  "concerns": "string (free text)",
  "diagnosis_status": "none | suspected | confirmed",
  "diagnosis_name": "string (optional)",
  "insurance": "string (optional)",
  "save_to_db": "boolean — true if submitted from clinic mode"
}
```

**Response:**
```json
{
  "session_id": "string",
  "roadmap": [
    {
      "title": "string",
      "description": "string",
      "timeline": "string",
      "priority": "high | medium | low",
      "category": "medical | school | therapy | insurance | support"
    }
  ],
  "letters": {
    "school": "string",
    "insurance": "string",
    "regional_center": "string"
  },
  "providers": [
    {
      "name": "string",
      "type": "string",
      "address": "string",
      "phone": "string",
      "website": "string"
    }
  ]
}
```

**Implementation notes:**
- Run `claude_service.generate_roadmap_and_letters()` and `browserbase_service.scrape_providers()` in parallel using `ThreadPoolExecutor`
- Check Redis cache first for providers by zip code before scraping
- Cache provider results with TTL of 24 hours
- Store intake data in Flask session: `session["child"] = {...}`
- Generate a `session_id` with `uuid.uuid4()` and store in `session["session_id"]`
- If `save_to_db` is true, call `database.save_child()` to persist to PostgreSQL

---

### `POST /api/chat`
Conversational follow-up. Uses Redis to maintain conversation history per session.

**Request body:**
```json
{
  "session_id": "string",
  "message": "string"
}
```

**Response:**
```json
{ "reply": "string" }
```

**Implementation notes:**
- Retrieve child context from `session["child"]` — do NOT re-send it from the frontend
- Retrieve conversation history from Redis: `chat:{session_id}`
- Build Claude system prompt using child context (name, age, concerns, diagnosis status)
- Pass full history as `messages` array to Claude
- Append both the user message and Claude reply to history, save back to Redis
- Keep Claude replies under 4 sentences — set this in the system prompt

---

### `GET /api/clinic/children`
Returns all children stored in the clinic's PostgreSQL database.

**Response:**
```json
{
  "children": [
    {
      "id": "number",
      "child_name": "string",
      "child_age_months": "number",
      "diagnosis_status": "string",
      "created_at": "string (ISO date)"
    }
  ]
}
```

---

### `GET /api/clinic/children/<id>`
Returns the full stored profile for a single child.

**Response:**
```json
{
  "id": "number",
  "child_name": "string",
  "child_age_months": "number",
  "zip_code": "string",
  "concerns": "string",
  "diagnosis_status": "string",
  "diagnosis_name": "string",
  "insurance": "string",
  "roadmap": [...],
  "letters": {...},
  "providers": [...],
  "created_at": "string"
}
```

---

## PostgreSQL Schema

```sql
CREATE TABLE children (
  id               SERIAL PRIMARY KEY,
  child_name       TEXT NOT NULL,
  child_age_months INTEGER NOT NULL,
  zip_code         TEXT,
  concerns         TEXT,
  diagnosis_status TEXT DEFAULT 'none',
  diagnosis_name   TEXT,
  insurance        TEXT,
  roadmap          JSONB,
  letters          JSONB,
  providers        JSONB,
  created_at       TIMESTAMP DEFAULT NOW()
);
```

All Claude-generated outputs (roadmap, letters, providers) are stored as JSONB — no need to normalize them into separate tables. This keeps queries simple and inserts fast for a hackathon build.

**database.py must implement:**
```python
def init_db()          # creates the table if it doesn't exist — call on app startup
def save_child(data)   # inserts a new child record, returns the new id
def get_all_children() # returns list of all children (summary fields only)
def get_child(id)      # returns full record for one child
```

Call `init_db()` inside `app.py` at startup so the table is created automatically — no manual migration step needed for the hackathon.

---

## Redis Usage

```python
# Chat history — one key per session
key = f"chat:{session_id}"
# Value: JSON list of {"role": "user"|"assistant", "content": "..."}
# TTL: 24 hours

# Provider cache — one key per zip code
key = f"providers:{zip_code}"
# Value: JSON list of provider objects
# TTL: 24 hours (86400 seconds)
```

Always check Redis before calling Browserbase. If cache hit, return immediately without scraping.

```python
def get_providers(zip_code):
    cached = redis_client.get(f"providers:{zip_code}")
    if cached:
        return json.loads(cached)
    providers = browserbase_service.scrape(zip_code)
    redis_client.set(f"providers:{zip_code}", json.dumps(providers), ex=86400)
    return providers
```

---

## Claude Prompting Guidelines

### Roadmap + Letters (single call)
Generate both in one Claude call to save time and API cost. Return a single JSON object:

```json
{
  "roadmap": [...],
  "letters": {
    "school": "...",
    "insurance": "...",
    "regional_center": "..."
  }
}
```

The system prompt must:
- Instruct Claude to return JSON only — no preamble, no markdown fences
- Inject child's name, age, zip code, concerns, diagnosis status, and insurance
- For roadmap: each step needs `title`, `description`, `timeline`, `priority`, `category`
- For letters: include placeholders `[YOUR NAME]`, `[DATE]`, `[SCHOOL DISTRICT NAME]` where the parent must fill in details
- Never use diagnostic language — say "discuss with your doctor", never "your child has X"
- Letter tone: professional but plain — these parents are not lawyers

### Chat System Prompt
```
You are Compass, a care navigation assistant helping the family of {child_name},
who is {age_months} months old and lives near zip code {zip_code}.

The parent's concerns: "{concerns}"
Diagnosis status: {diagnosis_status}

You ONLY answer questions about:
- Developmental services, therapy types, and how to access them
- The family's legal rights under IDEA, Early Start, and IEP law
- How to interpret or act on the child's care roadmap
- Insurance processes, appeals, and coverage questions
- What to expect at evaluations and appointments

If asked anything outside this scope, politely decline and redirect.
Keep every response under 4 sentences. Never diagnose any condition.
```

---

## Browserbase Scraping

Scrape these sources for local providers by zip code:
1. Psychology Today therapist finder
2. ASHA's Find a Provider (speech therapists)
3. Autism Speaks provider directory
4. California regional center directory (dds.ca.gov)

Return per provider: `name`, `type`, `address`, `phone`, `website`

**Fallback — required:** If Browserbase fails or returns empty results, return this hardcoded list so the Providers tab is never blank during the demo:

```python
FALLBACK_PROVIDERS = [
    {"name": "ASHA ProFind", "type": "Speech therapy", "address": "National directory", "phone": "800-638-8255", "website": "https://www.asha.org/profind/"},
    {"name": "Autism Speaks Provider Directory", "type": "ABA therapy", "address": "National directory", "phone": "", "website": "https://www.autismspeaks.org/resource-guide"},
    {"name": "CHADD", "type": "ADHD support", "address": "National directory", "phone": "800-233-4050", "website": "https://chadd.org"},
    {"name": "Early Start (California)", "type": "Early intervention", "address": "California statewide", "phone": "916-654-1690", "website": "https://www.dds.ca.gov/earlystart/"},
]
```

---

## Data Flow Summary

```
Parent fills intake form
        ↓
POST /api/intake
        ↓
ThreadPoolExecutor runs in parallel:
  ├── Claude → roadmap + letters (JSON)
  └── Browserbase → providers (check Redis cache first)
        ↓
Results stored:
  ├── intake_data → Flask session cookie (child profile)
  ├── session_id  → Flask session cookie
  └── providers   → Redis cache (by zip code)
        ↓
If clinic mode (save_to_db=true):
  └── Full record → PostgreSQL children table
        ↓
Frontend receives response → renders 4-tab dashboard
        ↓
Parent sends chat message
        ↓
POST /api/chat
  ├── child context ← Flask session cookie
  ├── chat history  ← Redis (chat:{session_id})
  └── Claude API call → reply
        ↓
  ├── history updated → Redis
  └── reply → frontend
```

---

## Scope: What Is In and Out of MVP

### ✅ In MVP (must work for demo)
- Landing page with parent / clinic split
- Intake form (text only — no voice)
- Roadmap generation (Claude)
- Letter drafting (Claude, same API call as roadmap)
- Provider results (Browserbase + Redis cache + hardcoded fallback)
- Chat panel (Claude + Redis history)
- Clinic dashboard (PostgreSQL — child list + individual profiles)
- Medical disclaimer on every screen

### ❌ Not in MVP (cut if time is short)
- Clinic login / authentication — for the hackathon, the clinic page is open access
- PDF export of letters
- Mobile-optimized layout (desktop demo is fine)
- M-CHAT screener — explicitly removed
- Voice input — explicitly removed
- Multi-clinic separation (one shared DB is fine for demo)
- Any ML classifier — do not add

---

## Prize Targets

| Prize | Requirement | How Compass Qualifies |
|---|---|---|
| **Anthropic ($5k credits + office hour)** | Built with Claude Code, tackles health/education | Core AI layer is Claude; health + social impact focus |
| **Ddoski's World ($5k cash)** | Social impact track | Directly addresses health equity / developmental disability navigation |
| **Redis (Mac Minis + credits)** | Meaningful use beyond caching | Provider cache + persistent chat memory via Redis |
| **Browserbase ($2k cash)** | Agent that uses the web | Live provider scraping is the core data source |

**Prize stacking is the strategy.** Every sponsor tool must be woven into the core product. Judges will ask "would this work without Redis?" — the answer must be no.

---

## Demo Script (4 minutes)

1. **Hook (30s):** "Imagine your child just got flagged for developmental delays. You have no idea what to do next. This is Compass."
2. **Intake form (30s):** Fill out the form with a prepared child profile — name, age, concerns, zip code
3. **Loading (15s):** Show the loading screen, mention Claude and Browserbase running in parallel
4. **Roadmap tab (45s):** Walk through 3–4 roadmap steps, highlight how they're specific to this child
5. **Letters tab (30s):** Open one letter, show the legal language and placeholders
6. **Providers tab (20s):** Show clinic cards from the scraped zip code results
7. **Chat tab (30s):** Ask "How do I request an evaluation?" — show Claude's specific, context-aware reply
8. **Clinic dashboard (30s):** Switch to `/clinic`, show the child list in PostgreSQL, click into the same child's profile
9. **Close (10s):** "5 minutes instead of 6 months."

---

## Environment Variables

```
# .env.example
ANTHROPIC_API_KEY=
BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://localhost:5432/compass
FLASK_SECRET_KEY=any-random-string-here
FLASK_ENV=development
FLASK_PORT=5000
```

---

## Running Locally

```bash
# PostgreSQL — create the database first
createdb compass

# Backend
cd backend
pip install -r requirements.txt
flask run --port 5000
# init_db() runs automatically on startup — no migration needed

# Frontend (separate terminal)
cd frontend
npm install
npm run dev

# Redis (separate terminal)
docker run -p 6379:6379 redis
# OR: redis-server
```

---

## Critical Reminders

- **Never** add diagnostic language to any Claude output. Say "discuss with your doctor", never name a condition.
- **Always** show the disclaimer: "This tool does not provide medical diagnoses. Always consult a qualified healthcare provider."
- **Browserbase fallback is required.** Network failures happen during demos. The hardcoded provider list must always be the backup.
- **`init_db()` must run on app startup.** The PostgreSQL table must exist before any clinic routes are called.
- **Redis and PostgreSQL serve different purposes.** Redis = fast ephemeral data (chat history, provider cache). PostgreSQL = persistent structured data (clinic child records). Do not conflate them.
- **`save_to_db` flag controls clinic mode.** The intake form is shared between parent and clinic flows. The only difference is whether the result gets written to PostgreSQL.
- **Keep the demo loop tight.** If something breaks during the demo, skip it and move on — do not let one broken tab derail the whole pitch.
