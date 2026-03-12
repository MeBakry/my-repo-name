# Pharmacy Compliance Platform - Backend Server

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ running locally (or use Docker)

### 1. Set up PostgreSQL

**Option A: Local PostgreSQL**
```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15
createdb pharma_compliance
```

**Option B: Docker**
```bash
docker run --name pharma-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pharma_compliance -p 5432:5432 -d postgres:15
```

### 2. Install & Configure
```bash
cd 03_Build/server
npm install
cp .env.example .env   # Edit if your DB credentials differ
```

### 3. Initialize Database
```bash
cd 03_Build/server
npx prisma migrate dev --name init    # Create tables
npm run db:seed                        # Load 100+ ingredients + regulatory data
```

### 4. Run the Server
```bash
cd 03_Build/server
npm run dev
```
**Or from repo root:** `npm run dev:backend`

Server starts at `http://localhost:3001`.

---

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user (auth required) |

### Ingredients (Offline Database)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ingredients` | List all (with search, pagination, NIOSH filter) |
| GET | `/api/ingredients/search?q=term` | Quick search (autocomplete) |
| GET | `/api/ingredients/:id` | Get single ingredient |
| POST | `/api/ingredients` | Create new (auth required) |
| PUT | `/api/ingredients/:id` | Update (admin only) |
| GET | `/api/ingredients/stats/summary` | Database statistics |

### Master Formulation Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mfr` | List MFRs (auth required) |
| GET | `/api/mfr/:id` | Get single MFR |
| POST | `/api/mfr` | Create MFR |
| PUT | `/api/mfr/:id` | Update MFR |
| PUT | `/api/mfr/:id/archive` | Archive MFR |

### Risk Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assessments/generate` | Generate from MFR (auth required) |
| POST | `/api/assessments/generate-preview` | Preview without saving (no auth) |
| GET | `/api/assessments` | List assessments (auth required) |
| GET | `/api/assessments/:id` | Get single assessment |
| PUT | `/api/assessments/:id/submit` | Submit for review |
| PUT | `/api/assessments/:id/approve` | Approve (supervisor only) |

---

## Demo Accounts

After seeding, the following accounts are available:

| Email | Password | Role |
|-------|----------|------|
| pharmacist@demo.com | demo123 | PHARMACIST |
| supervisor@demo.com | demo123 | SUPERVISOR |
| admin@demo.com | demo123 | ADMIN |

---

## Data Strategy: Offline First

All reference data is stored locally. **No real-time API calls to external services.**

| Data Source | Storage | File |
|-------------|---------|------|
| NIOSH Hazardous Drug List (2024) | Local JSON -> PostgreSQL | `src/data/seed/niosh-hazardous-drugs.json` |
| Ingredient Hazard Profiles (100+) | Local JSON -> PostgreSQL | `src/data/seed/ingredients-compounding.json` |
| OCP Rules & Facility Levels | Local JSON -> PostgreSQL | `src/data/seed/regulatory-references.json` |
| NAPRA Complexity Definitions | Local JSON -> PostgreSQL | `src/data/seed/regulatory-references.json` |
| WHMIS/GHS Hazard Codes | Local JSON -> PostgreSQL | `src/data/seed/regulatory-references.json` |
| USP <795> BUD Guidelines | Local JSON -> PostgreSQL | `src/data/seed/regulatory-references.json` |

To update data: edit the JSON files and re-run `npm run db:seed`.

---

## Architecture

```
server/
├── prisma/
│   └── schema.prisma          # Database schema (10 models)
├── src/
│   ├── index.js               # Express server entry point
│   ├── lib/
│   │   └── prisma.js          # Prisma client singleton
│   ├── middleware/
│   │   └── auth.js            # JWT authentication & role-based access
│   ├── routes/
│   │   ├── auth.js            # Login, register, me
│   │   ├── ingredients.js     # CRUD + search
│   │   ├── mfr.js             # Master Formulation Records
│   │   └── assessments.js     # Risk assessment generation & workflow
│   ├── services/
│   │   └── ruleEngine.js      # Deterministic assessment generator
│   └── data/
│       └── seed/
│           ├── index.js                    # Seed script
│           ├── niosh-hazardous-drugs.json  # 198 NIOSH drugs
│           ├── ingredients-compounding.json # 100+ full hazard profiles
│           └── regulatory-references.json   # OCP, NAPRA, WHMIS, USP
└── package.json
```
