# Local Development Setup Guide

**Platform tested**: macOS 15 (Sequoia) — Apple Silicon (arm64)  
**Date**: February 17, 2026  
**Status**: Verified working end-to-end

This guide documents the exact steps taken to get the platform running locally from a clean macOS machine with no pre-installed developer tools (no Homebrew, no PostgreSQL, no Node).

---

## Prerequisites Check

Before starting, verify what you have. Run each of these:

```bash
brew --version      # Homebrew package manager
node --version      # Node.js runtime
psql --version      # PostgreSQL client
```

If any of these return "command not found", follow the relevant installation section below before proceeding.

---

## Step 1 — Install Homebrew (if not installed)

Homebrew is the standard package manager for macOS. It installs to `/opt/homebrew/` on Apple Silicon and does not touch any system files.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

When the installer finishes, it prints two commands under "Next steps". **Run them both** — they add Homebrew to your PATH:

```bash
echo >> /Users/YOUR_USERNAME/.zprofile
echo 'eval "$(/opt/homebrew/bin/brew shellenv zsh)"' >> /Users/YOUR_USERNAME/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
```

Replace `YOUR_USERNAME` with your macOS username (e.g. `mbakr`). The installer output shows the exact commands with your username pre-filled — use those.

Verify:

```bash
brew --version
# Homebrew 4.x.x
```

---

## Step 2 — Install Node.js (if not installed)

```bash
brew install node
node --version    # should show v18+ or v20+
npm --version
```

---

## Step 3 — Install PostgreSQL

```bash
brew install postgresql@15
```

PostgreSQL 15 installs its binaries in a versioned path that is **not** added to `PATH` automatically. Fix this:

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zprofile
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

The first line makes it permanent. The second activates it in your current terminal session without needing to reopen a window.

Verify:

```bash
psql --version
# psql (PostgreSQL) 15.x
```

---

## Step 4 — Start PostgreSQL and Create the Database

```bash
brew services start postgresql@15
createdb pharma_compliance
```

### Important: macOS Homebrew PostgreSQL username

On macOS with Homebrew, PostgreSQL creates a superuser matching your **macOS login username** (e.g. `mbakr`) with **no password**. There is no `postgres` user by default.

This affects the `DATABASE_URL` — see Step 6.

---

## Step 5 — Clone / Navigate to the Project

```bash
cd /path/to/pharma
```

Install all dependencies (both server and frontend in one command from the project root):

```bash
npm run install:all
```

Or install separately:

```bash
cd 03_Build/server && npm install
cd 03_Build/poc-pharma-risk && npm install
```

---

## Step 6 — Configure the Server Environment

```bash
cd 03_Build/server
cp .env.example .env
```

Open `03_Build/server/.env` and set the `DATABASE_URL` to use your macOS username (not `postgres`):

```env
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/pharma_compliance?schema=public"
JWT_SECRET="change-this-to-a-secure-random-string"
PORT=3001
NODE_ENV=development
```

**Common mistake**: The `.env.example` ships with `postgresql://postgres:postgres@...` which will fail on Homebrew PostgreSQL with error `P1010: User was denied access`. Replace `postgres:postgres` with your macOS username and no password.

Example for username `mbakr`:
```env
DATABASE_URL="postgresql://mbakr@localhost:5432/pharma_compliance?schema=public"
```

---

## Step 7 — Initialize the Database Schema

```bash
cd 03_Build/server
npx prisma migrate dev --name init
```

Expected output:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "pharma_compliance", schema "public" at "localhost:5432"
...
✔ Generated Prisma Client
```

This creates all 8 database tables and 11 enums from `prisma/schema.prisma`.

---

## Step 8 — Seed the Database

```bash
cd 03_Build/server
npm run db:seed
```

Expected output:
```
=== Pharmacy Compliance Platform - Database Seed ===

Seeding ingredients...
  Ingredients: 116 created, 0 skipped (already exist)
Seeding regulatory references...
  Regulatory references: 4 upserted
Seeding NIOSH hazardous drug list metadata...
  NIOSH list stored: 105 Table 1 + 108 Table 2 + 0 Table 3 drugs
Seeding demo pharmacy and user...
  Demo pharmacy: Demo Compounding Pharmacy (OCP-DEMO-001)
  Demo users: pharmacist@demo.com, supervisor@demo.com, admin@demo.com (password: demo123)

=== Seed Complete ===
  Total ingredients: 116
  Total regulatory references: 5
  Total users: 3
```

This loads:
- 116 ingredient hazard profiles (NIOSH + PubChem + Health Canada merged)
- 5 regulatory reference records (OCP, NAPRA, WHMIS, USP x2)
- 1 demo pharmacy
- 3 demo user accounts

---

## Step 9 — Start the Backend Server

```bash
npm run dev
```

Expected output:
```
Server running on port 3001
Database connected
```

Keep this terminal open. The backend runs on `http://localhost:3001`.

---

## Step 10 — Start the Frontend

Open a **second terminal window**:

```bash
cd /path/to/pharma/poc-pharma-risk
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser. You should see the **Pharmacy Risk Assessment Generator** UI.

---

## Step 11 — Verify Everything Works

### Quick backend smoke test (optional):

```bash
# Health check
curl http://localhost:3001/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

```bash
# Ingredient search
curl "http://localhost:3001/api/ingredients/search?q=progesterone"

# Expected: JSON array with Progesterone — nioshTable: "TABLE_2"
```

### Frontend test:

1. Open `http://localhost:5173` — you should see the **Formulation Library** (dashboard) as the home screen
2. Click **"+ New Formulation"** to open the MFR form
3. Click the **"Progesterone Supp"** example button (at bottom, under "Or try an example:") — form fills automatically
4. Click **"Generate Risk Assessment"**
5. Expected result: **Risk Level B**, chemo-rated gloves, mechanical ventilation required; assessment shows "✓ Saved · v1" if backend is connected
6. Click **"← Back to Form"** (returns to Formulation Library) — Progesterone card should appear
7. To test other levels: **+ New Formulation** → **"Testosterone Gel"** → expect **Level C**; **"Hydrocortisone Cream"** → expect **Level A**

If all three return the correct levels, the backend rule engine, database, and frontend are all connected and working correctly.

---

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| pharmacist@demo.com | demo123 | PHARMACIST |
| supervisor@demo.com | demo123 | SUPERVISOR |
| admin@demo.com | demo123 | ADMIN |

---

## Refresh Live Data (optional)

The database was seeded with data fetched on February 17, 2026. To re-fetch fresh data from NIOSH, PubChem, and Health Canada:

```bash
cd 03_Build/server
npm run fetch:all    # downloads fresh data → JSON files
npm run db:seed      # reloads JSON into PostgreSQL
```

Run this quarterly or whenever NIOSH publishes an updated hazardous drug list.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `zsh: command not found: brew` | Homebrew not installed | Follow Step 1 |
| `zsh: command not found: createdb` | PostgreSQL bin path not in PATH | Follow Step 3 (add `/opt/homebrew/opt/postgresql@15/bin` to PATH) |
| `P1010: User was denied access` | `DATABASE_URL` uses `postgres` user which doesn't exist on Homebrew | Change to your macOS username, remove password — see Step 6 |
| `Could not load formulations: Invalid or expired token` | Stale JWT in localStorage | DevTools → Application → Local Storage → remove `pharma_token`, then refresh |
| `P1001: Can't reach database server` | PostgreSQL not running | Run `brew services start postgresql@15` |
| `ECONNREFUSED` in browser console | Backend server not running | Start with `npm run dev` in `03_Build/server/` |
| Frontend shows "demo mode" banner | Backend unreachable or wrong port | Confirm backend is on 3001, check `VITE_API_URL` in `03_Build/poc-pharma-risk/.env` |

---

## Stopping the Servers

```bash
# Stop backend: Ctrl+C in the server terminal
# Stop frontend: Ctrl+C in the frontend terminal

# Stop PostgreSQL (if you want to free resources)
brew services stop postgresql@15
```

To restart later, just run `brew services start postgresql@15` and then `npm run dev` in both `03_Build/server/` and `03_Build/poc-pharma-risk/` (or from repo root: `npm run dev:backend` and `npm run dev:frontend`).

---

**Last Updated**: February 17, 2026  
**Verified On**: macOS 15.7.3 (arm64) — Apple Silicon  
**Author**: Setup session documentation
