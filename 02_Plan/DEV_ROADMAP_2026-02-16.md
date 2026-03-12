# Development Roadmap: PoC to Production MVP
**Date:** February 16, 2026  
**Project:** Pharmacy Compounding Compliance Platform  
**Status:** PoC Complete (demo mode) -- Ready for dev planning

---

## PoC Results Summary

### What the PoC Proved
| # | Business Requirement | PoC Status |
|---|---|---|
| 1 | Risk assessment per MFR/per strength | Proven |
| 2 | Hazard identification (NIOSH, SDS, WHMIS, reproductive toxicity) | Proven |
| 3 | NIOSH auto-tagging on chemicals | Proven |
| 4 | Risk level assignment (A/B/C) with documented reasoning | Proven |
| 5 | PPE populates based on hazard profile | Proven |
| 6 | Complexity classification (Simple/Moderate/Complex) | Proven |
| 7 | "Occasional small quantity" assessment | Proven |

### What the PoC Did NOT Cover (MVP scope)
| # | Business Requirement | Priority |
|---|---|---|
| 8 | Cumulative risk across all preparations | High |
| 9 | Ingredient hazards stored once, reused across MFRs | High |
| 10 | MFR triggers Risk Assessment auto-generation | High |
| 11 | 12-month review reminders | Medium |
| 12 | Version history / audit trail | Medium |
| 13 | Supervisor sign-off workflow | Medium |
| 14 | Cumulative risk dashboard | Medium |

### Key Architecture Decision from PoC
**AI is NOT required at runtime.** The rule engine (demo mode) correctly generates assessments using deterministic logic from regulatory data. AI may be used offline to refine templates, but the production system runs on rules + stored hazard data.

---

## Tech Stack Decision

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React + Vite | Already built in PoC, modern, expandable |
| **Backend** | Node.js + Express | Same language as frontend, fast to build |
| **Database** | PostgreSQL | Relational data (MFRs, assessments, ingredients, users), strong for compliance audit trails |
| **ORM** | Prisma | Type-safe queries, migration management |
| **Auth** | NextAuth.js or Clerk | Multi-user, role-based (pharmacist, supervisor) |
| **File Storage** | S3-compatible (or local) | SDS PDFs, exported reports |
| **PDF Export** | Puppeteer or React-PDF | Generate downloadable assessment PDFs |
| **Hosting** | Vercel (frontend) + Railway/Render (backend + DB) | Low-cost, scalable |

---

## Phase 1: Foundation (Weeks 1-3)

**Goal:** Database, authentication, ingredient library with real data

### 1.1 Database Schema
```
Users
  - id, email, name, role (pharmacist/supervisor/admin), pharmacy_id

Pharmacies
  - id, name, license_number, address, facility_level

Ingredients
  - id, name, cas_number, niosh_table, niosh_description
  - reproductive_toxicity, ghs_category, physical_form
  - whmis_hazards (jsonb), exposure_routes (jsonb)
  - recommended_ppe (jsonb), ventilation_required, ventilation_type
  - sds_document_url, sds_expiry_date
  - created_at, updated_at, source (niosh/manual/sds)

MasterFormulationRecords (MFRs)
  - id, pharmacy_id, product_name, concentration, form
  - route, frequency, batch_size, status (active/archived)
  - created_by, created_at, updated_at

MFRIngredients (join table)
  - mfr_id, ingredient_id, quantity, is_active_ingredient

RiskAssessments
  - id, mfr_id, pharmacy_id, version
  - complexity_level, complexity_justification
  - frequency_assessment (jsonb), exposure_risks (jsonb)
  - recommended_ppe (jsonb), facility_controls (jsonb)
  - risk_level (A/B/C), rationale (text)
  - references (jsonb)
  - status (draft/pending_review/approved/expired)
  - generated_at, approved_by, approved_at
  - next_review_date, created_at

AssessmentHistory (audit trail)
  - id, assessment_id, action (created/edited/approved/expired)
  - changed_by, changed_at, previous_version (jsonb), notes
```

### 1.2 Ingredient Database - Real Data (COMPLETED)
Expanded from 30 hardcoded entries to a comprehensive offline database:

| Source | # of Ingredients | Method | Status |
|---|---|---|---|
| Current PoC data | 30 | Direct migration | DONE |
| NIOSH Hazardous Drug List | 173 drugs (96 Table 1, 57 Table 2, 20 Table 3) | Structured JSON extraction | DONE |
| Full Hazard Profiles (actives) | 33 commonly compounded NIOSH drugs | Manual SDS + NIOSH compilation | DONE |
| Non-hazardous actives | 40+ drugs (corticosteroids, NSAIDs, etc.) | Manual entry from SDS | DONE |
| Excipients/bases/vehicles | 43 (bases, vehicles, preservatives, solvents) | Manual entry from supplier SDS | DONE |
| Regulatory references | OCP, NAPRA, WHMIS/GHS, USP <795> | Structured JSON | DONE |
| **Total seeded ingredients** | **116 with full hazard profiles** | PostgreSQL seed | DONE |
| Health Canada DPD | Offline storage (no real-time API) | Periodic bulk update planned | ARCHITECTURE SET |

### 1.3 Authentication & Multi-Pharmacy
- User registration with pharmacy association
- Roles: Pharmacist (create), Supervisor (approve), Admin (manage)
- Each pharmacy sees only its own data

### Deliverables - Phase 1
- [x] PostgreSQL database deployed with schema (Prisma schema: 10 models, all enums)
- [x] Prisma ORM configured with migrations
- [x] User auth (login, register, roles) - JWT + bcrypt, 3 roles (Pharmacist/Supervisor/Admin)
- [x] Ingredient CRUD API (add, edit, search) - Full REST API with pagination, filtering, autocomplete
- [x] Seed database with 116 ingredients with full hazard profiles + 213 NIOSH drugs catalogued
- [x] Health Canada DPD data stored offline (71 drugs matched with DINs via bulk API download)
- [ ] Basic API tests
- [x] **NEW: All data sources stored offline** - NIOSH, OCP, NAPRA, WHMIS/GHS, USP <795> as local JSON
- [x] **NEW: Automated data fetchers** - `fetch:niosh` (PDF scrape), `fetch:pubchem` (API), `fetch:health-canada` (API), `fetch:merge`
- [x] **NEW: Rule engine extracted** to standalone backend service (no AI needed at runtime)
- [x] **NEW: Frontend wired to backend** with automatic fallback to local demo mode

**Estimated Time: 3 weeks**

---

## Phase 2: Core Workflow (Weeks 4-6)

**Goal:** MFR management, auto-triggered risk assessment generation, persistence

### 2.1 MFR Management
- Create/edit/archive Master Formulation Records
- Link ingredients from the database (autocomplete, same as PoC)
- Different strengths create separate MFRs (per OCP requirement)

### 2.2 Risk Assessment Auto-Generation
- Completing an MFR automatically triggers a Risk Assessment draft
- Rule engine (evolved from PoC demo mode) generates the assessment
- Rules sourced from stored ingredient hazard data
- No external API calls needed at runtime

### 2.3 Assessment Persistence
- Save generated assessments to database
- View history of assessments per MFR
- Status workflow: Draft -> Pending Review -> Approved

### Deliverables - Phase 2
- [ ] MFR CRUD pages (create, edit, list, archive)
- [ ] MFR -> Risk Assessment auto-trigger
- [ ] Rule engine extracted into standalone service
- [ ] Assessment saved to database with version number
- [ ] Assessment list/detail views
- [ ] PDF export of individual assessment
- [ ] Status badge (Draft / Pending / Approved)

**Estimated Time: 2-3 weeks**

---

## Phase 3: Compliance & Governance (Weeks 7-9)

**Goal:** Supervisor workflow, review reminders, version history, audit trail

### 3.1 Supervisor Approval Workflow
- Supervisor reviews draft assessment
- Can approve, request changes, or reject
- Approval records: who, when, digital signature
- Locked after approval (new version required for changes)

### 3.2 12-Month Review Cycle
- Approved assessments automatically scheduled for review in 12 months
- Dashboard shows upcoming reviews (30/60/90 day warnings)
- Email/notification reminders to assigned supervisor
- Overdue assessments flagged prominently

### 3.3 Version History & Audit Trail
- Every change creates a version record
- Full diff between versions
- Audit log: who changed what, when, why
- Immutable history (meets inspection requirements)

### 3.4 SDS Management
- Upload SDS PDFs linked to ingredients
- Track SDS expiry (3-year validity)
- Alert when SDS needs renewal
- SDS reference linked in risk assessments

### Deliverables - Phase 3
- [ ] Supervisor review/approve UI
- [ ] Digital signature on approval
- [ ] 12-month review scheduler
- [ ] Email/notification reminders (upcoming + overdue)
- [ ] Compliance dashboard (upcoming reviews, overdue, expiring SDS)
- [ ] Version history with diff view
- [ ] Full audit trail log
- [ ] SDS upload and expiry tracking

**Estimated Time: 3 weeks**

---

## Phase 4: Cumulative Risk & Analytics (Weeks 10-11)

**Goal:** Facility-wide risk view, cumulative exposure tracking, dashboards

### 4.1 Cumulative Risk Dashboard
- Aggregate all active assessments for a pharmacy
- Risk distribution chart (how many Level A / B / C)
- Flag when cumulative hazardous drug exposure is high
- Prompt: "You have 15 NIOSH preparations -- consider facility upgrade?"

### 4.2 Analytics
- Staff exposure estimates (hours compounding hazardous drugs per year)
- Preparation volume trends
- Compliance score (% of assessments current, % of SDS valid)
- Benchmarking placeholder (for future multi-pharmacy comparison)

### 4.3 Inspection Readiness
- One-click export: all active assessments + audit trails
- Compliance summary report
- Missing/expired items checklist

### Deliverables - Phase 4
- [ ] Cumulative risk dashboard
- [ ] Risk distribution visualization
- [ ] Staff exposure calculator
- [ ] Compliance score card
- [ ] Inspection preparation export
- [ ] Aggregate reporting

**Estimated Time: 2 weeks**

---

## Phase 5: Polish & Launch (Week 12)

**Goal:** Testing, bug fixes, deployment, documentation

### Deliverables - Phase 5
- [ ] End-to-end testing (all workflows)
- [ ] Performance optimization
- [ ] Security review (auth, data isolation, API protection)
- [ ] Production deployment
- [ ] User documentation / help pages
- [ ] Admin setup guide
- [ ] Onboarding flow for new pharmacies

**Estimated Time: 1 week**

---

## Timeline Summary

```
Week  1-3:  Phase 1 - Foundation (DB, auth, ingredients)
Week  4-6:  Phase 2 - Core Workflow (MFR, auto-assessment, persistence)
Week  7-9:  Phase 3 - Compliance (approval, reminders, audit trail)
Week 10-11: Phase 4 - Analytics (cumulative risk, dashboards)
Week 12:    Phase 5 - Polish & Launch
```

**Total: ~12 weeks to production MVP**

---

## Data Update Strategy (Offline-First Architecture)

**Key Decision: All data stored locally. No real-time external API calls.**

| Data Category | Storage | Update Method | Frequency |
|---|---|---|---|
| Internal data (MFRs, assessments) | PostgreSQL | Event-driven (user actions) | Real-time |
| Ingredient hazard DB (100+) | `ingredients-compounding.json` → PostgreSQL | Admin curated + JSON update + re-seed | Quarterly |
| NIOSH Hazardous Drug List (198 drugs) | `niosh-hazardous-drugs.json` → PostgreSQL | Manual JSON update + re-seed | Quarterly |
| OCP Rules & Facility Levels | `regulatory-references.json` → PostgreSQL | Manual JSON update + re-seed | Quarterly |
| NAPRA Complexity Standards | `regulatory-references.json` → PostgreSQL | Manual JSON update | Every 2-3 years |
| WHMIS/GHS Hazard Codes | `regulatory-references.json` → PostgreSQL | Manual JSON update | Annually |
| USP <795> BUD Guidelines | `regulatory-references.json` → PostgreSQL | Manual JSON update | Annually |
| Health Canada DPD | Offline snapshot via bulk API download (57,788 products) | `npm run fetch:health-canada` | Quarterly |
| SDS Documents | User upload + 3-year expiry alerts | On upload | On upload |
| BI Dashboard data | Computed on-demand | Calculated from PostgreSQL | On-demand |

---

## Cost Estimate (Infrastructure)

| Item | Monthly Cost | Notes |
|---|---|---|
| PostgreSQL (Railway/Render) | $7-20 | Starter tier, scales up |
| Backend hosting (Railway/Render) | $7-20 | Node.js server |
| Frontend hosting (Vercel) | $0-20 | Free tier likely sufficient |
| File storage (S3/R2) | $1-5 | SDS PDFs |
| Email service (Resend/SendGrid) | $0 | Free tier for reminders |
| Domain | $12/year | |
| **Total** | **~$15-65/month** | No AI API costs at runtime |

---

## What Carries Over from PoC

| PoC Component | Status in MVP |
|---|---|
| `ingredientDatabase.js` (30 entries) | **DONE** - Expanded to 100+ full profiles in `ingredients-compounding.json`, seeded to PostgreSQL |
| Rule engine (demo mode in `aiService.js`) | **DONE** - Extracted to `server/src/services/ruleEngine.js` as standalone deterministic service |
| `MFRForm.jsx` | Reuse with minor updates |
| `IngredientInput.jsx` (autocomplete) | **DONE** - Updated to search backend API with fallback to local DB |
| `RiskAssessmentDisplay.jsx` | Reuse for assessment view |
| `LoadingSpinner.jsx` | Reuse |
| `App.css` (styling + design system) | Reuse as base styles |
| `prompts.js` | Archive (not needed at runtime) |
| `aiService.js` | **DONE** - Updated to call backend rule engine first, falls back to local demo |

## New Backend Components (Phase 1 Complete)

| Component | Description |
|---|---|
| `server/prisma/schema.prisma` | 10-model database schema with all enums |
| `server/src/services/ruleEngine.js` | Production rule engine (deterministic, no AI) |
| `server/src/routes/auth.js` | JWT auth (login, register, roles) |
| `server/src/routes/ingredients.js` | Full CRUD with search, pagination, NIOSH filter |
| `server/src/routes/mfr.js` | MFR management with ingredient linking |
| `server/src/routes/assessments.js` | Assessment generation, workflow (submit/approve) |
| `server/src/data/seed/` | Offline data: 198 NIOSH drugs + 100+ ingredient profiles + OCP/NAPRA/WHMIS/USP rules |

---

## Risk & Dependencies

| Risk | Mitigation |
|---|---|
| NIOSH PDF parsing is manual and error-prone | Start with manual entry of ~200 drugs; automate parsing later |
| OCP may update template/requirements | Quarterly review schedule; rule engine is configurable |
| Multi-pharmacy data isolation bugs | Thorough testing; row-level security in PostgreSQL |
| SDS OCR accuracy (future feature) | Defer automated SDS parsing to post-MVP; manual upload is sufficient |
| Scope creep | Stick to the 14 requirements from the email; defer all else |

---

## Success Criteria for MVP Launch

1. A pharmacy can create MFRs and get auto-generated risk assessments
2. Supervisor can review, approve, and sign assessments
3. System tracks 12-month review cycles with reminders
4. Full audit trail meets OCP inspection requirements
5. Cumulative risk dashboard shows facility-wide picture
6. 280+ ingredients in database with accurate hazard data
7. PDF export for any assessment
8. At least 3 pharmacies onboarded for pilot testing
