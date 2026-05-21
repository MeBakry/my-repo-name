# Compounded: Pharmacy Compounding Compliance Platform

AI-powered B2B SaaS platform that transforms pharmacy compliance from a manual documentation burden into an intelligent, automated system. Built for compounding pharmacies in Ontario (OCP/NAPRA standards), with architectural support for expansion to other jurisdictions.

## Project Overview

- **Purpose**: Automate the creation and maintenance of Risk Assessments and Master Formulation Records (MFRs) to meet Ontario College of Pharmacists (OCP) requirements.
- **Architecture**: Separated Frontend (React) and Backend (Node.js/Express) with a PostgreSQL database.
- **Key Innovation**: A **Deterministic Rule Engine** that generates professional risk assessments based on ingredient hazards (NIOSH, PubChem, Health Canada) and regulatory rules (OCP, NAPRA, WHMIS).
- **Phased Lifecycle**: The project is organized into phases: `01_Discover`, `02_Plan`, `03_Build`, `04_Launch`, `05_Grow`, and `06_Scale`.

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, CSS |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL, Prisma ORM |
| **Authentication** | JWT, bcryptjs |
| **Infrastructure** | Docker, Docker Compose, Nginx |
| **Data Pipeline** | Custom scrapers/fetchers (NIOSH PDF, PubChem API, Health Canada DPD) |

## Key Directory Structure

```text
/
├── 01_Discover/        # Research, business case, and requirements
├── 02_Plan/            # Architecture, roadmap, and feature planning
├── 03_Build/           # Core Source Code
│   ├── poc-pharma-risk/ # Frontend (React + Vite)
│   └── server/          # Backend (Express + Prisma)
├── 04_Launch/          # Distribution, documentation, and sales materials
├── 05_Grow/            # AI enhancement strategy and analytics
├── 06_Scale/           # Scaling and operations
├── docker-compose.yml  # Full stack container orchestration
└── package.json        # Root scripts for monorepo management
```

## Building and Running

### Using Docker (Recommended)

Docker handles all dependencies and the database setup automatically.

```bash
# Run the entire stack (Frontend: 8080, Backend: 3001)
docker compose up -d --build

# Run in Development mode (with Hot Reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Local Development (Node.js & PostgreSQL)

Requires Node.js 18+ and a local PostgreSQL instance.

1.  **Install All Dependencies**:
    ```bash
    npm run install:all
    ```
2.  **Database Setup**:
    - Copy `03_Build/server/.env.example` to `03_Build/server/.env` and configure `DATABASE_URL`.
    ```bash
    npm run db:setup
    ```
3.  **Start Dev Servers** (separate terminals):
    ```bash
    npm run dev:backend   # API on localhost:3001
    npm run dev:frontend  # Web on localhost:3000
    ```

## Core Workflows

### 1. Risk Assessment Generation
The rule engine (`03_Build/server/src/services/ruleEngine.js`) evaluates:
- **Ingredient Hazards**: NIOSH tables, GHS hazard statements.
- **Compound Complexity**: Form (Powder, Liquid, etc.) mapping to NAPRA levels.
- **Exposure Risk**: Frequency and volume of compounding.
- **Facility Level**: Level A/B/C requirements based on risk.

### 2. Data Pipeline
The platform uses an **offline-first** data strategy. External data is fetched, processed, and seeded into the database:
- `npm run fetch:all`: Scrapes NIOSH PDF, calls PubChem and Health Canada APIs.
- `npm run db:seed`: Populates PostgreSQL with processed JSON data and demo users.

## Development Conventions

- **Surgical Updates**: When modifying the rule engine or database schema, ensure synchronization between the `server` and `poc-pharma-risk` API clients.
- **Test-Driven Fixes**: Before fixing bugs in the rule engine, add a test case to `03_Build/server/src/services/ruleEngine.js` or verify via the manual testing patterns in `03_Build/TESTING.md`.
- **Documentation**: Maintain the `DEV_LOG.md` and `DEV_PROGRESS.md` in `03_Build/` to track architectural shifts.
- **Prisma Schema**: The source of truth for the data model is `03_Build/server/prisma/schema.prisma`. Always run `npx prisma generate` after schema changes.

## Key Files for Reference

- `03_Build/server/src/services/ruleEngine.js`: The "brain" of the platform.
- `03_Build/server/prisma/schema.prisma`: Database definitions.
- `03_Build/poc-pharma-risk/src/services/api.js`: Frontend API interaction layer.
- `03_Build/server/src/data/seed/ingredients-compounding.json`: The compiled hazard database.
