# 03 — Build (Dev + Infra + Data Layer + Testing)

Application code, infrastructure, and test documentation.

## Contents

- **server/** — Express.js backend API (Prisma, auth, MFR, assessments).
- **poc-pharma-risk/** — React + Vite frontend (Formulation Library, MFR form, risk display).
- **agents/** — Agent specs for future phases (not yet implemented).
- **SETUP_GUIDE.md** — Step-by-step local and container setup.
- **TESTING.md** — Test plan (API + UI).
- **DEV_PROGRESS.md**, **DEV_LOG_2026-02-17.md** — Build progress and decisions.

## Run locally

From repo root:

```bash
npm run install:all
cp 03_Build/server/.env.example 03_Build/server/.env   # edit DATABASE_URL + JWT_SECRET
npm run db:setup
npm run dev:backend   # terminal 1
npm run dev:frontend  # terminal 2
```

## Run with Docker

From repo root:

```bash
docker compose up -d --build
# Open http://localhost:8080
```
