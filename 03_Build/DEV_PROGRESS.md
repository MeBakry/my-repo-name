# Pharmacy Risk Assessment — Development Progress & Continuity File

> **Purpose:** If you are starting a new chat session, open this file first. It contains the complete current state of the project, every major decision made, all key file paths, and what to do next. This is the single source of truth for the developer.

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Current Stage](#2-current-stage)
3. [Architecture Overview](#3-architecture-overview)
4. [Key File Map](#4-key-file-map)
5. [Business Flow Design](#5-business-flow-design)
6. [What Was Built — Session History](#6-what-was-built--session-history)
7. [Database Schema Summary](#7-database-schema-summary)
8. [API Endpoints Summary](#8-api-endpoints-summary)
9. [Environment Setup](#9-environment-setup)
10. [Current Known Issues / Limitations](#10-current-known-issues--limitations)
11. [Pending / Next Steps](#11-pending--next-steps)

---

## 1. Project Summary

**Product:** A pharmacy compounding risk assessment platform for compliance with NAPRA/OCP standards.

**What it does:**
- Allows pharmacists to create Master Formulation Records (MFRs) for compounded products
- Automatically generates a Risk Assessment for each formulation using a deterministic rule engine (no AI API calls in production — offline-first)
- Classifies products as Risk Level A, B, or C
- Tracks assessment lifecycle: Draft → Pending Review → Approved → (12-month renewal)
- Stores hazard data from NIOSH Hazardous Drug List, PubChem, and Health Canada locally (scraped once, never hits external APIs at runtime)

**Compliance standard:** NAPRA (National Association of Pharmacy Regulatory Authorities) Non-Sterile Compounding Guidelines + OCP.

---

## 2. Current Stage

**Stage: Development (Dev Build)**

| Phase   | Status    | Notes |
|---------|-----------|-------|
| Proof of Concept (PoC) | ✅ Done | Basic form → local assessment generation |
| Dev Build | ✅ Active | Full persistence, dashboard, status tracking |
| Production | ⬜ Not started | Needs: real user accounts, email review workflow, audit trails |

**Key capabilities unlocked in Dev:**
- Auto-login on app load (pharmacist@demo.com / demo123)
- Every form submission creates a real MFR and Assessment in PostgreSQL
- Formulation Library dashboard as home screen (lists all saved MFRs with status)
- Smart routing: click Approved → view saved assessment; click Draft/Review Due → re-open pre-filled form
- Annual review flow: overdue assessments open pre-filled for re-assessment, saved as new version

---

## 3. Architecture Overview

```
poc-pharma-risk/           ← React 18 + Vite frontend (port 5173)
  src/
    App.jsx                ← Main orchestrator, screen routing
    components/
      Dashboard.jsx        ← NEW: Formulation Library home screen
      MFRForm.jsx          ← Create/edit Master Formulation Record
      IngredientInput.jsx  ← Ingredient row with autocomplete + hazard badge
      RiskAssessmentDisplay.jsx  ← Assessment results display
      LoadingSpinner.jsx
    services/
      api.js               ← All backend API calls (REST client)
      aiService.js         ← Local demo fallback (offline rule engine)
    data/
      ingredientDatabase.js ← Local copy of hazard data for demo mode

server/                    ← Node.js + Express backend (port 3001)
  src/
    routes/
      auth.js              ← Login, register, JWT
      mfr.js               ← CRUD for Master Formulation Records
      assessments.js       ← Generate, view, approve assessments
      ingredients.js       ← Search, list, create ingredients
      users.js             ← User management
    services/
      ruleEngine.js        ← Deterministic risk classification logic
    middleware/
      auth.js              ← JWT verification + RBAC
  prisma/
    schema.prisma          ← Database models (8 models, 11 enums)

docs/
  DEV_PROGRESS.md          ← This file (continuity)
  HOW_IT_WORKS.md          ← Plain-language explanation
  SETUP_GUIDE.md           ← Step-by-step local env setup
  TESTING.md               ← Comprehensive test guide (curl + UI)
  index.html               ← Full technical documentation hub

agents/
  agent-orchestrator.md    ← Multi-agent design specifications
```

---

## 4. Key File Map

### Start here if you are new to the project

| File | What's in it |
|------|-------------|
| `03_Build/DEV_PROGRESS.md` | **This file** — current state, all decisions, what to do next |
| `01_Discover/HOW_IT_WORKS.md` | Plain-language explanation of the product |
| `03_Build/SETUP_GUIDE.md` | How to set up the local environment (macOS Apple Silicon) |
| `03_Build/TESTING.md` | Full test plan: curl commands + UI test cases |
| `04_Launch/index.html` | Technical documentation hub (open in browser) |
| `03_Build/poc-pharma-risk/TEST_CASES.md` | UI test cases |
| `03_Build/server/README.md` | Backend API reference, demo accounts |
| `03_Build/server/prisma/schema.prisma` | Database schema |
| `03_Build/server/.env` | Database connection string (not in git) |

### Core implementation files

| `poc-pharma-risk/src/App.jsx` | Screen routing: DASHBOARD → FORM → LOADING → RESULTS |
| `poc-pharma-risk/src/components/Dashboard.jsx` | Formulation Library home (lists all MFRs with status) |
| `poc-pharma-risk/src/components/MFRForm.jsx` | MFR create/edit form (accepts `initialData` prop for pre-fill) |
| `poc-pharma-risk/src/services/api.js` | All backend API calls |
| `server/src/routes/mfr.js` | MFR endpoints (list now includes latest assessment status) |
| `server/src/routes/assessments.js` | Assessment generation + lifecycle |
| `server/src/services/ruleEngine.js` | Core risk classification engine |

---

## 5. Business Flow Design

### The Problem (why the dashboard matters)

Before the dashboard: Every visit started from a blank form. If a pharmacist had already added "Testosterone 50mg/mL Gel" last week, and came back to add it again (forgetting they had done it), the system would silently create a duplicate. There was no way to find previous work.

### The Decision: Library-centric, not form-centric

**Old flow:** App loads → blank form → fill in → generate → view result → lost forever

**New flow:**

```
App loads
  └─→ Dashboard (Formulation Library)
        ├─→ [Existing formulation, Approved]   → View saved assessment directly
        ├─→ [Existing formulation, Draft]       → Open pre-filled form → regenerate
        ├─→ [Existing formulation, Review Due]  → Open pre-filled form + warning banner → new version
        └─→ [+ New Formulation button]          → Blank form → create + generate + save
```

### What happens when you try to re-add a product you already have?

1. You arrive at the Dashboard — you immediately see "Testosterone 50mg/mL Gel" listed with its status badge
2. You click it — you are taken directly to the saved assessment (if Approved) or the pre-filled form (if Draft/Review Due)
3. You do NOT accidentally create a duplicate
4. If you click "+ New Formulation" and start typing the name, a **duplicate warning banner** appears listing the existing entries and their assessment count

### Annual Review Flow

- An assessment has a `nextReviewDate` set to 12 months after approval
- When `nextReviewDate < today`, the MFR shows "Review Due" in red on the dashboard
- Clicking it opens the form pre-filled with existing data
- A red banner says "This assessment is overdue for its annual review..."
- The pharmacist reviews, adjusts any changed values, and generates a new assessment
- The new assessment is saved as version 2 (incrementing `version` field)

### Status States

| Status | What it means | Dashboard action |
|--------|--------------|-----------------|
| `APPROVED` | Has an approved assessment, review date in future | "View Assessment →" |
| `PENDING_REVIEW` | Submitted for supervisor approval | "View →" |
| `DRAFT` | Assessment generated but not approved | "Continue →" |
| `REVIEW_DUE` | Assessment was approved but review date has passed | "Start Review →" |
| `NO_ASSESSMENT` | MFR created but no assessment yet | "Generate →" |

---

## 6. What Was Built — Session History

### Environment Setup (Session 1)
- macOS Apple Silicon (arm64), Homebrew installed
- PostgreSQL 15 installed via `brew install postgresql@15`
- PATH updated in `~/.zprofile` for `/opt/homebrew/opt/postgresql@15/bin`
- Database `pharma_compliance` created with `createdb pharma_compliance`
- `server/.env` fixed: database URL changed from `postgres:postgres@localhost` to `mbakr@localhost` (Homebrew default = macOS username, no password)
- `npx prisma migrate dev --name init` — created all tables
- `npm run seed` — seeded with ~50 ingredients from NIOSH list

### Frontend Fixes (Session 2)
- **Bug fix:** Example buttons (Progesterone, Testosterone, etc.) weren't updating ingredient name fields. Fixed by adding `useEffect` in `IngredientInput.jsx` to sync local `query` state with `ingredient.name` prop.
- **UX fix:** Quantity field now normalizes on blur — removes extra spaces, removes space between number and unit ("20 g" → "20g"), preserves "per 100g" pattern.
- **UX fix:** Concentration/Strength field changed from free text to number + dropdown (%, mg, mg/mL, etc.) — ensures consistent format like "400mg" rather than "400 mg" or "400MG".
- **Feature:** Protocol Number field added (optional).

### Dev Mode Transition (Session 2)
- `App.jsx` refactored to auto-login with `pharmacist@demo.com` on mount
- Status badge in header: "Connecting..." → "Connected · Saving" → "Demo mode"
- Form submission now: resolve ingredients to IDs → `createMFR` → `generateAssessmentFromMFR` → display with "✓ Saved · v1" indicator
- Badge changed from "PoC" to "Dev"

### Token handling (Session 3)
- **Always re-login on init** — When backend is available, app always calls `login()` to refresh token (no longer trusts stale `localStorage` token)
- **401 clears token** — Any 401 response clears the stored token in `api.js`
- **Auth error retry** — Dashboard and `handleMFRClick` detect "Invalid or expired token", call `refreshAuth()`, then retry the failed request
- **User fix** — If "Could not load formulations: Invalid or expired token" appears: DevTools → Application → Local Storage → remove `pharma_token` → refresh

### Dashboard / Formulation Library (Session 3) ← Current Session
- `Dashboard.jsx` created — home screen with:
  - MFR list with status badges, risk levels, protocol numbers
  - Summary stats row (click to filter by status)
  - Search by product name or protocol number
  - Smart routing per status (see Section 5)
  - Empty state, demo mode notice, error handling
- `App.jsx` updated — new screen architecture: DASHBOARD / FORM / LOADING / RESULTS
- `MFRForm.jsx` updated — accepts `initialData` prop for pre-filling from existing MFR
- `App.css` updated — all dashboard styles added
- `server/src/routes/mfr.js` updated — MFR list endpoint now includes latest assessment (id, version, riskLevel, status, nextReviewDate)

---

## 7. Database Schema Summary

8 Models, 11 Enums (see `03_Build/server/prisma/schema.prisma` for full detail)

| Model | Purpose |
|-------|---------|
| `User` | Pharmacists and supervisors (JWT auth, RBAC) |
| `Ingredient` | Hazard database (NIOSH, PubChem, Health Canada data) |
| `MasterFormulationRecord` | A compounded product definition |
| `MFRIngredient` | Junction: which ingredients are in which MFR, with quantity |
| `RiskAssessmentRecord` | Generated risk assessment for an MFR (versioned) |
| `AuditLog` | Immutable log of every action |
| `ReviewCycle` | 12-month renewal tracking |
| `ComplianceFlag` | Flagged compliance issues |

Key enums: `UserRole`, `RiskLevel` (A/B/C), `AssessmentStatus` (DRAFT/PENDING_REVIEW/APPROVED/EXPIRED), `NIOSHTable`, `PhysicalForm`, `VentilationType`, `ExposureRoute`

---

## 8. API Endpoints Summary

21 endpoints across 4 route files. Backend runs on port 3001.

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create user account |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user profile |

### Ingredients (`/api/ingredients`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ingredients` | List all ingredients (paginated) |
| GET | `/ingredients/search?q=` | Search by name |
| GET | `/ingredients/:id` | Get single ingredient |
| POST | `/ingredients` | Create new ingredient (admin) |
| PUT | `/ingredients/:id` | Update ingredient |

### MFR (`/api/mfr`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mfr` | List all MFRs (includes latest assessment status) |
| GET | `/mfr/:id` | Get single MFR with full details |
| POST | `/mfr` | Create new MFR |
| PUT | `/mfr/:id` | Update existing MFR |
| DELETE | `/mfr/:id` | Archive MFR |

### Assessments (`/api/assessments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assessments/generate` | Generate assessment for an MFR (saves to DB) |
| GET | `/assessments` | List assessments |
| GET | `/assessments/:id` | Get single assessment |
| PUT | `/assessments/:id/submit` | Submit for review |
| PUT | `/assessments/:id/approve` | Approve (supervisor role) |
| PUT | `/assessments/:id/reject` | Reject (supervisor role) |
| GET | `/assessments/mfr/:mfrId` | All assessments for a specific MFR |

### Health (`/api/health`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend connectivity check |

---

## 9. Environment Setup

> Full guide: `03_Build/SETUP_GUIDE.md`

**Quick reference:**

```bash
# Prerequisites: macOS Apple Silicon, Homebrew, PostgreSQL 15, Node.js 18+

# 1. Database (one-time)
createdb pharma_compliance

# 2. Backend (from repo root)
npm run install:all   # or: cd 03_Build/server && npm install
cp 03_Build/server/.env.example 03_Build/server/.env
# Edit 03_Build/server/.env: DATABASE_URL="postgresql://YOUR_MACOS_USERNAME@localhost:5432/pharma_compliance?schema=public"
cd 03_Build/server
npx prisma migrate dev --name init
npm run db:seed
npm run dev        # runs on :3001

# 3. Frontend (from repo root, second terminal)
npm run dev:frontend   # or: cd 03_Build/poc-pharma-risk && npm run dev — runs on :3000
```

**Demo accounts (seeded):**
- Pharmacist: `pharmacist@demo.com` / `demo123`
- Supervisor: `supervisor@demo.com` / `demo123`
- Admin: `admin@demo.com` / `demo123`

---

## 10. Current Known Issues / Limitations

| Issue | Severity | Status |
|-------|----------|--------|
| `updateMFR` PUT endpoint may not be implemented on backend | Medium | To verify |
| `getAssessment` response shape may differ from what `RiskAssessmentDisplay.jsx` expects | Medium | To test |
| Demo mode fallback (no backend) shows empty dashboard | Low | By design — expected |
| No pagination on dashboard (loads up to 100 MFRs) | Low | Acceptable for dev |
| Annual review creates new assessment version but form always starts with concentrationUnit "%" if parse fails | Low | Edge case |
| No delete/archive UI for MFRs | Low | Backend supports it, UI not built |

---

## 11. Pending / Next Steps

### Immediate (verify this session's work)
- [ ] Test the dashboard with the seeded database: `npm run dev` in both server and poc-pharma-risk
- [ ] Verify clicking an approved MFR → view assessment flow
- [ ] Verify clicking "Review Due" → pre-filled form with banner
- [ ] Verify "New Formulation" → form → submit → saved → appears on dashboard

### Short-term features
- [ ] **Supervisor approval flow UI** — an assessments queue page for the supervisor role
- [ ] **Archive/delete MFR** — trash icon on dashboard card
- [ ] **Assessment history** — on the results screen, show "Version 1 (Approved Jan 2025) → Version 2 (Draft)"
- [ ] **Print/PDF export** of assessment
- [ ] **Filter by date range** on dashboard

### Medium-term
- [ ] **Real user registration** — replace auto-login with a proper login screen
- [ ] **Email notifications** — "Your assessment is due for review"
- [ ] **Audit trail UI** — view the full action log for a formulation
- [ ] **Role-based UI** — supervisor sees approval queue; admin sees all users

### Production requirements
- [ ] Replace demo credentials with real auth
- [ ] Add HTTPS / reverse proxy
- [ ] Backup strategy for PostgreSQL
- [ ] Rate limiting and input sanitization hardening
- [ ] NAPRA compliance audit by a licensed pharmacist

---

*Last updated: February 2026 — Session 3 (Dashboard / Formulation Library implementation)*
