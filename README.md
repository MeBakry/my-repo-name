# Pharmacy Compounding Compliance Platform

AI-powered B2B SaaS platform that transforms pharmacy compliance from a documentation burden into an intelligent, automated system. Built for compounding pharmacies in Ontario, expandable to other jurisdictions.

## Status

**Phase 2 (Dev Build) — Active**
- Backend API server with PostgreSQL database: done
- Deterministic rule engine for risk assessment generation: done
- Automated data fetching from NIOSH, PubChem, Health Canada: done
- Frontend Dev build with **Formulation Library** dashboard as home screen: done
- Auto-login, full persistence (MFR + Assessment saved to DB): done
- API tests: pending

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# Install all dependencies (server + frontend)
npm run install:all

# Set up the database
cp server/.env.example server/.env   # edit DATABASE_URL + JWT_SECRET
npm run db:setup                      # generate client, push schema, seed data

# Start development
npm run dev                           # runs backend (port 3001) + frontend (port 5173)
```

### Fetch fresh data from external sources

```bash
cd server
npm run fetch:all    # NIOSH PDF + PubChem API + Health Canada DPD API + merge
npm run db:seed      # reload into PostgreSQL
```

---

## Project Structure

```
pharma/
├── server/                          # Express.js backend API
│   ├── prisma/schema.prisma         # Database schema (8 models)
│   ├── src/
│   │   ├── index.js                 # Express entry point
│   │   ├── lib/prisma.js            # Prisma client singleton
│   │   ├── middleware/auth.js       # JWT auth + role-based access
│   │   ├── routes/                  # REST API (auth, ingredients, mfr, assessments)
│   │   ├── services/ruleEngine.js   # Deterministic risk assessment logic
│   │   └── data/
│   │       ├── seed/                # Offline JSON data + seed script
│   │       └── fetchers/            # NIOSH, PubChem, Health Canada scrapers
│   └── README.md                    # API endpoint docs, demo accounts
│
├── poc-pharma-risk/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/              # MFRForm, IngredientInput, RiskAssessmentDisplay
│   │   ├── services/api.js          # Backend API client
│   │   ├── services/aiService.js    # Assessment generation (backend → demo fallback)
│   │   └── data/ingredientDatabase.js  # 30-ingredient offline fallback
│   └── .env.example
│
├── docs/                            # All documentation
│   ├── TECHNICAL_ARCHITECTURE.md    # System design, DB schema, API, data pipeline
│   ├── DEV_ROADMAP_2026-02-16.md    # 12-week implementation plan
│   ├── DEV_LOG_2026-02-17.md        # Build log (Phase 1)
│   ├── HOW_IT_WORKS.md              # Plain-language platform explanation
│   ├── EXECUTIVE_SUMMARY.md         # Business case
│   ├── PROJECT_OVERVIEW.md          # Business plan
│   └── AI_ENHANCEMENT_STRATEGY.md   # AI/UX vision (future phases)
│
├── agents/                          # Agent specs (future phases, not yet implemented)
├── features/FEATURE_PLAN.md         # 5-phase roadmap (18-24 months)
└── input/                           # Original business idea + OCP templates (PDF)
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

---

## Documentation

| Document | Description |
|----------|-------------|
| `docs/DEV_PROGRESS.md` | **Start here** — current state, decisions, key files, continuity |
| `docs/HOW_IT_WORKS.md` | Plain-language platform explanation |
| `docs/SETUP_GUIDE.md` | Step-by-step local env setup (macOS Apple Silicon) |
| `docs/TESTING.md` | Test plan: curl commands + Phase 1 & 2 UI test cases |
| `docs/index.html` | Technical documentation hub (open in browser) |
| `poc-pharma-risk/TEST_CASES.md` | UI test case checklist |
| `server/README.md` | Backend API endpoints, setup, demo accounts |
| `docs/DEV_ROADMAP_2026-02-16.md` | 12-week phased implementation plan |
| `docs/PROJECT_OVERVIEW.md` | Business plan, risks, go-to-market |
| `features/FEATURE_PLAN.md` | 5-phase product roadmap (18-24 months) |

**Created**: February 2026 | **Last Updated**: February 2026
