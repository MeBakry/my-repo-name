# Pharmacy Compounding Compliance Platform

AI-powered B2B SaaS platform that transforms pharmacy compliance from a documentation burden into an intelligent, automated system. Built for compounding pharmacies in Ontario, expandable to other jurisdictions.

## Status

**Phase 2 (Dev Build) — Active**
- Backend API server with PostgreSQL database: done
- Deterministic rule engine for risk assessment generation: done
- Automated data fetching from NIOSH, PubChem, Health Canada: done
- Frontend Dev build with **Formulation Library** dashboard as home screen: done
- Auto-login, full persistence (MFR + Assessment saved to DB): done
- **Docker** — full stack (db + API + web) runs in containers
- API tests: pending

---

## Quick Start

**No Node/npm on your machine needed.** Install and run everything inside Docker so your local environment stays clean and conflict-free.

### Option A: Run app (production-style in containers)

```bash
# From repo root
docker compose up -d --build

# Open in browser
open http://localhost:8080
```

- **Frontend:** http://localhost:8080 (nginx serves the app and proxies `/api` to the backend)
- **Database:** PostgreSQL 16 in a container; data persists in volume `pharma_db_data`
- **Seeding:** On first run the server **auto-seeds** demo users if the DB has none, so login works without extra steps. To manually re-seed (e.g. reset users):
  ```bash
  docker compose exec server npm run db:seed
  ```
  Demo logins: **shereen** / **shereen** (Pharmacist), **elsayad** / **elsayad** (Supervisor).

To stop: `docker compose down`. To reset DB: `docker compose down -v` then `docker compose up -d` (server will auto-seed again).

**White page at http://localhost:8080?**

1. **Check containers:** `docker compose ps` — all three (db, server, frontend) should be "Up".
2. **Check frontend build:** `docker compose logs frontend` — the image build should show no errors; if the build failed, the app won’t load.
3. **Rebuild without cache:** `docker compose build --no-cache frontend && docker compose up -d` to force a clean frontend build.
4. **Browser:** Open DevTools (F12) → **Network** tab: reload and see if any request is red (404). If `/assets/*.js` is 404, the built assets aren’t being served. **Console** tab: note any red errors (e.g. failed to load script or runtime error).

**Passwords (shereen / elsayad) not working?**

The database may not have been seeded. Rebuild and restart the server so it auto-seeds on startup:
```bash
docker compose build server && docker compose up -d
```
Then try logging in again.

### Option B: Develop inside containers (install happens in container, not on host)

Same as Option A but runs the **dev servers** (with hot reload) and keeps dependencies inside containers via volumes. You never run `npm run install:all` on your host.

```bash
# From repo root — install + run dev servers happen in containers
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- **Frontend (Vite):** http://localhost:3000  
- **API:** http://localhost:3001  
- **node_modules** live in Docker volumes (`server_node_modules`, `frontend_node_modules`), so your local repo stays clean and won’t conflict with your system Node.

To run DB migrations or seed from the host (optional):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec server npx prisma migrate deploy
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec server npm run db:seed
```

### Option C: Run locally with Node/npm on your machine

Only if you prefer running Node directly (no Docker for dev):

**Prerequisites:** Node.js 18+, PostgreSQL 14+

```bash
# Install dependencies on your machine (Node doesn't use "venv" — deps go in 03_Build/*/node_modules)
npm run install:all

# Set up the database
cp 03_Build/server/.env.example 03_Build/server/.env   # edit DATABASE_URL + JWT_SECRET
npm run db:setup                                        # generate client, push schema, seed data

# Start development (two terminals)
npm run dev:backend   # API on port 3001
npm run dev:frontend  # Vite on port 3000 (or 5173)
```

### Fetch fresh data from external sources

**If using Docker (Option A or B):**

```bash
docker compose exec server sh -c "npm run fetch:all && npm run db:seed"
# or with dev compose:
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec server sh -c "npm run fetch:all && npm run db:seed"
```

**If running locally (Option C):**

```bash
cd 03_Build/server
npm run fetch:all    # NIOSH PDF + PubChem API + Health Canada DPD API + merge
npm run db:seed      # reload into PostgreSQL
```

---

## Project Structure

The repo is organized by lifecycle phase:

```
pharma/
├── 01_Discover/        # Idea + Validation
│   ├── input/          # OCP templates, business material
│   ├── PROJECT_OVERVIEW.md
│   ├── EXECUTIVE_SUMMARY.md
│   └── HOW_IT_WORKS.md
│
├── 02_Plan/            # Planning + Design + Tech Stack
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── DEV_ROADMAP_2026-02-16.md
│   └── features/FEATURE_PLAN.md
│
├── 03_Build/           # Dev + Infra + Data Layer + Testing
│   ├── server/        # Express.js backend API (Prisma, auth, MFR, assessments)
│   │   ├── Dockerfile
│   │   ├── prisma/schema.prisma
│   │   └── src/       # routes, services/ruleEngine.js, data/seed, data/fetchers
│   ├── poc-pharma-risk/   # React + Vite frontend
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── src/       # components, services/api.js, aiService.js
│   ├── agents/        # Agent specs (future phases)
│   ├── SETUP_GUIDE.md
│   ├── TESTING.md
│   └── DEV_PROGRESS.md, DEV_LOG_2026-02-17.md
│
├── 04_Launch/         # Launch + Acquisition + Distribution
│   ├── index.html     # Technical documentation hub (open in browser)
│   ├── PRESENTATION.html
│   ├── screenshots/
│   ├── SCREENSHOT_GUIDE.md
│   └── assessments/   # Sample risk assessments
│
├── 05_Grow/           # Conversion + Revenue + Retention + Analytics
│   └── AI_ENHANCEMENT_STRATEGY.md
│
├── 06_Scale/          # Growth + Scaling + Ops
│   └── README.md
│
├── docs/              # Pointer to 01–06 (see docs/README.md)
├── docker-compose.yml # Run full stack in containers
└── package.json       # Monorepo scripts (dev:backend, dev:frontend, db:setup, install:all)
```

---

## Frontend

### User Flow

- **Home screen** = **Formulation Library** — lists all saved formulations with status badges (Approved, Draft, Review Due)
- **+ New Formulation** — opens the MFR form to create a new compounded product
- **← Library** — returns to the dashboard from form or results
- Clicking a saved formulation card opens it (view assessment if Approved, or continue/edit if Draft/Review Due)

### Modes of Operation

| Mode | Config | How it works |
|------|--------|-------------|
| **Backend** (recommended) | Backend running on port 3001 | Auto-login, full persistence to PostgreSQL |
| **Demo** (fallback) | Backend unavailable | Local 30-ingredient database + built-in demo logic |

The app automatically detects backend availability and falls back gracefully. If you see "Invalid or expired token", clear `localStorage` (DevTools → Application → remove `pharma_token`) and refresh.

### Quick Examples

Click **+ New Formulation** to open the form. Pre-built example buttons at the bottom:
- **Progesterone Supp** -- NIOSH Table 2, weekly, 30 units (expect Level B)
- **Testosterone Gel** -- NIOSH Table 2, daily, 50 tubes (expect Level C)
- **Hydrocortisone Cream** -- non-NIOSH, daily, 100 units (expect Level A)
- **Zinc Oxide Ointment** -- non-NIOSH, weekly, 50 units (expect Level A)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite | Formulation Library, MFR form, assessment display |
| Backend | Node.js + Express | REST API, auth, business logic |
| Database | PostgreSQL + Prisma ORM | 8-model schema, migrations, type-safe queries |
| Auth | JWT + bcryptjs | Token-based auth, 3 roles (Pharmacist/Supervisor/Admin) |
| Rule Engine | Custom JS | Deterministic risk assessment from regulatory rules |
| Data Fetching | Custom scripts | NIOSH PDF scraping, PubChem API, Health Canada DPD API |
| Containers | Docker Compose | db + server + frontend (nginx); single-command run |

## Data Sources (All Offline)

| Source | Records | Fetch Method |
|--------|---------|-------------|
| NIOSH Hazardous Drug List 2024 | 213 drugs (Table 1 + 2) | PDF download + text extraction |
| PubChem (NIH) | 88 compounds | PUG REST + PUG View APIs |
| Health Canada DPD | 71 drugs matched | Bulk API download (57,788 products) |
| Ingredient Hazard Database | 116 full profiles | Compiled + enriched from above |
| Regulatory References | OCP, NAPRA, WHMIS/GHS, USP | Curated JSON |

## Key Architecture Decisions

1. **No AI at runtime.** The rule engine generates assessments deterministically. AI may refine templates offline later.
2. **Offline-first data.** All external data fetched and stored locally. No real-time external API calls.
3. **Frontend backward compatibility.** React app works standalone when backend is unavailable.
4. **Container-first delivery.** Full stack runs via `docker compose up` for easy shipping and demos.

---

## Documentation

| Document | Description |
|----------|-------------|
| **03_Build/DEV_PROGRESS.md** | **Start here** — current state, decisions, key files, continuity |
| **01_Discover/HOW_IT_WORKS.md** | Plain-language platform explanation |
| **03_Build/SETUP_GUIDE.md** | Step-by-step local and Docker setup |
| **03_Build/TESTING.md** | Test plan: curl commands + Phase 1 & 2 UI test cases |
| **04_Launch/index.html** | Technical documentation hub (open in browser) |
| **03_Build/poc-pharma-risk/TEST_CASES.md** | UI test case checklist |
| **03_Build/server/README.md** | Backend API endpoints, setup, demo accounts |
| **02_Plan/DEV_ROADMAP_2026-02-16.md** | 12-week phased implementation plan |
| **01_Discover/PROJECT_OVERVIEW.md** | Business plan, risks, go-to-market |
| **02_Plan/features/FEATURE_PLAN.md** | 5-phase product roadmap (18-24 months) |

**Created**: February 2026 | **Last Updated**: March 2026

---

## Clean local (reset previous/old config)

To remove Docker containers, volumes, and local `node_modules` so nothing conflicts with a fresh run or container-only workflow:

```bash
./scripts/clean-local.sh
```

To also remove `.env` files (reconfigure from `.env.example`):

```bash
./scripts/clean-local.sh --env
```

After that, run the app with Docker (`docker compose up -d --build`) or reinstall locally (`npm run install:all`).
