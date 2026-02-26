# Technical Architecture & Resources

**Date:** February 17, 2026
**Project:** Pharmacy Compounding Compliance Platform
**Phase:** 1 (Foundation) -- In Progress

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS (Browser)                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           React + Vite Frontend (port 5173)             │    │
│  │                                                         │    │
│  │  MFRForm  IngredientInput  RiskAssessmentDisplay       │    │
│  │                    │                                    │    │
│  │           ┌────────┴────────┐                           │    │
│  │           │   api.js        │  (backend API client)     │    │
│  │           │   aiService.js  │  (assessment generation)  │    │
│  │           └────────┬────────┘                           │    │
│  │                    │  Falls back to local demo mode     │    │
│  │                    │  if backend is unavailable         │    │
│  └────────────────────┼────────────────────────────────────┘    │
│                       │                                         │
│                       │  HTTP (proxied via Vite → /api)         │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          Express.js Backend API (port 3001)             │    │
│  │                                                         │    │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐   │    │
│  │  │  Auth    │  │  Ingredients │  │  Assessments    │   │    │
│  │  │  Routes  │  │  Routes      │  │  Routes         │   │    │
│  │  └────┬─────┘  └──────┬───────┘  └───────┬─────────┘   │    │
│  │       │               │                   │             │    │
│  │  ┌────┴─────┐    ┌────┴─────┐    ┌───────┴─────────┐   │    │
│  │  │  JWT     │    │  Prisma  │    │  Rule Engine    │   │    │
│  │  │  Auth    │    │  ORM     │    │  (deterministic │   │    │
│  │  │  Middle- │    │          │    │   assessment    │   │    │
│  │  │  ware    │    │          │    │   generation)   │   │    │
│  │  └──────────┘    └────┬─────┘    └─────────────────┘   │    │
│  │                       │                                 │    │
│  └───────────────────────┼─────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database                        │    │
│  │                                                         │    │
│  │  pharmacies  users  ingredients  mfrs  assessments     │    │
│  │  mfr_ingredients  assessment_audit  regulatory_refs    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            Offline Data Pipeline (batch)                │    │
│  │                                                         │    │
│  │  fetch-niosh.js ──────► niosh-hazardous-drugs.json     │    │
│  │  (CDC PDF download)                                     │    │
│  │                                                         │    │
│  │  fetch-pubchem.js ────► pubchem-data.json              │    │
│  │  (PUG REST + PUG View APIs)                             │    │
│  │                                                         │    │
│  │  fetch-health-canada.js ► health-canada-dpd.json       │    │
│  │  (DPD bulk API download)                                │    │
│  │                                                         │    │
│  │  merge-into-ingredients.js ► ingredients-compounding.json│   │
│  │  (enriches ingredients with PubChem + HC data)          │    │
│  │                                                         │    │
│  │  seed/index.js ───────► PostgreSQL (ingredients,        │    │
│  │                          regulatory_refs, demo users)   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **Express** | 4.21 | HTTP framework, routing, middleware |
| **Prisma** | 6.4 | PostgreSQL ORM, schema management, migrations |
| **@prisma/client** | 6.4 | Type-safe database queries |
| **PostgreSQL** | 14+ | Relational database |
| **jsonwebtoken** | 9.0 | JWT token creation and verification |
| **bcryptjs** | 2.4 | Password hashing (10 salt rounds) |
| **zod** | 3.24 | Request body validation |
| **cors** | 2.8 | Cross-origin resource sharing |
| **dotenv** | 16.4 | Environment variable management |
| **pdfjs-dist** | 5.4 | NIOSH PDF text extraction |
| **node-html-parser** | 7.0 | HTML parsing (originally for NIOSH, retained for future scrapers) |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| **React** | 18.3 | UI library |
| **React DOM** | 18.3 | DOM rendering |
| **Vite** | 6.0 | Build tool, dev server, HMR |
| **@vitejs/plugin-react** | 4.3 | React Fast Refresh for Vite |

### External APIs Used (Offline Fetch Only)

| API | URL | Purpose | Rate Limit |
|-----|-----|---------|-----------|
| **PubChem PUG REST** | `pubchem.ncbi.nlm.nih.gov/rest/pug/` | Molecular properties (formula, weight, CID) | 5 req/sec |
| **PubChem PUG View** | `pubchem.ncbi.nlm.nih.gov/rest/pug_view/` | GHS hazard classification, pictograms | 5 req/sec |
| **Health Canada DPD** | `health-products.canada.ca/api/drug/` | Drug products (DINs, brands, routes) | No stated limit |
| **CDC/NIOSH** | `cdc.gov/niosh/docs/2025-103/pdfs/` | Hazardous drug list PDF download | N/A (file download) |

---

## 3. Database Schema

### Entity Relationship Diagram

```
Pharmacy (1) ──────────── (N) User
    │                           │
    │                           ├── creates ──── MasterFormulationRecord
    │                           ├── creates ──── RiskAssessment
    │                           ├── approves ─── RiskAssessment
    │                           └── logs ─────── AssessmentAudit
    │
    ├── (N) MasterFormulationRecord
    │        │
    │        ├── (N) MfrIngredient ──── (1) Ingredient
    │        │
    │        └── (N) RiskAssessment
    │                 │
    │                 └── (N) AssessmentAudit
    │
    └── (N) RiskAssessment

RegulatoryReference (standalone -- versioned regulatory data)
```

### Models Summary

| Model | Key Fields | Records | Notes |
|-------|-----------|---------|-------|
| **Pharmacy** | name, license, address, facility level, equipment flags | Seeded: 1 demo | Multi-pharmacy support |
| **User** | email, password (bcrypt), name, role, pharmacy_id | Seeded: 3 demo | Roles: PHARMACIST, SUPERVISOR, ADMIN |
| **Ingredient** | name, CAS, NIOSH table, hazards, PPE, GHS, PubChem CID, HC DIN | Seeded: 116 | Full hazard profiles |
| **MasterFormulationRecord** | product, form, route, concentration, batch size, method | User-created | The compounding recipe |
| **MfrIngredient** | mfr_id, ingredient_id, quantity, is_active | Join table | Links MFR to ingredients |
| **RiskAssessment** | complexity, exposure, PPE, facility, risk level, rationale, status | Generated | Output of rule engine |
| **AssessmentAudit** | assessment_id, action, changed_by, previous_version | Auto-created | Immutable audit trail |
| **RegulatoryReference** | source, title, version, effective_date, content (JSON) | Seeded: ~30 | OCP, NAPRA, WHMIS, USP |

### Enums

| Enum | Values | Used In |
|------|--------|---------|
| `UserRole` | PHARMACIST, SUPERVISOR, ADMIN | User.role |
| `NioshTable` | NONE, TABLE_1, TABLE_2, TABLE_3 | Ingredient.nioshTable |
| `PhysicalForm` | POWDER, LIQUID, SEMI_SOLID, GEL, CAPSULE, TABLET, OTHER | Ingredient.physicalForm |
| `GloveType` | REGULAR_NITRILE, CHEMOTHERAPY_RATED, DOUBLE_CHEMO | PPE JSON |
| `RespiratoryType` | NOT_REQUIRED, DUST_MASK, N95, PAPR | PPE JSON |
| `VentilationType` | GENERAL, LOCAL_EXHAUST, BSC, CVE | Ingredient.ventilationType |
| `RiskLevel` | A, B, C | RiskAssessment.riskLevel |
| `ComplexityLevel` | SIMPLE, MODERATE, COMPLEX | RiskAssessment.complexityLevel |
| `AssessmentStatus` | DRAFT, PENDING_REVIEW, APPROVED, EXPIRED, ARCHIVED | RiskAssessment.status |
| `MfrStatus` | ACTIVE, ARCHIVED, DRAFT | MasterFormulationRecord.status |
| `IngredientSource` | NIOSH, MANUAL, SDS, PUBCHEM, HEALTH_CANADA, SEED | Ingredient.source |

---

## 4. API Architecture

### Authentication Flow

```
Client                          Server
  │                               │
  │  POST /api/auth/login         │
  │  { email, password }          │
  │ ─────────────────────────────►│
  │                               │  bcrypt.compare(password, hash)
  │                               │  jwt.sign({ userId, role })
  │  { token, user }              │
  │ ◄─────────────────────────────│
  │                               │
  │  GET /api/ingredients         │
  │  Authorization: Bearer {jwt}  │
  │ ─────────────────────────────►│
  │                               │  jwt.verify → req.user
  │  { ingredients: [...] }       │
  │ ◄─────────────────────────────│
```

### Endpoint Summary

| Group | Endpoints | Auth | Description |
|-------|----------|------|-------------|
| Health | `GET /api/health` | No | Server status |
| Auth | `POST /api/auth/login` | No | Login, returns JWT |
| | `POST /api/auth/register` | No | Register new user |
| | `GET /api/auth/me` | Yes | Current user profile |
| Ingredients | `GET /api/ingredients` | No | List with search, pagination, NIOSH filter |
| | `GET /api/ingredients/search?q=` | No | Autocomplete search |
| | `GET /api/ingredients/stats/summary` | No | NIOSH table counts |
| | `GET /api/ingredients/:id` | No | Single ingredient |
| | `POST /api/ingredients` | Yes | Create ingredient |
| | `PUT /api/ingredients/:id` | Admin | Update ingredient |
| MFR | `GET /api/mfr` | Yes | List MFRs for pharmacy |
| | `GET /api/mfr/:id` | Yes | Single MFR with ingredients |
| | `POST /api/mfr` | Yes | Create MFR |
| | `PUT /api/mfr/:id` | Yes | Update MFR |
| | `PUT /api/mfr/:id/archive` | Yes | Archive MFR |
| Assessments | `POST /api/assessments/generate` | Yes | Generate from MFR (saves to DB) |
| | `POST /api/assessments/generate-preview` | No | Preview without saving |
| | `GET /api/assessments` | Yes | List assessments |
| | `GET /api/assessments/:id` | Yes | Get with audit trail |
| | `PUT /api/assessments/:id/submit` | Yes | Submit for review |
| | `PUT /api/assessments/:id/approve` | Supervisor+ | Approve assessment |

### Request Validation

All POST/PUT bodies are validated with **Zod** schemas before processing. Example:

```javascript
const ingredientSchema = z.object({
  name: z.string().min(1).max(200),
  casNumber: z.string().optional(),
  nioshTable: z.enum(['NONE', 'TABLE_1', 'TABLE_2', 'TABLE_3']).optional(),
  physicalForm: z.enum(['POWDER', 'LIQUID', ...]).optional(),
  whmisHazards: z.array(z.string()).optional(),
  // ...
});
```

---

## 5. Rule Engine Architecture

The rule engine (`server/src/services/ruleEngine.js`) generates risk assessments deterministically from ingredient data and regulatory rules. No AI, no external API calls.

### Processing Pipeline

```
Input (MFR data + ingredient hazard profiles)
    │
    ▼
Step 1: Complexity Classification
    │  Maps pharmaceutical form → NAPRA complexity level
    │  POWDER/CAPSULE/TABLET → MODERATE
    │  LIQUID → SIMPLE
    │  SEMI_SOLID/GEL → MODERATE
    │
    ▼
Step 2: Frequency & Volume Assessment
    │  Evaluates batch size + frequency against OCP
    │  "occasional small quantity" thresholds
    │
    ▼
Step 3: Risk Level Determination
    │  NIOSH TABLE_1 → Level C (always)
    │  NIOSH TABLE_2 + high frequency → Level C
    │  NIOSH TABLE_2 + moderate → Level B
    │  NIOSH TABLE_2 + occasional small qty → Level A (with conditions)
    │  Non-NIOSH → Level A (default)
    │
    ▼
Step 4: Exposure Risk Analysis
    │  Evaluates skin, eye, inhalation, oral routes
    │  based on ingredient hazard profiles
    │
    ▼
Step 5: PPE Recommendations
    │  NIOSH TABLE_1 → double chemo gloves, PAPR, full gown
    │  NIOSH TABLE_2 → chemo-rated gloves, N95
    │  Non-NIOSH → regular nitrile, dust mask if powder
    │
    ▼
Step 6: Facility Controls
    │  Risk Level C → BSC, mechanical ventilation, spill kit
    │  Risk Level B → local exhaust, dedicated area
    │  Risk Level A → general ventilation
    │
    ▼
Step 7: Rationale Generation
    │  Builds full-text rationale explaining each decision
    │  References OCP, NAPRA, NIOSH standards
    │
    ▼
Output (structured risk assessment JSON)
```

---

## 6. Data Pipeline Architecture

### Fetch → Store → Seed Flow

```
External Sources              Local JSON Files              PostgreSQL
─────────────────            ────────────────              ──────────

CDC NIOSH PDF ──► fetch-niosh.js ──► niosh-hazardous-drugs.json
                                         │
PubChem API ────► fetch-pubchem.js ──► pubchem-data.json
                                         │
HC DPD API ─────► fetch-health- ──► health-canada-dpd.json
                  canada.js              │
                                         ▼
                  merge-into- ──► ingredients-compounding.json ──► seed/index.js ──► ingredients table
                  ingredients.js                                                     regulatory_refs table
                                                                                     demo users + pharmacy
                  (already local) ──► regulatory-references.json ──────────────────┘
```

### Data Source Detail

| Source | What We Fetch | How | Records | Output |
|--------|--------------|-----|---------|--------|
| **NIOSH (CDC)** | Full 2024 hazardous drug list | Download 40-page PDF, extract text with pdfjs-dist, parse Table 1 + Table 2 | 213 drugs | `niosh-hazardous-drugs.json` |
| **PubChem (NIH)** | Molecular data + GHS hazards | PUG REST: CID, formula, weight, synonyms; PUG View: GHS classification, pictograms, hazard statements | 88 compounds | `pubchem-data.json` |
| **Health Canada DPD** | Drug product database | Bulk download of all 57,788 drug products + 120,153 active ingredient records, matched locally | 71 matched | `health-canada-dpd.json` |
| **Regulatory rules** | OCP, NAPRA, WHMIS/GHS, USP | Manually curated (regulatory documents don't have APIs) | ~30 rules | `regulatory-references.json` |

### Update Cycle

| Frequency | What to Run | Why |
|-----------|------------|-----|
| Quarterly | `npm run fetch:all && npm run db:seed` | NIOSH list may be updated |
| On demand | `npm run fetch:pubchem` | New ingredients added to seed database |
| On demand | `npm run fetch:health-canada` | New DINs needed |
| Annually | Manual edit of `regulatory-references.json` | OCP/NAPRA/USP rule changes |

---

## 7. Frontend Architecture

### Component Hierarchy

```
App.jsx
  │
  ├── MFRForm.jsx
  │     │
  │     ├── IngredientInput.jsx (× N ingredients)
  │     │     └── autocomplete dropdown
  │     │         ├── backend: GET /api/ingredients/search?q=...
  │     │         └── fallback: ingredientDatabase.js local search
  │     │
  │     └── [Submit] → aiService.js → generateRiskAssessment()
  │
  ├── LoadingSpinner.jsx (during generation)
  │
  └── RiskAssessmentDisplay.jsx
        ├── Hazard summary
        ├── PPE recommendations
        ├── Facility controls
        ├── Risk level badge (A/B/C)
        ├── Full rationale text
        └── [Copy to Clipboard] [Regenerate]
```

### Backend Integration

```javascript
// api.js - centralized API client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Automatic fallback: if backend is unavailable, components
// switch to local demo data (ingredientDatabase.js + built-in rules)
```

### Vite Proxy Configuration

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    }
  }
}
```

---

## 8. Security

| Layer | Mechanism |
|-------|-----------|
| Passwords | bcryptjs with 10 salt rounds |
| Tokens | JWT with HS256, configurable expiration |
| API access | Bearer token required on protected routes |
| Role-based access | `requireRole('SUPERVISOR')` middleware on approval endpoints |
| Input validation | Zod schemas on all POST/PUT bodies |
| CORS | Configured for frontend origin |
| Environment secrets | `.env` files excluded from version control |

---

## 9. File Inventory

### Backend (`server/`)

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.js` | ~40 | Express entry point, CORS, route mounting |
| `src/lib/prisma.js` | ~8 | Prisma client singleton |
| `src/middleware/auth.js` | ~60 | JWT auth, generateToken, requireRole |
| `src/routes/auth.js` | ~90 | Login, register, get current user |
| `src/routes/ingredients.js` | ~180 | Full CRUD, search, pagination, stats |
| `src/routes/mfr.js` | ~150 | MFR CRUD, ingredient linking, archive |
| `src/routes/assessments.js` | ~200 | Generate, preview, list, submit, approve |
| `src/services/ruleEngine.js` | ~350 | Deterministic risk assessment generation |
| `src/data/seed/index.js` | ~200 | Database seed script |
| `src/data/fetchers/fetch-niosh.js` | ~180 | NIOSH PDF scraper |
| `src/data/fetchers/fetch-pubchem.js` | ~180 | PubChem API fetcher |
| `src/data/fetchers/fetch-health-canada.js` | ~120 | Health Canada DPD fetcher |
| `src/data/fetchers/merge-into-ingredients.js` | ~100 | Merge fetched data into ingredients |
| `prisma/schema.prisma` | 265 | Database schema (10 models, 11 enums) |

### Frontend (`poc-pharma-risk/`)

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app, state management |
| `src/components/MFRForm.jsx` | MFR input form with validation |
| `src/components/IngredientInput.jsx` | Autocomplete with backend + local fallback |
| `src/components/RiskAssessmentDisplay.jsx` | Assessment output display |
| `src/components/LoadingSpinner.jsx` | Loading animation |
| `src/services/api.js` | Backend API client |
| `src/services/aiService.js` | Assessment generation (backend/demo/AI modes) |
| `src/data/ingredientDatabase.js` | 30-ingredient local fallback |
| `src/utils/prompts.js` | AI prompt templates (OpenAI/Claude mode) |

### Data Files (`server/src/data/seed/`)

| File | Size | Records |
|------|------|---------|
| `ingredients-compounding.json` | 140 KB | 116 ingredients with full hazard profiles |
| `niosh-hazardous-drugs.json` | 50 KB | 213 drugs (105 Table 1 + 108 Table 2) |
| `pubchem-data.json` | 166 KB | 88 compounds (CID, formula, GHS, synonyms) |
| `health-canada-dpd.json` | 117 KB | 71 drug product matches (DINs, brands) |
| `regulatory-references.json` | 16 KB | OCP, NAPRA, WHMIS/GHS, USP rules |

---

## 10. Development Commands

### Day-to-Day

```bash
npm run dev              # Start both backend + frontend
npm run dev:backend      # Backend only (port 3001)
npm run dev:frontend     # Frontend only (port 5173)
```

### Database

```bash
npm run db:setup         # Generate client + push schema + seed
npm run db:seed          # Re-seed data from JSON files
npm run db:reset         # Drop all tables and re-migrate
```

### Data Fetching

```bash
cd server
npm run fetch:niosh           # Download + parse NIOSH PDF
npm run fetch:pubchem         # Fetch from PubChem API (~3 min)
npm run fetch:health-canada   # Download Health Canada DPD (~1 min)
npm run fetch:merge           # Merge into ingredients
npm run fetch:all             # All of the above in sequence
```

---

## 11. What's Not Built Yet

| Feature | Planned Phase | Current Status |
|---------|--------------|----------------|
| API tests | Phase 1 | Pending |
| MFR CRUD pages in frontend | Phase 2 | Backend API ready |
| Assessment list/detail views | Phase 2 | Backend API ready |
| PDF export | Phase 2 | Not started |
| Status workflow UI | Phase 2 | Backend workflow ready |
| 12-month review reminders | Phase 3 | Schema supports it |
| Cumulative risk dashboard | Phase 3 | Not started |
| Multi-province support | Phase 4 | Architecture supports it |
| SDS document upload/parsing | Phase 2 | Schema has SDS fields |
| AI-powered rationale refinement | Phase 3 | Rule engine works without AI |

---

**Last Updated:** February 17, 2026
