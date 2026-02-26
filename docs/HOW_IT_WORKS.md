# How It Works: The Platform Explained Simply

**Created**: February 17, 2026
**Purpose**: A plain-language explanation of what this platform does, where the data comes from, and why each piece matters -- written so anyone can understand it.

---

## The Two Core Documents

This entire platform revolves around two documents that every compounding pharmacy must maintain. They serve different purposes but are tightly linked.

### Master Formulation Record (MFR) -- "The Recipe"

The MFR is the recipe card for a compounded preparation. It answers:

- **What** are we making? (e.g., Progesterone 400mg suppository)
- **What goes in it?** (e.g., Progesterone powder, Witepsol H15 base)
- **How do we make it?** (e.g., Melt base at 55°C, incorporate powder, pour into mold)
- **What equipment do we need?** (e.g., Analytical balance, melting pot, suppository mold)
- **How long does it last?** (e.g., 6 months, store at room temperature)
- **Who approved this recipe?** (e.g., Dr. Jane Smith, Jan 15, 2026)

The MFR exists so that **any trained compounder can follow the recipe and produce the same result every time**. It is the operational document -- it tells staff how to DO the work.

### Risk Assessment Record -- "The Safety Analysis"

The Risk Assessment Record is the safety evaluation for that same preparation. It answers:

- **Is anything in this recipe dangerous?** (e.g., Progesterone is a NIOSH Table 2 reproductive toxin)
- **How dangerous is it to the person making it?** (e.g., Skin contact risk, inhalation risk from powder)
- **What protection do they need?** (e.g., Chemotherapy-rated gloves, disposable gown, N95 if no ventilation)
- **Is our facility adequate?** (e.g., Level B minimum, needs mechanical ventilation)
- **What could go wrong?** (e.g., Cross-contamination, microbial risk, powder aerosolization)
- **What are we doing to prevent it?** (e.g., Engineering controls first, then administrative controls, then PPE)

The Risk Assessment Record exists so that **the pharmacy can demonstrate to regulators that they have evaluated the safety of every preparation**. It is the compliance document -- it tells you how to STAY SAFE and STAY LEGAL.

### How They Connect

```
MFR (Recipe) ──triggers──> Risk Assessment (Safety Analysis)
     │                              │
     │ "I'm making this"            │ "Here's how to make it safely"
     │                              │
     └── Used by: compounder        └── Used by: supervisor, regulator, inspector
         (daily work)                   (oversight, audits, compliance)
```

Every MFR **must** have a corresponding Risk Assessment. If an inspector finds a pharmacy compounding a preparation without a Risk Assessment on file, that pharmacy is in violation and can face fines ($5,000-$50,000) or be shut down. Every Risk Assessment must also be **re-reviewed and re-signed every 12 months** to remain current.

---

## Where Does the Information Come From?

### Question: Where does the pharmacist get the safety information about an ingredient?

The pharmacist does NOT invent whether an ingredient is dangerous. They look it up from official external sources:

1. **Safety Data Sheet (SDS)** -- A document from the chemical manufacturer that ships with every ingredient. It states the specific hazards (e.g., "may cause cancer," "wear gloves," "use ventilation"). Every ingredient supplier is legally required to provide one.

2. **NIOSH List of Hazardous Drugs** -- A government list from the CDC that classifies which drugs are hazardous. For example, Progesterone is on Table 2 (non-antineoplastic hazardous drug with reproductive toxicity).

3. **Product Monograph** -- Health Canada's official document about a drug's risks, warnings, and contraindications.

4. **WHMIS/GHS Classifications** -- The standardized Canadian workplace hazard classification system with pictograms, signal words, and hazard statements.

**Without this software**, the pharmacist manually:
1. Looks up the SDS for each ingredient (digs through a binder or PDF folder)
2. Checks if the ingredient is on the NIOSH list (opens a PDF, searches through it)
3. Reads the WHMIS classification
4. Writes all of this information onto the risk assessment form by hand
5. Repeats this for every single preparation

That is where the hours go. For a pharmacy with 120 preparations, this is 120 forms filled out largely by hand, with massive duplication.

### Question: Where does the computer get this information?

When the pharmacist tells the system "I'm making Progesterone 400mg suppositories," the computer pulls from three layers of data:

**Layer 1 -- The pharmacist's own data (already entered into the system):**
- The MFR they created: product name, ingredients, concentrations, compounding method
- Their facility information: what ventilation they have, what equipment is available, what PPE is on hand

**Layer 2 -- The ingredient hazard database (pre-loaded and continuously updated):**
- The system already has hazard profiles for 200-300 common compounding ingredients
- When the pharmacist types "Progesterone," the system already knows: NIOSH Table 2, reproductive toxin, requires ventilation, needs chemotherapy-rated gloves
- This data was loaded from the official sources listed below

**Layer 3 -- External APIs queried on demand:**
- Health Canada Drug Product Database API -- to get the official Drug Identification Number (DIN) and product monograph
- PubChem API -- to get chemical properties, CAS numbers, and toxicity data for any ingredient not already in the local database

The computer is not guessing. It looks up the **same sources** the pharmacist would look up manually -- it just does it instantly and automatically.

---

## Data Sources: What Is Needed and Why

Every data source answers a different question in the risk assessment process.

| Data Source | What It Is | Why the System Needs It | How Often It Changes |
|---|---|---|---|
| **NIOSH Hazardous Drug List** | US government list classifying which drugs are hazardous (Table 1, 2, 3) | To determine if an ingredient requires special PPE, ventilation, or a higher facility level. A NIOSH Table 1 drug cannot be assigned Level A -- the system must enforce this. | Published ~annually; system checks quarterly |
| **Safety Data Sheets (SDS)** | Manufacturer documents describing chemical hazards for each specific ingredient | To identify the specific hazards of each ingredient: is it corrosive? Causes cancer? Needs ventilation? What gloves to use? This information is ingredient-specific and cannot be generalized. | Valid for 3 years; updated on user upload or when manufacturer issues a revision |
| **Health Canada DPD** | Official Canadian drug database containing Drug Identification Numbers (DINs) and product monographs | To officially identify the drug, retrieve its warnings and contraindications, and link to the official monograph for rationale documentation. | Real-time via API; database updated continuously by Health Canada |
| **OCP Standards & Templates** | Ontario College of Pharmacists regulatory requirements and official risk assessment forms | To know what format the risk assessment must follow, what fields are required, and what rules the pharmacy must comply with. This is the regulatory authority. | Variable; system checks quarterly for changes |
| **NAPRA Model Standards** | National compounding standards defining preparation complexity levels (simple, moderate, complex) | To classify a preparation's complexity, which directly affects the facility level assignment and required controls. | Revised every 2-3 years |
| **WHMIS/GHS Classifications** | Standardized Canadian workplace hazard classification system | To get standardized hazard pictograms, signal words, and hazard statements (e.g., "H350: May cause cancer") that are required on the risk assessment form. | Updated when GHS revisions are adopted; system checks quarterly |
| **PubChem (NIH)** | US National Institutes of Health chemical database | To look up CAS numbers, molecular formulas, and toxicity data for ingredients not already in the system -- especially new or rare ones. | Queried on demand via API; database updated continuously |
| **USP <795>** | United States Pharmacopeia chapter on non-sterile compounding (referenced in Canadian standards) | To apply Beyond-Use Dating guidelines, quality control requirements, and complexity definitions that OCP references. | Major revisions every 5-7 years; minor updates annually; system checks annually |
| **EPA Chemical Databases** | US Environmental Protection Agency toxicity and chemical property data | To supplement hazard data when SDS information is incomplete, and to cross-validate NIOSH classifications. | Queried on demand via API |
| **Master Formulation Records (MFRs)** | Pharmacist-created preparation recipes (internal data) | This is the starting point -- the system reads the recipe to know which ingredients to look up and what preparation is being assessed. | Updated whenever the pharmacist creates or edits a recipe |
| **Facility & Staff Data** | Pharmacy profile including ventilation, equipment, PPE inventory, staff certifications (internal data) | To determine if the pharmacy's infrastructure is adequate for the risk level of each preparation, and to track staff exposure. | Updated whenever the pharmacy's setup changes |

### Summary of Data Source Roles

In short, each source answers a different question:

- **NIOSH** answers: "Is this ingredient hazardous?"
- **SDS** answers: "How hazardous, and what specific protection is needed?"
- **OCP** answers: "What does the form look like, and what is legally required?"
- **Health Canada** answers: "What is this drug officially?"
- **NAPRA** answers: "How complex is this preparation?"
- **WHMIS/GHS** answers: "What are the standardized hazard classifications?"
- **PubChem** answers: "What is this chemical, and what are its properties?"
- **USP** answers: "What are the technical compounding standards?"
- **MFR** answers: "What are we making, and what goes into it?"
- **Facility data** answers: "Is our pharmacy equipped to handle this safely?"

---

## User Experience: The Formulation Library

When you open the app, the home screen is the **Formulation Library** — a dashboard that lists all your saved formulations. Each card shows the product name, risk level (A/B/C), and status (Approved, Draft, Review Due). You can:

- **+ New Formulation** — Start a blank form to create a new compounded product
- **Click a card** — If Approved, view the saved assessment directly; if Draft or Review Due, reopen the pre-filled form to continue or update
- **Search and filter** — Find formulations by name or protocol number; filter by status

This library-centric design prevents accidental duplicates. If you forget you already entered "Testosterone 50mg/mL Gel," you'll see it on the dashboard instead of creating a second copy. When you start typing that name on a new form, a warning banner appears listing any matching existing entries.

---

## The Workflow: From Recipe to Compliance

Here is the complete flow of how a risk assessment gets created:

```
Step 1: Pharmacist enters or imports an MFR (the recipe)
        "Progesterone 400mg Suppository = Progesterone + Witepsol H15"
                            │
                            ▼
Step 2: System reads the ingredient list and looks up each one
        ┌─────────────────────────────────────────────────┐
        │  Progesterone:                                  │
        │  - NIOSH: Table 2 (from NIOSH list)             │
        │  - Reproductive toxin (from SDS Section 11)     │
        │  - Ventilation required (from SDS Section 8)    │
        │  - Chemo-rated gloves (from SDS Section 8)      │
        │                                                 │
        │  Witepsol H15:                                  │
        │  - NIOSH: Not listed                            │
        │  - No significant hazards (from SDS)            │
        │  - Standard gloves sufficient                   │
        └─────────────────────────────────────────────────┘
                            │
                            ▼
Step 3: System evaluates complexity
        "Moderate -- multiple steps, precision required,
         suppository mold, melting and pouring"
                            │
                            ▼
Step 4: System evaluates frequency and exposure
        "Prepared 3x per week, 20 units per batch,
         ~30 minutes per session"
                            │
                            ▼
Step 5: System recommends PPE and controls
        "Chemo-rated gloves, disposable gown, N95 mask
         (or mechanical ventilation), safety glasses"
                            │
                            ▼
Step 6: System assigns facility level
        "Level B -- NIOSH Table 2 drug, reproductive toxin,
         but occasional small quantity with adequate
         engineering controls"
                            │
                            ▼
Step 7: System generates a complete risk assessment
        with rationale, references, and all required fields
        (80% pre-filled)
                            │
                            ▼
Step 8: Pharmacist reviews, adjusts if needed, and signs
        "I agree with this assessment" ──> Approved
                            │
                            ▼
Step 9: System sets 12-month review reminder
        and begins tracking compliance
```

**What used to take 45 minutes now takes 15 minutes.** The pharmacist still exercises professional judgment (Steps 8), but the system handles the repetitive lookups, cross-referencing, and form-filling (Steps 2-7).

---

## Why This Matters

The regulatory requirement is sound -- pharmacies should evaluate the safety of every preparation they make. The problem is not the thinking; the problem is the duplication.

A pharmacy compounding 120 preparations is rewriting the same ventilation standards, the same PPE logic, and the same environmental controls 120 times. When the 12-month review cycle comes, they do it all again.

This platform preserves the rigor of the assessment while eliminating the repetitive manual work. The pharmacist's expertise remains at the center -- the system simply removes the burden of looking up, cross-referencing, and transcribing the same information over and over.

---

**Last Updated**: February 2026
**Version**: 1.1
