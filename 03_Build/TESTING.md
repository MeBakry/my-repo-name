# Testing Guide

**Platform**: Pharmacy Compounding Compliance Platform  
**Last Updated**: February 2026  
**Phase**: 2 — Development Build (Dashboard + Formulation Library)

---

## Overview

Testing for this platform is split into two layers:

| Layer | What It Tests | Tool | Status |
|-------|--------------|------|--------|
| **Backend API** | All 21 endpoints, rule engine logic, auth, DB queries | curl / Postman | Manual (automated pending) |
| **Frontend (Dev Build)** | Formulation Library, MFR form, autocomplete, assessment display | Browser | Phase 1 + Phase 2 test cases |

The rule engine is **deterministic** — the same input always produces the same output. This makes manual testing reliable and repeatable without needing a mocking framework.

---

## Environment Setup Before Testing

Both servers must be running before any tests.

### Terminal 1 — Backend

```bash
cd /path/to/pharma/server
# Real command for this project:
cd /Users/mbakr/Public/Mine/pharma/server
npm run dev
```

Expected:
```
Server running on port 3001
Database connected
```

### Terminal 2 — Frontend

```bash
cd /path/to/pharma/poc-pharma-risk
# Real command for this project:
cd /Users/mbakr/Public/Mine/pharma/poc-pharma-risk
npm run dev
```

Expected:
```
VITE v5.x  ready
➜  Local:   http://localhost:5173/
```

### Verify both are up

```bash
curl http://localhost:3001/api/health
# {"status":"ok","timestamp":"..."}
```

Open `http://localhost:5173` in your browser. You should see the **Formulation Library** (dashboard) as the home screen, with:
- Header: "Pharmacy Risk Assessment" with flask icon and "Dev" badge
- Status badge: "Connecting..." then "Connected · Saving" (or "Demo mode" if backend is down)
- "**+ New Formulation**" button (top right) to create a new formulation
- Either a list of saved formulations (if any exist) or an empty state with "No formulations yet"

---

## Part 1 — Backend API Tests

Run these with `curl` in a third terminal or import into Postman.

---

### 1.1 Health Check

```bash
curl http://localhost:3001/api/health
```

**Expected:**
```json
{ "status": "ok", "timestamp": "2026-02-17T..." }
```

---

### 1.2 Authentication

**Login as pharmacist:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pharmacist@demo.com","password":"demo123"}'
```

**Expected:** JSON with `token` field. Copy this token — you need it for authenticated endpoints.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "pharmacist@demo.com",
    "role": "PHARMACIST"
  }
}
```

**Set the token as a variable** (replace `YOUR_TOKEN` in all subsequent curl commands):

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Get current user:**

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** User object with pharmacy relationship.

---

### 1.3 Ingredient Database

**List all ingredients (paginated):**

```bash
curl "http://localhost:3001/api/ingredients?page=1&limit=10"
```

**Expected:** Array of 10 ingredients with total count. Confirm total is 116.

**Search (autocomplete):**

```bash
curl "http://localhost:3001/api/ingredients/search?q=progesterone"
```

**Expected:** Array containing Progesterone with `nioshTable: "TABLE_2"`.

```bash
curl "http://localhost:3001/api/ingredients/search?q=testosterone"
```

**Expected:** Testosterone with `nioshTable: "TABLE_2"`.

```bash
curl "http://localhost:3001/api/ingredients/search?q=hydrocortisone"
```

**Expected:** Hydrocortisone with `nioshTable: "NONE"`.

**Filter by NIOSH table:**

```bash
curl "http://localhost:3001/api/ingredients?niosh=TABLE_1"
```

**Expected:** Only Table 1 (antineoplastic) ingredients.

**Database statistics:**

```bash
curl http://localhost:3001/api/ingredients/stats/summary
```

**Expected:**
```json
{
  "total": 116,
  "nioshBreakdown": {
    "TABLE_1": ...,
    "TABLE_2": ...,
    "NONE": ...
  }
}
```

---

### 1.4 Risk Assessment — Generate Preview (no auth required)

This is the core test. The `generate-preview` endpoint runs the full rule engine without saving to the database.

**Test A — Progesterone Suppository (expect Level B):**

```bash
curl -X POST http://localhost:3001/api/assessments/generate-preview \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Progesterone 400mg Suppository",
    "concentration": "400mg",
    "form": "Suppository",
    "route": "Rectal",
    "frequency": "Weekly",
    "batchSize": 30,
    "ingredients": [
      { "name": "Progesterone", "quantity": "400mg" },
      { "name": "Witepsol H15", "quantity": "qs to 2g" }
    ]
  }'
```

**Expected:**
```json
{
  "riskLevel": "B",
  "complexityLevel": "MODERATE",
  "recommendedPPE": {
    "gloves": "CHEMOTHERAPY_RATED",
    "respiratory": "N95",
    ...
  },
  "rationale": "..."
}
```

**Test B — Testosterone Gel (expect Level C):**

```bash
curl -X POST http://localhost:3001/api/assessments/generate-preview \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Testosterone 50mg/mL Gel",
    "concentration": "50mg/mL",
    "form": "Gel",
    "route": "Topical",
    "frequency": "Daily",
    "batchSize": 50,
    "ingredients": [
      { "name": "Testosterone", "quantity": "50mg/mL" },
      { "name": "PLO Gel Base", "quantity": "qs to 1mL" }
    ]
  }'
```

**Expected:** `"riskLevel": "C"` (daily frequency + NIOSH Table 2 pushes to Level C)

**Test C — Hydrocortisone Cream (expect Level A):**

```bash
curl -X POST http://localhost:3001/api/assessments/generate-preview \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Hydrocortisone 1% Cream",
    "concentration": "1%",
    "form": "Cream",
    "route": "Topical",
    "frequency": "Daily",
    "batchSize": 100,
    "ingredients": [
      { "name": "Hydrocortisone", "quantity": "1g per 100g" },
      { "name": "Cream Base", "quantity": "qs to 100g" }
    ]
  }'
```

**Expected:** `"riskLevel": "A"` (non-NIOSH, standard steroid)

---

### 1.5 Master Formulation Records (auth required)

**Create an MFR:**

```bash
curl -X POST http://localhost:3001/api/mfr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "productName": "Progesterone 400mg Suppository",
    "concentration": "400mg",
    "form": "Suppository",
    "route": "Rectal",
    "frequency": "Weekly",
    "batchSize": 30,
    "compoundingMethod": "Melt Witepsol H15, incorporate Progesterone, pour into molds",
    "ingredients": [
      { "ingredientName": "Progesterone", "quantity": "400mg", "isActiveIngredient": true },
      { "ingredientName": "Witepsol H15", "quantity": "qs to 2g", "isActiveIngredient": false }
    ]
  }'
```

**Expected:** Created MFR object with `id`. Save the MFR `id` for the next test.

**List MFRs:**

```bash
curl http://localhost:3001/api/mfr \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Array containing the MFR you just created.

---

### 1.6 Risk Assessment — Full Workflow (auth required)

Using the MFR `id` from step 1.5:

```bash
MFR_ID="the-uuid-from-step-1.5"

# Generate and save an assessment
curl -X POST http://localhost:3001/api/assessments/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"mfrId\": \"$MFR_ID\"}"
```

**Expected:** Full assessment object with `id` and `status: "DRAFT"`. Save the assessment `id`.

**Submit for review:**

```bash
ASSESSMENT_ID="the-uuid-from-above"

curl -X PUT http://localhost:3001/api/assessments/$ASSESSMENT_ID/submit \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Assessment status changes to `"PENDING_REVIEW"`.

**Approve (must use supervisor account):**

```bash
# Login as supervisor first
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supervisor@demo.com","password":"demo123"}'

SUPERVISOR_TOKEN="the-supervisor-jwt-token"

curl -X PUT http://localhost:3001/api/assessments/$ASSESSMENT_ID/approve \
  -H "Authorization: Bearer $SUPERVISOR_TOKEN"
```

**Expected:** Status changes to `"APPROVED"`, `approvedAt` and `nextReviewDate` (+ 12 months) are set.

**Verify audit trail:**

```bash
curl http://localhost:3001/api/assessments/$ASSESSMENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Assessment with nested `auditLogs` array showing GENERATED → SUBMITTED → APPROVED entries.

---

### 1.7 Role Enforcement Tests

**Try to approve as pharmacist (should fail):**

```bash
curl -X PUT http://localhost:3001/api/assessments/$ASSESSMENT_ID/approve \
  -H "Authorization: Bearer $TOKEN"
  # (pharmacist token, not supervisor)
```

**Expected:** `403 Forbidden`

**Try to update ingredient as non-admin (should fail):**

```bash
curl -X PUT http://localhost:3001/api/ingredients/some-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nioshTable":"TABLE_1"}'
```

**Expected:** `403 Forbidden`

**Access protected route without token:**

```bash
curl http://localhost:3001/api/mfr
```

**Expected:** `401 Unauthorized`

---

## Part 2 — Frontend Manual Test Cases

**Environment**: `http://localhost:5173` | Backend running on port 3001 | Chrome/Firefox/Safari  
**Mode**: Dev build. The frontend auto-logs in with `pharmacist@demo.com` and uses the backend when available. If you see "Invalid or expired token", clear `localStorage` (DevTools → Application → remove `pharma_token`) and refresh.

**Navigation flow:**
- **Home screen** = Formulation Library (dashboard) — lists all saved formulations
- **+ New Formulation** = opens the MFR form (example buttons at bottom)
- **← Library** / **← Back to Form** = returns to the dashboard

---

### TC-01: App Loads Correctly

1. Open `http://localhost:5173`

**Expected:**
- [ ] Header: "Pharmacy Risk Assessment" with flask icon and "Dev" badge
- [ ] Status badge: "Connecting..." then "Connected · Saving" (or "Demo mode" if backend is down)
- [ ] **Formulation Library** as home screen (dashboard)
- [ ] "+ New Formulation" button visible (top right)
- [ ] Either formulation cards (if any saved) or "No formulations yet" empty state
- [ ] No red errors in browser DevTools Console tab
- [ ] If you see "Could not load formulations: Invalid or expired token" → clear `localStorage` (DevTools → Application → Local Storage → remove `pharma_token`), then refresh

---

### TC-02: Form Validation — Empty Submit

1. Click "+ New Formulation"
2. Leave all fields empty
3. Click "Generate Risk Assessment"

**Expected:**
- [ ] Form does NOT submit
- [ ] Red error text under: Product Name, Concentration, Pharmaceutical Form, Route, Frequency, Batch Size
- [ ] Error under Ingredients: "at least one ingredient required"
- [ ] No network request made (check DevTools → Network tab)

---

### TC-03: Form Validation — Partial Fill

1. Click "+ New Formulation"
2. Enter "Test Product" in Product Name, enter "100" in Concentration value and select "mg"
3. Leave all other fields empty
4. Click "Generate Risk Assessment"

**Expected:**
- [ ] Product Name and Concentration do NOT show errors
- [ ] Errors appear only on unfilled required fields
- [ ] Ingredient error still shows

---

### TC-04 / TC-05 / TC-06: Ingredient Autocomplete

1. Click "+ New Formulation" to open the form

**Search:**
1. Click Ingredient 1 name field, type "pro"
- [ ] Dropdown appears with "Progesterone" showing a red "NIOSH TABLE 2" badge

**Selection:**
1. Click "Progesterone" in the dropdown
- [ ] Field shows "Progesterone", green border, green "DB" badge
- [ ] Dropdown closes

**Keyboard navigation:**
1. Type "test" in the field
2. Press Down Arrow → highlights "Testosterone"
3. Press Enter → selects it
- [ ] "Testosterone" selected with green border and "DB" badge

---

### TC-07: Add / Remove Ingredients

1. Click "+ New Formulation"
2. Click "+ Add Another Ingredient"
   - [ ] Third row appears labeled "Ingredient 3"
3. Click "x" on Ingredient 3
   - [ ] Row is removed
4. Reduce to 1 ingredient row
   - [ ] Last row has no "x" button (cannot remove the only ingredient)

---

### TC-08 to TC-10: Progesterone Suppository — Primary Test

1. Click "+ New Formulation"
2. Click "Progesterone Supp" example button (at bottom of form, under "Or try an example:")

**Form auto-fills:**
- [ ] Product Name: "Progesterone 400mg Suppository"
- [ ] Concentration: "400" (value) + "mg" (unit), Form: "Suppository", Route: "Rectal"
- [ ] Frequency: "Weekly", Batch Size: "30"
- [ ] Ingredient 1: "Progesterone" (green DB badge)
- [ ] Ingredient 2: "Witepsol H15" (green DB badge)

2. Click "Generate Risk Assessment"

**Loading screen:**
- [ ] Spinner visible, step messages animate, progress bar fills

**Assessment result:**
- [ ] Progesterone card: red border, NIOSH TABLE 2, reproductive toxicity YES
- [ ] Witepsol H15 card: green border, NIOSH None, no hazards
- [ ] Complexity: Moderate
- [ ] Exposure risks: Skin YES, Inhalation YES
- [ ] PPE: Chemotherapy-rated gloves, N95, disposable gown, safety glasses
- [ ] **Risk Level: LEVEL B** (yellow/amber badge)
- [ ] Rationale references OCP, NIOSH, USP
- [ ] Disclaimer banner at bottom

---

### TC-11: Hydrocortisone Cream (expect Level A)

1. From the assessment results, click "← Back to Form" (returns to Formulation Library / Dashboard)
2. Click "+ New Formulation"
3. Click "Hydrocortisone Cream" example button → Generate

**Expected:**
- [ ] Both ingredient cards: green border
- [ ] **Risk Level: LEVEL A** (green badge)
- [ ] PPE: Regular nitrile gloves (not chemo-rated)
- [ ] No N95 required

---

### TC-12: Testosterone Gel (expect Level C)

1. Click "← Back to Form" (returns to Dashboard)
2. Click "+ New Formulation"
3. Click "Testosterone Gel" example button → Generate

**Expected:**
- [ ] Testosterone card: red border, NIOSH TABLE 2
- [ ] **Risk Level: LEVEL C** (red badge) — daily frequency disqualifies "occasional small quantity"
- [ ] PPE: Double chemo gloves or chemo-rated, N95, full gown
- [ ] Engineering controls: BSC or CVE recommended

---

### TC-13: Zinc Oxide Ointment (expect Level A)

1. Click "← Back to Form" (returns to Dashboard)
2. Click "+ New Formulation"
3. Click "Zinc Oxide Ointment" example button → Generate

**Expected:**
- [ ] Both cards: green border
- [ ] **Risk Level: LEVEL A** (green badge)
- [ ] Respiratory: dust mask only (Zinc Oxide is a powder)

---

### TC-14: Copy to Clipboard

1. From any completed assessment, click "Copy Text"
- [ ] Button briefly shows "Copied!"
2. Paste into a text editor
- [ ] Full plain-text assessment with all sections

---

### TC-15: Back Button Preserves Form Data

1. Generate any assessment (you are on the Results screen)
2. Click "← Back to Form" (returns to Formulation Library / Dashboard)
3. Click the same formulation card in the library (if it was saved) OR "+ New Formulation" and re-enter

**Note:** The Back button now returns to the Dashboard. If you generated and saved an MFR, it appears as a card; clicking it opens the pre-filled form. For unsaved previews, you must re-enter data via "+ New Formulation".

---

### TC-16: Backend Fallback to Demo Mode

1. Stop the backend server (Ctrl+C in server terminal)
2. Reload `http://localhost:5173`
3. Status badge should show "Demo mode"; Dashboard shows "Demo mode — Connect to the backend to see your saved formulations"
4. Click "+ New Formulation", fill form, generate

**Expected:**
- [ ] Status badge reads "Demo mode"
- [ ] Dashboard shows demo notice (library empty)
- [ ] Form still works; assessment generates from local rule engine fallback
5. Restart the backend → reload → badge shows "Connected · Saving", formulations load

---

### TC-17: Manual Entry — Custom Formulation

1. Click "+ New Formulation"
2. Manually type in all form fields:
   - Product Name: "Estradiol 0.1% Vaginal Cream"
   - Concentration: value "0.1", unit "%" | Form: "Cream" | Route: "Vaginal"
   - Frequency: "2-3x/week" | Batch Size: "40"
   - Ingredient 1: type "estr" → select "Estradiol" → Quantity: "0.1g per 100g"
   - Ingredient 2: type "cream" → select any base → Quantity: "qs to 100g"
3. Click "Generate Risk Assessment"

**Expected:**
- [ ] Autocomplete works for both ingredients
- [ ] Estradiol: NIOSH Table 2, reproductive toxicity
- [ ] Risk Level: LEVEL B

---

## Test Results Summary

| # | Test Case | Pass / Fail | Notes |
|---|-----------|-------------|-------|
| API-1 | Health check | | |
| API-2 | Login + JWT | | |
| API-3 | Ingredient search (progesterone) | | |
| API-4 | Generate preview — Level B (Progesterone) | | |
| API-5 | Generate preview — Level C (Testosterone) | | |
| API-6 | Generate preview — Level A (Hydrocortisone) | | |
| API-7 | MFR create + list | | |
| API-8 | Full assessment workflow (draft → submit → approve) | | |
| API-9 | Audit trail after approval | | |
| API-10 | Role enforcement (403 on pharmacist approve) | | |
| TC-01 | App loads, no console errors | | |
| TC-02 | Empty form validation | | |
| TC-03 | Partial form validation | | |
| TC-04/05/06 | Autocomplete search, select, keyboard | | |
| TC-07 | Add / remove ingredient rows | | |
| TC-08/09/10 | Progesterone example → Level B | | |
| TC-11 | Hydrocortisone → Level A | | |
| TC-12 | Testosterone → Level C | | |
| TC-13 | Zinc Oxide → Level A | | |
| TC-14 | Copy to clipboard | | |
| TC-15 | Back button preserves data | | |
| TC-16 | Backend fallback to demo mode | | |
| TC-17 | Manual entry (Estradiol) | | |

**Total: ___ / 23 passed (Phase 1 cases)**

---

## Phase 2 Test Cases — Formulation Library Dashboard

These test cases cover the new Dashboard (Formulation Library) home screen and the business flow for re-encountering a previously saved formulation.

### Prerequisites
- Backend running:
  - `cd /Users/mbakr/Public/Mine/pharma/server && npm run dev`
- Frontend running:
  - `cd /Users/mbakr/Public/Mine/pharma/poc-pharma-risk && npm run dev`
- Database seeded: `cd /Users/mbakr/Public/Mine/pharma/server && npm run seed`
- At least one MFR saved from a previous session, OR run the Phase 1 tests first to create one

---

### TC-D01: Dashboard loads as home screen

**Objective:** Confirm the app opens to the library, not a blank form.

**Steps:**
1. Open `http://localhost:5173`
2. Wait for the "Connecting..." badge to change

**Expected:**
- Badge reads "Connected · Saving"
- The main content area shows "Formulation Library" heading
- "+ New Formulation" button is visible in the top right

---

### TC-D02: Dashboard lists saved formulations

**Objective:** Saved MFRs are visible on the dashboard after logging in.

**Steps:**
1. Ensure at least one MFR has been created (run Phase 1 TC-09 first if needed)
2. Open `http://localhost:5173`

**Expected:**
- Cards for each saved MFR appear
- Each card shows: product name, concentration, pharmaceutical form, risk level badge (A/B/C), status badge

---

### TC-D03: Status badge is correct

**Objective:** Status badges reflect the actual state in the database.

**Steps:**
1. Create a new MFR via "+ New Formulation" and submit
2. Return to the dashboard (click "← Library")

**Expected:**
- The newly submitted MFR card shows "Draft" (since no supervisor has approved it yet)

---

### TC-D04: Clicking an Approved formulation shows saved assessment directly

**Objective:** Approved formulations load the saved result — no re-generation needed.

**Steps:**
1. Using the backend API or supervisor account, approve an assessment:
   ```bash
   # First get the assessment ID:
   curl -H "Authorization: Bearer $SUPERVISOR_TOKEN" http://localhost:3001/api/assessments
   # Then approve it:
   curl -X PUT -H "Authorization: Bearer $SUPERVISOR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"notes":"Reviewed and approved"}' \
     http://localhost:3001/api/assessments/<assessment_id>/approve
   ```
2. Return to the dashboard
3. Click the now-Approved formulation card

**Expected:**
- Badge on card reads "✓ Approved"
- Clicking opens the Results screen with the saved assessment data
- Assessment shows "✓ Saved" indicator with version number
- No spinner/loading that would indicate re-generation

---

### TC-D05: Clicking a Draft formulation opens the pre-filled form

**Objective:** Draft MFRs re-open the form with existing data, not a blank form.

**Steps:**
1. Create a new MFR and generate an assessment (it will be in DRAFT status)
2. Go back to dashboard
3. Click the Draft card

**Expected:**
- Form screen appears with "Continue Assessment" heading
- Blue info banner: "This formulation has an unfinished assessment..."
- All fields pre-filled: product name, concentration value + unit, form, route, frequency, batch size, ingredients (with names and quantities)
- You can submit again to regenerate

---

### TC-D06: Re-encountering a product you forgot you had

**Objective:** This is the core business scenario — system prevents accidental duplicates.

**Steps:**
1. Ensure "Testosterone 50mg/mL Gel" already exists in the library (from a previous submission)
2. Click "+ New Formulation" to start a blank form
3. Slowly type "Testosterone" in the Product Name field
4. Wait 500ms (the duplicate check debounce)

**Expected:**
- A yellow/orange warning banner appears below the product name field
- Banner lists: "Testosterone 50mg/mL Gel — 1 assessment(s) on record"
- Banner includes hint: "You can still generate a new assessment — it will be saved as a new version"
- A dismiss (×) button is available
- The form is NOT blocked — the pharmacist can still proceed if this is genuinely a new variant

---

### TC-D07: Annual Review flow for an overdue assessment

**Objective:** Expired formulations open pre-filled with a clear review warning.

**Steps:**
1. Simulate an overdue assessment by manually updating `nextReviewDate` in the database:
   ```bash
   psql pharma_compliance -c "UPDATE risk_assessment_records SET next_review_date = '2024-01-01', status = 'APPROVED' WHERE id = '<id>';"
   ```
2. Refresh the dashboard

**Expected:**
- The affected card shows "⚠ Review Due" badge in red
- Card shows "⚠ Annual review overdue since 2024-01-01" sub-text
- Action hint reads "Start Review →"
- Clicking the card opens the form with:
  - "Annual Review" heading
  - Red banner: "This assessment is overdue for its annual review..."
  - All fields pre-filled with the existing formulation data

---

### TC-D08: Dashboard search

**Objective:** The search field filters MFRs by name or protocol number.

**Steps:**
1. Ensure at least 3 different MFRs exist
2. Type part of one product name in the search field

**Expected:**
- Only MFRs matching the search text are shown in the list
- Clearing the search restores all results

---

### TC-D09: Dashboard stat buttons filter the list

**Objective:** Clicking a stat badge (e.g. "2 Draft") filters the list to that status.

**Steps:**
1. Ensure MFRs in multiple states exist
2. Click the "Draft" stat button

**Expected:**
- Only Draft MFRs are shown
- The clicked stat button shows an "active" visual state (blue border)
- Clicking it again (or clicking "× Clear filter") restores all results

---

### TC-D10: Demo mode shows correct state

**Objective:** When backend is unavailable, the dashboard gracefully degrades.

**Steps:**
1. Stop the backend (`Ctrl+C` in the server terminal)
2. Open (or refresh) `http://localhost:5173`

**Expected:**
- Status badge reads "Demo mode"
- Dashboard shows "Demo mode — Connect to the backend to see your saved formulations" notice
- "+ New Formulation" button still works and allows form entry
- Submitting generates a local preview (offline rule engine fallback)

---

### TC-D11: New formulation end-to-end → appears on dashboard

**Objective:** Full happy path — create, generate, save, verify on dashboard.

**Steps:**
1. Click "+ New Formulation"
2. Fill in: Protocol "NS-NEW-01", Product "Ketoprofen 10% Gel", Concentration 10/%, Form Gel, Route Topical, Frequency Weekly, Batch 50
3. Add ingredient: Ketoprofen / 10g per 100g
4. Add ingredient: PLO Gel Base / qs to 100g
5. Click "Generate Risk Assessment →"
6. View the results (should show "✓ Saved · v1")
7. Click "← Library"

**Expected:**
- Dashboard shows "Ketoprofen 10% Gel" card
- Card shows risk level badge (likely A or B based on NIOSH data)
- Card shows "Draft" status badge
- Card shows "NS-NEW-01" protocol badge in meta row

---

## Backend Test — MFR List includes Latest Assessment

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pharmacist@demo.com","password":"demo123"}' \
  | jq -r '.token')

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/mfr | jq '.[0].assessments'
```

**Expected response (first MFR's latest assessment):**
```json
[
  {
    "id": "...",
    "version": 1,
    "riskLevel": "B",
    "status": "DRAFT",
    "generatedAt": "2026-02-17T...",
    "nextReviewDate": null
  }
]
```

This confirms the backend change that makes the dashboard status badges work.

---

## Phase 2 Test Checklist

| TC | Description | Pass | Notes |
|----|-------------|------|-------|
| TC-D01 | Dashboard as home screen | | |
| TC-D02 | Saved formulations listed | | |
| TC-D03 | Status badge correct (Draft after generation) | | |
| TC-D04 | Approved formulation → view saved assessment | | |
| TC-D05 | Draft formulation → pre-filled form | | |
| TC-D06 | Duplicate warning on new form | | |
| TC-D07 | Annual review flow (overdue) | | |
| TC-D08 | Dashboard search | | |
| TC-D09 | Stat button filtering | | |
| TC-D10 | Demo mode graceful degradation | | |
| TC-D11 | New formulation full end-to-end | | |
| Backend | MFR list includes latest assessment | | |

**Total: ___ / 12 passed (Phase 2 cases)**

---

## What Is Not Yet Tested (Phase 3+)

| Feature | Why Not Tested Now |
|---------|-------------------|
| PDF export | Document generation agent not yet implemented |
| 12-month review reminders | Compliance tracker not yet implemented |
| Email notifications | Not yet implemented |
| Multi-pharmacy isolation | Only one demo pharmacy in seed data |
| Automated API tests (Jest/Supertest) | Marked as pending |
| Performance / load testing | Phase 3+ |
| Supervisor approval queue UI | Backend supports it, UI not built yet |
| Assessment version history view | Not yet implemented |

---

**Tester:** _______________  
**Date:** _______________  
**Environment:** macOS, Chrome, localhost  
**Backend version:** Phase 2 — February 2026
