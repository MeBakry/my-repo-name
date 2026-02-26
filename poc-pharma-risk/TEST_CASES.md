# PoC Test Cases - Pharmacy Risk Assessment Generator

**Tester:** _______________  
**Date:** _______________  
**Environment:** localhost:5173 (Vite dev server) + backend on localhost:3001  
**Browser:** Chrome / Firefox / Safari (desktop)

> **Note:** The full testing guide including backend API tests is in `docs/TESTING.md`.
> This file covers frontend UI tests only.

---

## Pre-Test Setup

1. Start the backend server (Terminal 1):
   ```bash
   cd server && npm run dev
   # Should show: Server running on port 3001
   ```
2. Start the frontend (Terminal 2):
   ```bash
   cd poc-pharma-risk && npm run dev
   ```
3. Open `http://localhost:5173` in your browser
4. Confirm no "demo mode" banner is visible (backend is connected)

---

## TC-01: App Loads Correctly

**Steps:**
1. Open `http://localhost:5173`

**Expected Results:**
- [ ] Header shows "Pharmacy Risk Assessment Generator" with a flask icon and "PoC" badge
- [ ] MFR input form is displayed with all fields empty
- [ ] Footer is visible at the bottom
- [ ] Four example buttons appear below the form: "Progesterone Supp", "Testosterone Gel", "Hydrocortisone Cream", "Zinc Oxide Ointment"
- [ ] No console errors in browser DevTools

---

## TC-02: Form Validation - Empty Submit

**Steps:**
1. Leave all form fields empty
2. Click "Generate Risk Assessment"

**Expected Results:**
- [ ] Form does NOT submit
- [ ] Red error text appears under each required field: Product Name, Concentration, Pharmaceutical Form, Route, Frequency, Batch Size
- [ ] Error text appears under Ingredients saying at least one is required
- [ ] No API call is made (check Network tab)

---

## TC-03: Form Validation - Partial Fill

**Steps:**
1. Enter "Test Product" in Product Name
2. Enter "100mg" in Concentration
3. Leave Pharmaceutical Form, Route, Frequency, and Batch Size empty
4. Click "Generate Risk Assessment"

**Expected Results:**
- [ ] Form does NOT submit
- [ ] Error text appears only under the unfilled required fields
- [ ] Product Name and Concentration fields do NOT show errors
- [ ] Ingredient error still shows (none added yet)

---

## TC-04: Ingredient Autocomplete - Search

**Steps:**
1. Click on the Ingredient 1 name field
2. Type "pro"

**Expected Results:**
- [ ] Dropdown appears below the input
- [ ] Shows "Progesterone" with a red "NIOSH TABLE 2" badge
- [ ] May also show "Prednisone", "Prednisolone" if they match
- [ ] Each non-hazardous item shows a green "Non-hazardous" badge

---

## TC-05: Ingredient Autocomplete - Selection

**Steps:**
1. In the Ingredient 1 name field, type "pro"
2. Click on "Progesterone" in the dropdown

**Expected Results:**
- [ ] Input field now shows "Progesterone"
- [ ] Input field border turns green
- [ ] A green "DB" badge appears inside the input (indicating database match)
- [ ] Dropdown closes

---

## TC-06: Ingredient Autocomplete - Keyboard Navigation

**Steps:**
1. In the Ingredient 1 name field, type "test"
2. Press the Down Arrow key to highlight "Testosterone"
3. Press Enter

**Expected Results:**
- [ ] "Testosterone" is highlighted in the dropdown on Arrow Down
- [ ] Pressing Enter selects it and closes the dropdown
- [ ] Input shows "Testosterone" with green border and "DB" badge

---

## TC-07: Add / Remove Ingredients

**Steps:**
1. Notice the form starts with 2 ingredient rows (Ingredient 1, Ingredient 2)
2. Click "+ Add Another Ingredient"
3. Verify a 3rd row appears
4. Click the "x" button on Ingredient 3

**Expected Results:**
- [ ] Third ingredient row appears labeled "Ingredient 3"
- [ ] Clicking "x" removes that row
- [ ] Cannot remove the last remaining ingredient row (no "x" on the final one if only 1 left)

---

## TC-08: Example Button - Progesterone Suppository

**Steps:**
1. Click the "Progesterone Supp" example button below the form

**Expected Results:**
- [ ] Product Name: "Progesterone 400mg Suppository"
- [ ] Concentration: "400mg"
- [ ] Pharmaceutical Form: "Suppository"
- [ ] Route: "Rectal"
- [ ] Frequency: "Weekly"
- [ ] Batch Size: "30"
- [ ] Ingredient 1: "Progesterone" / "400mg per unit" (green border, DB badge)
- [ ] Ingredient 2: "Witepsol H15" / "qs to 2g" (green border, DB badge)
- [ ] Any previous validation errors are cleared

---

## TC-09: Example Button - Testosterone Gel

**Steps:**
1. Click the "Testosterone Gel" example button

**Expected Results:**
- [ ] Product Name: "Testosterone 50mg/mL Gel"
- [ ] Concentration: "50mg/mL"
- [ ] Form: "Gel", Route: "Topical"
- [ ] Frequency: "Daily", Batch Size: "50"
- [ ] Ingredient 1: "Testosterone" / "50mg/mL" (DB matched)
- [ ] Ingredient 2: "PLO Gel Base" / "qs to 1mL" (DB matched)

---

## TC-10: Generate Assessment - Progesterone (NIOSH Table 2, Weekly)

> **This is the primary demo test case.**

**Steps:**
1. Click "Progesterone Supp" example button
2. Click "Generate Risk Assessment"

**Expected Results - Loading Screen:**
- [ ] Screen transitions to loading view
- [ ] Spinner animation is visible
- [ ] Step-by-step messages animate in sequence:
  - "Analyzing ingredient hazards..."
  - "Checking NIOSH classifications..."
  - "Evaluating exposure routes..."
  - "Determining PPE requirements..."
  - etc.
- [ ] Progress bar fills gradually
- [ ] Text says "This typically takes 5-15 seconds"

**Expected Results - Assessment Screen (after 5-15 seconds):**
- [ ] Screen transitions to the Risk Assessment display
- [ ] Top toolbar shows: "Back to Form", "Regenerate", "Copy Text" buttons

**Expected Results - Header:**
- [ ] Title: "RISK ASSESSMENT RECORD"
- [ ] Product: "Progesterone 400mg Suppository 400mg Suppository"
- [ ] Generated date/time is current
- [ ] Protocol: "[Not assigned - PoC]"

**Expected Results - Ingredient Hazard Analysis:**
- [ ] Progesterone card has a red left border (hazardous)
  - [ ] NIOSH Classification: TABLE 2 - Non-antineoplastic hazardous drug
  - [ ] Reproductive Toxicity: YES (GHS Category 1A)
  - [ ] WHMIS: H360 listed
  - [ ] Ventilation Required: YES (Local Exhaust)
  - [ ] Physical Form: Powder
- [ ] Witepsol H15 card has a green left border (safe)
  - [ ] NIOSH: None
  - [ ] Reproductive Toxicity: NO
  - [ ] WHMIS: None
  - [ ] Ventilation Required: NO
  - [ ] Physical Form: Semi-Solid

**Expected Results - AI-Generated Sections:**
- [ ] **Complexity:** Should say "Moderate" (requires melting, temperature control)
- [ ] **Frequency Assessment:** Should note "occasional small quantity" = YES (weekly, 30 units)
- [ ] **Exposure Risks:** Skin YES, Eye YES, Inhalation YES, Oral LOW
- [ ] **PPE:**
  - Gloves: Chemotherapy-rated nitrile
  - Gown: Disposable hazardous drug gown
  - Respiratory: N95 respirator
  - Eye: Safety glasses or goggles required
  - Eyewash station: Required
- [ ] **Facility Controls:** Local exhaust ventilation, dedicated area, spill kit required
- [ ] **Risk Level:** LEVEL B (yellow/orange badge)
- [ ] **Rationale:** 2-3 paragraphs referencing OCP, NIOSH, USP <795>
- [ ] **References:** Lists regulatory sources (NIOSH, OCP, USP, NAPRA)
- [ ] **Disclaimer:** Yellow banner at bottom about PoC and pharmacist review

---

## TC-11: Generate Assessment - Hydrocortisone (Non-NIOSH, Daily)

**Steps:**
1. Click "Back to Form" (if on results screen)
2. Click "Hydrocortisone Cream" example button
3. Click "Generate Risk Assessment"

**Expected Results:**
- [ ] Assessment generates successfully
- [ ] Hydrocortisone card: green left border, NIOSH "None", no reproductive toxicity
- [ ] VersaBase Cream card: green left border, safe excipient
- [ ] **Risk Level: LEVEL A** (green badge)
- [ ] PPE: Regular nitrile gloves, compounding jacket (not hazardous gown)
- [ ] Respiratory: Not required or minimal
- [ ] Rationale explains low-risk justification

---

## TC-12: Generate Assessment - Testosterone (NIOSH Table 2, Daily)

**Steps:**
1. Click "Back to Form"
2. Click "Testosterone Gel" example button
3. Click "Generate Risk Assessment"

**Expected Results:**
- [ ] Assessment generates successfully
- [ ] Testosterone card: red left border, NIOSH Table 2
- [ ] **Risk Level: LEVEL B or LEVEL C** (daily frequency = may not qualify as "occasional small quantity")
- [ ] PPE: Chemotherapy-rated gloves, hazardous gown, N95
- [ ] Should mention mechanical ventilation or BSC recommended
- [ ] Rationale discusses daily frequency as a factor

---

## TC-13: Copy to Clipboard

**Steps:**
1. From any completed assessment screen, click "Copy Text"

**Expected Results:**
- [ ] Button text changes to "Copied!" briefly (about 2 seconds)
- [ ] Open a text editor and paste (Cmd+V / Ctrl+V)
- [ ] Pasted content contains the full assessment in plain text format with headers and sections

---

## TC-14: Regenerate Assessment

**Steps:**
1. From any completed assessment screen, click "Regenerate"

**Expected Results:**
- [ ] Loading screen appears again
- [ ] A new assessment is generated (content may vary slightly from the first)
- [ ] Assessment still applies to the same formulation
- [ ] Generated timestamp updates to the current time

---

## TC-15: Back Button - Form Data Preserved

**Steps:**
1. Click an example button and generate an assessment
2. From the results screen, click "Back to Form"

**Expected Results:**
- [ ] Form screen reappears
- [ ] Form is still populated with the data from the example (not cleared)
- [ ] You can immediately click "Generate Risk Assessment" again without re-entering data

---

## TC-16: Manual Entry - Custom Formulation

**Steps:**
1. Clear or refresh the form
2. Manually enter:
   - Product Name: "Estradiol 0.1% Vaginal Cream"
   - Concentration: "0.1%"
   - Form: "Cream"
   - Route: "Vaginal"
   - Ingredient 1: Type "Estr" -> select "Estradiol" from dropdown -> Quantity: "0.1g per 100g"
   - Ingredient 2: Type "Vani" -> select "Vanicream" -> Quantity: "qs to 100g"
   - Frequency: "2-3x/week"
   - Batch Size: "40"
3. Click "Generate Risk Assessment"

**Expected Results:**
- [ ] Autocomplete works for both ingredients
- [ ] Both show "DB" match indicator
- [ ] Assessment generates successfully
- [ ] Estradiol flagged as NIOSH Table 2 with reproductive toxicity
- [ ] Risk Level should be LEVEL B (NIOSH drug, but borderline occasional)
- [ ] Rationale discusses frequency interpretation for 2-3x/week

---

## TC-17: Unmatched Ingredient (Not in Database)

**Steps:**
1. In the ingredient name field, type "Triamcinolone" (not in our 30-entry DB)
2. Enter a quantity like "0.1%"

**Expected Results:**
- [ ] No autocomplete suggestions appear (or dropdown doesn't show)
- [ ] No green border or "DB" badge (ingredient is not matched)
- [ ] Form still allows submission
- [ ] If submitted, the AI assessment notes this ingredient wasn't found in the database but still generates an assessment based on the ingredient name

---

## TC-18: Error Handling - Backend Unavailable

**Steps:**
1. Stop the backend server (Ctrl+C in the server terminal)
2. Reload `http://localhost:5173`
3. Click an example button and "Generate Risk Assessment"

**Expected Results:**
- [ ] App detects backend is down and switches to demo mode
- [ ] A "demo mode" indicator or banner appears
- [ ] Assessment still generates using local 30-ingredient fallback
- [ ] App does not crash or show a blank screen

4. Restart the backend (`npm run dev` in server/) and reload the page
- [ ] Demo mode banner disappears
- [ ] App is back in backend mode

---

## TC-19: Error Handling - Malformed Request

**Steps:**
1. Open browser DevTools → Network tab
2. Generate an assessment normally
3. Inspect the POST request to `/api/assessments/generate-preview`
4. Note the request payload structure

**Expected Results:**
- [ ] Request includes productName, form, frequency, batchSize, ingredients array
- [ ] Response status is 200
- [ ] Response includes riskLevel, recommendedPPE, rationale fields

---

## TC-20: Zinc Oxide Ointment (Non-NIOSH, Minimal Risk)

**Steps:**
1. Click "Zinc Oxide Ointment" example button
2. Click "Generate Risk Assessment"

**Expected Results:**
- [ ] Both ingredients show green (safe) cards
- [ ] **Risk Level: LEVEL A** (green badge)
- [ ] PPE: Regular nitrile gloves, compounding jacket
- [ ] Respiratory: Dust mask for powder handling (Zinc Oxide is a powder)
- [ ] Rationale notes minimal hazards

---

## Results Summary

| Test Case | Description | Pass/Fail | Notes |
|-----------|-------------|-----------|-------|
| TC-01 | App loads correctly | | |
| TC-02 | Empty submit validation | | |
| TC-03 | Partial fill validation | | |
| TC-04 | Autocomplete search | | |
| TC-05 | Autocomplete selection | | |
| TC-06 | Keyboard navigation | | |
| TC-07 | Add/remove ingredients | | |
| TC-08 | Example: Progesterone | | |
| TC-09 | Example: Testosterone | | |
| TC-10 | Generate: Progesterone (NIOSH, Weekly) | | |
| TC-11 | Generate: Hydrocortisone (Non-NIOSH, Daily) | | |
| TC-12 | Generate: Testosterone (NIOSH, Daily) | | |
| TC-13 | Copy to clipboard | | |
| TC-14 | Regenerate assessment | | |
| TC-15 | Back button preserves data | | |
| TC-16 | Manual entry: Estradiol | | |
| TC-17 | Unmatched ingredient | | |
| TC-18 | Invalid API key error | | |
| TC-19 | Missing API key error | | |
| TC-20 | Generate: Zinc Oxide (minimal risk) | | |

**Overall Result:** _______ / 20 passed (Phase 1)

**Tester Signature:** _______________  
**Date:** _______________

---

## Phase 2 — Formulation Library Dashboard Tests

These cases cover the new home screen and the business flow for re-encountering a previously saved formulation.

---

### TC-D01: Dashboard loads as home screen

**Pre-condition:** Backend running, frontend running.  
**Steps:**
1. Open `http://localhost:5173`
2. Wait for header badge to update

**Expected Result:**
- Badge reads "Connected · Saving"
- Main area shows "Formulation Library" heading with "+ New Formulation" button
- NOT a blank form

**Pass / Fail:** _____

---

### TC-D02: Cards show saved formulations

**Pre-condition:** At least one MFR saved (run TC-09 or TC-D11 first).  
**Steps:** Open `http://localhost:5173`

**Expected Result:**
- MFR cards visible with: product name, concentration, form, risk level badge, status badge
- Count subtitle shows correct number of formulations

**Pass / Fail:** _____

---

### TC-D03: Duplicate warning on new form

**Pre-condition:** "Testosterone 50mg/mL Gel" exists in library.  
**Steps:**
1. Click "+ New Formulation"
2. Type "Testosterone" in Product Name field slowly
3. Wait 1 second (debounce)

**Expected Result:**
- Orange/yellow warning banner appears below the field
- Banner lists the existing Testosterone entry with assessment count
- Hint text: "You can still generate a new assessment..."
- Form is NOT blocked — user can still submit

**Pass / Fail:** _____

---

### TC-D04: Draft formulation → pre-filled form

**Pre-condition:** At least one Draft-status MFR exists.  
**Steps:**
1. On dashboard, click a card with "Draft" status badge

**Expected Result:**
- Form screen appears with heading "Continue Assessment"
- Blue banner: "This formulation has an unfinished assessment..."
- All fields pre-filled (product name, concentration, form, ingredients)
- User can submit to regenerate

**Pass / Fail:** _____

---

### TC-D05: New formulation full round-trip → appears on dashboard

**Steps:**
1. Click "+ New Formulation"
2. Fill in: Protocol "TC-D05", Product "Ketoprofen 10% Gel", Concentration 10/%, Form Gel, Route Topical, Frequency Weekly, Batch 50
3. Add ingredients: Ketoprofen / 10g per 100g; PLO Gel Base / qs to 100g
4. Click "Generate Risk Assessment →"
5. On results screen, verify "✓ Saved · v1" indicator appears
6. Click "← Library"

**Expected Result:**
- Dashboard card for "Ketoprofen 10% Gel" visible
- Shows risk level and "Draft" status badge
- Shows protocol "TC-D05" in the card meta

**Pass / Fail:** _____

---

### TC-D06: Search filters MFRs

**Pre-condition:** Multiple MFRs exist.  
**Steps:**
1. On dashboard, type part of one product name in the search input

**Expected Result:**
- List narrows to only matching entries
- Clearing search restores all results

**Pass / Fail:** _____

---

### TC-D07: Demo mode graceful degradation

**Steps:**
1. Stop the backend server
2. Refresh `http://localhost:5173`

**Expected Result:**
- Status badge reads "Demo mode"
- Dashboard shows demo-mode notice (not an error crash)
- "+ New Formulation" still works for offline preview

**Pass / Fail:** _____

---

## Phase 2 Quick Checklist

| TC | Description | Pass |
|----|-------------|------|
| TC-D01 | Dashboard as home screen | |
| TC-D02 | Cards show saved formulations | |
| TC-D03 | Duplicate warning on new form | |
| TC-D04 | Draft → pre-filled form | |
| TC-D05 | New formulation full round-trip | |
| TC-D06 | Search filters | |
| TC-D07 | Demo mode graceful degradation | |

**Phase 2 Result:** _______ / 7 passed

**Tester Signature:** _______________  
**Date:** _______________
