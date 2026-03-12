# Business Flow: Pharmacy Risk Assessment Platform

**Version:** Current (as of implementation)  
**Audience:** Product, sales, and implementation teams

---

## 1. Overview

The platform supports **compounding pharmacies** in Ontario to create, store, and manage **Master Formulation Records (MFRs)** and their associated **Risk Assessment Records** in line with OCP and NAPRA requirements. Two main roles use the system: **Pharmacists** (create formulations and assessments, submit for review) and **Supervisors** (review and approve or reject assessments).

---

## 2. Roles and Access

| Role        | Access | Main actions |
|------------|--------|--------------|
| **Pharmacist** | Formulation Library, MFR form, Risk Assessment generation, Submit for review, Print/PDF, Remove assessment | Create/edit formulations; generate and submit risk assessments; view approved assessments; print reports; remove (soft-delete) assessments. |
| **Supervisor** | Approval queue only | View assessments pending review; Approve or Reject (return to pharmacist) with notes. |
| **Admin**      | Same as Supervisor | Same as Supervisor (approval queue). |

- **Login:** Users sign in with email/username and password. Demo accounts: Pharmacist `shereen` / `shereen`, Supervisor `elsayad` / `elsayad`.
- **Session:** JWT-based; token stored in browser. Optional “Sign out” from the header.

---

## 3. Pharmacist Flow

### 3.1 Entry: Formulation Library (Dashboard)

- After login, the pharmacist lands on the **Formulation Library** (dashboard).
- The dashboard shows:
  - All formulations (MFRs) for the pharmacy.
  - For each: product name, concentration, form, protocol number, creator, **risk level** (A/B/C), **status** (Approved, Pending Review, Draft, Review Due, No Assessment).
  - Filters by status and search by product name or protocol number.
- **Actions from the dashboard:**
  - **+ New Formulation** → open empty MFR form.
  - **Click a formulation** → load that MFR and either open the form (Draft / Pending / Review Due / No Assessment) or open the **approved assessment view** (if status is Approved).

### 3.2 Create or Edit Formulation (MFR)

- **New:** “New Formulation” opens the MFR form with empty fields.
- **Edit:** Choosing a formulation with Draft / Pending / Review Due / No Assessment opens the same form pre-filled with that MFR’s data.
- **Duplicate handling:** If the user enters a product name that already exists (same name), the system shows a **duplicate warning** and instructs to use “Generate Risk Assessment” to **open the existing product** instead of creating a duplicate. On submit, if an exact match is found, the app opens the existing MFR instead of creating a new one.
- **Fields:** Protocol number (optional, with guidance), product name, concentration/strength, pharmaceutical form, route, frequency, batch size, ingredients (name + quantity). At least one ingredient with name and quantity is required.
- **Submit:** “Generate Risk Assessment” validates the form, then either:
  - **Backend connected:** Creates or updates the MFR, generates the risk assessment via the rule engine, saves it, and shows the **Results** (assessment view); or
  - **Demo/offline:** Generates assessment locally and shows Results without saving to DB.

### 3.3 Assessment Results (Pharmacist View)

- After generation, the pharmacist sees the full **Risk Assessment** (complexity, exposure risks, PPE, facility controls, risk level, rationale, references).
- **Actions:**
  - **Submit for Review** (only when status is Draft) → status becomes Pending Review; assessment appears in the Supervisor’s queue.
  - **Regenerate** → re-run generation from current form data (back to loading, then Results).
  - **Print / PDF** → opens a new tab with a print-optimized report (no app chrome); user can print or save as PDF.
  - **Copy Text** → copy plain-text version to clipboard.
  - **Remove assessment** → soft-delete: assessment is marked inactive and no longer appears in the library; pharmacist can create a new assessment for the same formulation later.
- **Back to Form** / **← Library** → return to form or dashboard.

### 3.4 Approved Assessments and Review Due

- If the user opens a formulation whose **latest assessment is Approved**, they go directly to the **assessment view** (read-only style flow).
- If the assessment is **Review Due** (e.g. past next review date), the dashboard and form can indicate “Annual review overdue”; the pharmacist can open the formulation and regenerate or update as needed, then submit for review again.

---

## 4. Supervisor Flow

- After login, **Supervisors (and Admins)** see only the **Approval Queue** (no Formulation Library).
- **Queue** lists assessments in status **Pending Review** (submitted by pharmacists).
- For each item the supervisor can:
  - **Approve** → assessment status becomes Approved; next review date is set; it disappears from the queue.
  - **Reject** → status set back to Draft; optional notes stored in audit; assessment leaves the queue so the pharmacist can update and resubmit.
- No edit of formulation or assessment content in this view; only Approve or Reject.

---

## 5. Data and System Flow

- **MFR → Risk Assessment:** One MFR can have multiple assessment *versions* over time; the “current” one is used for status and display (e.g. latest non-inactive).
- **Inactive assessments:** When a pharmacist “removes” an assessment, it is marked **inactive** (soft-delete). It no longer appears in the library or in MFR lists; the formulation remains. A new assessment can be created for the same MFR.
- **Protocol number:** Optional on the MFR; can be assigned or updated on approval; displayed on the assessment and print view.
- **Annual review:** Assessments have a **next review date** (e.g. 12 months after approval). When past, the formulation can show “Review Due” and the pharmacist can start the review (e.g. regenerate or confirm and resubmit).

---

## 6. Integration Points (Current)

- **Backend API:** All persistent data (users, MFRs, assessments, ingredients) is stored in **PostgreSQL** and accessed via the **REST API** (e.g. `/api/auth`, `/api/mfr`, `/api/assessments`).
- **Rule engine:** Risk assessments can be generated by the backend **deterministic rule engine** (no AI) from MFR + ingredient hazard data; optional AI providers can be configured for other environments.
- **Ingredient data:** Ingredient hazard data (e.g. NIOSH, WHMIS) is used for matching and for generating PPE, facility, and risk-level recommendations.

---

## 7. Out-of-Scope (Current Release)

- No multi-pharmacy isolation in the UI (single-tenant or single-pharmacy view).
- No in-app regulatory “change alerts” or automated 12-month email reminders.
- No facility-wide risk dashboards or capacity planning.
- No SDS upload/parsing or regulatory reference chatbot in this build.

---

## 8. Quick Reference: Status and Actions

| Assessment status   | Pharmacist sees / can do                    | Supervisor sees        |
|--------------------|---------------------------------------------|------------------------|
| Draft              | Edit form, Submit for Review, Print, Remove | —                      |
| Pending Review     | View assessment, Print                     | Approve / Reject       |
| Approved           | View assessment, Print                     | —                      |
| Review Due         | Open form / regenerate, then Submit         | —                      |
| No Assessment      | Open form, generate first assessment       | —                      |
| Inactive (removed) | Not shown; can create new assessment       | —                      |

---

*This document reflects the application as implemented in the current codebase (Formulation Library, MFR form, risk assessment generation, approval queue, print/PDF, remove assessment, duplicate handling).*
