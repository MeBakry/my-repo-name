# Document Generation Agent

## Role
Create professional, regulation-compliant documentation for pharmacy compounding operations, including risk assessments, Master Formulation Records, reports, and audit trails.

## Core Responsibilities
1. Generate OCP-compliant Risk Assessment PDFs
2. Format Master Formulation Records
3. Create inspection-ready compliance reports
4. Generate audit trails and version histories
5. Produce training documentation
6. Export data for regulatory submissions
7. Maintain consistent branding and formatting
8. Support multiple output formats (PDF, Word, Excel, JSON)

## Document Templates

### 1. Risk Assessment Record (PDF)
**Template**: Ontario College of Pharmacists Non-Sterile Risk Assessment Template (Dec 2025)

**Layout**:
```
┌─────────────────────────────────────────────┐
│ PHARMACY LOGO & NAME                        │
│ Risk Assessment Record                      │
│ Pharmacy Compounding of Non-Sterile         │
│ Preparations                                │
├─────────────────────────────────────────────┤
│ Product Name: _______________               │
│ Concentration: _______________              │
│ Protocol Number: _______________            │
│ Assessment Date: _______________            │
├─────────────────────────────────────────────┤
│ SECTION 1: INGREDIENT HAZARD ANALYSIS       │
│                                             │
│ Consider active pharmaceutical ingredients  │
│ (APIs) and attach Safety Data Sheets (SDSs) │
│                                             │
│ [TABLE]                                     │
│ API | DIN | SDS | Manufacturer             │
│ ... | ... | ☑   | ...                      │
│                                             │
│ [For each API:]                             │
│ Description (as per Section 2 of SDS):      │
│ [Auto-populated hazard statements]          │
│                                             │
│ NIOSH Classification?                       │
│ ☑ Yes  ☐ No                                │
│ ☑ Table 1  ☑ Table 2                       │
│                                             │
│ Is this toxic to reproduction?              │
│ ☑ Yes  ☐ No                                │
│                                             │
│ Product monograph contraindications,        │
│ warnings, or precautions?                   │
│ [Auto-populated from monograph]             │
│                                             │
│ WHMIS Health Hazard?                        │
│ ☑ Yes  ☐ No                                │
│ [List hazard pictograms and statements]     │
├─────────────────────────────────────────────┤
│ SECTION 2: COMPLEXITY & FREQUENCY           │
│                                             │
│ Complexity of this compound (as per USP 795)│
│ ☐ Simple  ☑ Moderate  ☐ Complex            │
│                                             │
│ Is this compound only prepared occasionally?│
│ ☑ Yes  ☐ No                                │
│ Describe how often: [Weekly, ~4 batches/mo] │
│                                             │
│ Are there only small quantities of          │
│ ingredients being prepared?                 │
│ ☑ Yes  ☐ No                                │
│ On average, what quantity: [30 units/batch] │
│                                             │
│ Do the concentration of ingredients present │
│ a health risk to the compounder?            │
│ ☑ Yes  ☐ No                                │
│                                             │
│ Physical characteristics:                   │
│ ☐ Liquid  ☐ Volatile Liquid                │
│ ☐ Semi-Solid  ☐ Solid  ☑ Powder            │
│ ☐ Cream/Ointment                            │
├─────────────────────────────────────────────┤
│ SECTION 3: FACILITY & CONTROLS              │
│                                             │
│ Does preparation require special education  │
│ or competencies?                            │
│ ☑ Yes  ☐ No                                │
│ [If yes, describe:]                         │
│ Hazardous drug handling certification req'd │
│                                             │
│ Do you have appropriate facilities and      │
│ equipment?                                  │
│ ☑ Yes  ☐ No                                │
│                                             │
│ Are there verification steps during         │
│ compounding?                                │
│ ☑ Yes  ☐ No                                │
│                                             │
│ Is ventilation required for preparation?    │
│ SDS: ☑ Yes  ☐ No                           │
│ Product monograph: ☑ Yes  ☐ No             │
│                                             │
│ Is your workflow uninterrupted?             │
│ ☑ Yes  ☐ No                                │
│                                             │
│ Is there a risk of microbial contamination? │
│ ☐ Yes  ☑ No                                │
│                                             │
│ Is there risk of cross contamination?       │
│ ☑ Yes  ☐ No                                │
├─────────────────────────────────────────────┤
│ SECTION 4: EXPOSURE RISK & PPE              │
│                                             │
│ Exposure risk to compounding personnel      │
│ (as per section 2 of the SDS):              │
│ Skin: ☑ Yes  ☐ No                          │
│ Eye: ☑ Yes  ☐ No                           │
│ Inhalation: ☑ Yes  ☐ No                    │
│ Oral: ☐ Yes  ☑ No                          │
│                                             │
│ Exposure risk (as per product monograph):   │
│ Skin: ☑ Yes  ☐ No                          │
│ Eye: ☐ Yes  ☑ No                           │
│ Inhalation: ☑ Yes  ☐ No                    │
│ Oral: ☐ Yes  ☑ No                          │
│                                             │
│ Personal Protective Equipment (PPE) deemed  │
│ necessary:                                  │
│                                             │
│ Gloves:                                     │
│ ☐ Regular  ☑ Chemotherapy  ☐ Double gloves │
│                                             │
│ Compounding jacket/gown:                    │
│ ☐ Designated jacket  ☑ Disposable gown     │
│                                             │
│ Mask:                                       │
│ ☑ Yes  ☐ No    Type: [N95 respirator]      │
│                                             │
│ Eye protection:                             │
│ ☑ Yes  ☐ No                                │
│                                             │
│ Other PPE necessary:                        │
│ ☑ Head/hair covers  ☐ Shoe covers          │
│                                             │
│ Is an eye wash station required?            │
│ ☑ Yes  ☐ No                                │
│                                             │
│ Is a safety shower required?                │
│ ☐ Yes  ☑ No                                │
├─────────────────────────────────────────────┤
│ SECTION 5: RISK LEVEL ASSIGNMENT            │
│                                             │
│ Risk level assigned:                        │
│ ☐ Level A  ☑ Level B  ☐ Level C            │
│                                             │
│ Rationale and other risk mitigation         │
│ measures:                                   │
│                                             │
│ [Auto-generated comprehensive rationale]    │
│                                             │
│ This preparation contains progesterone, a   │
│ NIOSH Table 2 hazardous drug with          │
│ reproductive toxicity concerns (GHS         │
│ Category 1A). The compound is prepared      │
│ weekly in small batches (~30 suppositories),│
│ meeting the criteria for "occasional small  │
│ quantity." Adequate engineering controls    │
│ are in place (local exhaust ventilation),   │
│ and hazardous drug PPE protocol is strictly │
│ followed. Level B is appropriate given the  │
│ low frequency, controlled environment, and  │
│ robust risk mitigation measures. Staff have │
│ completed hazardous drug handling           │
│ certification (renewed annually).           │
│                                             │
│ Risk mitigation hierarchy implemented:      │
│ - Engineering: Local exhaust ventilation    │
│ - Administrative: Dedicated compounding     │
│   area, hazardous drug SOP, spill kit       │
│ - PPE: Chemotherapy gloves, disposable gown,│
│   N95 mask, safety glasses, hair covers     │
│                                             │
│ Cumulative facility risk reviewed: This is  │
│ 1 of 8 NIOSH drugs compounded at this       │
│ facility, totaling ~6 hours/week of         │
│ hazardous drug handling. Facility Level B   │
│ designation remains appropriate.            │
├─────────────────────────────────────────────┤
│ APPROVALS & SIGNATURES                      │
│                                             │
│ Compounding Supervisor Signature:           │
│ [Digital signature]                         │
│                                             │
│ Name: Dr. Jane Smith, PharmD                │
│ Date: February 16, 2026                     │
│                                             │
│ Next Review Due: February 16, 2027          │
├─────────────────────────────────────────────┤
│ FOOTER                                      │
│ Document ID: RA-2026-047                    │
│ Version: 1.0                                │
│ Page 1 of 3                                 │
│ Updated December 2025 (OCP Template)        │
└─────────────────────────────────────────────┘
```

**Dynamic Content Population**:
- Pharmacy name/logo from facility profile
- Product details from linked MFR
- Ingredient hazard data from Ingredient Hazard Database
- Checkboxes auto-filled based on agent analysis
- Rationale auto-generated with comprehensive reasoning
- Signature block with digital signature integration
- Footer with document tracking info

**PDF Generation Specifications**:
- Paper size: Letter (8.5" x 11")
- Margins: 0.75" all sides
- Font: Arial 10pt (body), 12pt (headings)
- Checkboxes: Unicode ☐ ☑ or custom PDF form fields
- Page numbers: Bottom right
- Watermark: "DRAFT" until supervisor signs
- Security: Password-protected PDF option for sensitive data
- Accessibility: PDF/UA compliant (screen reader compatible)

### 2. Master Formulation Record (PDF)
**Template**: OCP Master Formulation Record Template (Sept 2022)

**Sections**:
1. Header (product name, protocol number, concentration, dates)
2. Formula table (ingredients, quantities, physical description, DIN/CAS, lot, expiry)
3. Calculations and measurements notes
4. Required equipment list
5. Compounding method (step-by-step)
6. Quality controls
7. Packaging specifications
8. Stability and storage
9. Labelling (sample label + patient label)
10. Training requirements
11. References consulted
12. Preparation date sheet history
13. Revision log

**Format**: Multi-page PDF with form fields

### 3. Compliance Summary Report (PDF)
**For**: Inspections, audits, management review

**Sections**:
- Executive Summary (compliance %, key metrics)
- Risk Assessment Inventory (table of all active assessments)
- Review Status Dashboard (visual charts)
- Hazardous Drugs List (NIOSH drugs compounded)
- Cumulative Risk Analysis
- Regulatory Updates Log
- Version History Summary
- Training Records Summary
- Appendices (detailed listings)

**Format**: Professional multi-page PDF with charts/graphs

### 4. Audit Trail Report (PDF/Excel)
**For**: Regulatory compliance, internal audits

**Includes**:
- Chronological log of all changes
- User actions (who, what, when)
- Version comparisons (old vs. new values)
- Signature log with timestamps
- Document access log
- Failed login attempts (security)
- Data export events

**Format**: Searchable PDF or Excel workbook

### 5. Training Certificate (PDF)
**For**: Staff training documentation

**Includes**:
- Trainee name and registration number
- Training topic (e.g., "Hazardous Drug Handling")
- Date completed
- Trainer/supervisor signature
- Expiry date (if applicable)
- Link to training materials version

**Format**: Single-page printable certificate

## Document Generation API

### Generate Risk Assessment PDF
```
POST /api/documents/generate/risk-assessment

Request Body:
{
  "assessment_id": "uuid",
  "format": "pdf",
  "include_sds_attachments": true,
  "watermark": "draft",
  "password_protect": false
}

Response:
{
  "document_id": "uuid",
  "filename": "RA-2026-047_Progesterone_400mg_Supp.pdf",
  "file_size_bytes": 245678,
  "download_url": "https://...",
  "expires_at": "2026-02-17T12:00:00Z"
}
```

### Generate Compliance Report
```
POST /api/documents/generate/compliance-report

Request Body:
{
  "facility_id": "uuid",
  "report_type": "inspection_ready",
  "date_range": {
    "start": "2025-02-01",
    "end": "2026-02-16"
  },
  "include_appendices": true,
  "format": "pdf"
}

Response:
{
  "document_id": "uuid",
  "filename": "Compliance_Report_Feb2026.pdf",
  "file_size_bytes": 1245678,
  "download_url": "https://...",
  "expires_at": "2026-02-17T12:00:00Z"
}
```

### Batch Export
```
POST /api/documents/batch-export

Request Body:
{
  "export_type": "all_active_assessments",
  "format": "zip_of_pdfs",
  "facility_id": "uuid"
}

Response:
{
  "export_id": "uuid",
  "status": "processing",
  "estimated_completion": "2026-02-16T20:15:00Z",
  "file_count": 127
}

GET /api/documents/batch-export/{export_id}/status
→ {"status": "complete", "download_url": "https://..."}
```

## Formatting Standards

### Typography
- **Headings**: Arial Bold, 14pt
- **Subheadings**: Arial Bold, 12pt
- **Body text**: Arial Regular, 10pt
- **Fine print**: Arial Regular, 8pt (footer, references)
- **Monospace**: Courier New 9pt (IDs, codes)

### Colors (Branded)
- **Primary**: Pharmacy brand color (configurable)
- **Headers**: Dark blue (#003366)
- **Risk Level A**: Green (#28a745)
- **Risk Level B**: Yellow/Orange (#ffc107)
- **Risk Level C**: Red (#dc3545)
- **NIOSH Badge**: Purple (#6f42c1)
- **Overdue Alert**: Red (#dc3545)

### Layout
- **Line spacing**: 1.15
- **Section spacing**: 0.5" before major sections
- **Table borders**: 1pt solid gray
- **Checkbox alignment**: Baseline aligned with label text
- **Logo placement**: Top left, max height 1"

### Watermarks
- **DRAFT**: Diagonal gray text, 50% opacity, "DRAFT" repeating
- **CONFIDENTIAL**: Header/footer, red text
- **ARCHIVED**: Diagonal gray, 30% opacity
- **EXPIRED**: Red diagonal, 70% opacity

## Digital Signature Integration

### Signature Workflow
1. User clicks "Sign" button in app
2. Authentication challenge (password, 2FA, or biometric)
3. Document hash (SHA-256) calculated
4. Signature block generated with:
   - Signer name and role
   - Timestamp (ISO 8601 with timezone)
   - Digital signature graphic (PNG overlay)
   - Certificate ID (if using PKI)
5. PDF tagged with signature metadata
6. Original unsigned version archived
7. Signature recorded in audit log

### Signature Appearance
```
[Signature graphic or typed name]
________________________________
Dr. Jane Smith, PharmD
Compounding Supervisor
Signed: February 16, 2026 at 10:43 AM EST
Certificate ID: CS-2026-001
```

### Validation
- Verify signature hasn't been tampered (hash check)
- Verify signer has appropriate role permissions
- Verify timestamp is within acceptable range
- Display signature validation status in viewer

## Version Control in Documents

### Version Numbering
- **Major version**: Substantive change (e.g., risk level change) → 1.0, 2.0, 3.0
- **Minor version**: Clarifications, typo fixes → 1.1, 1.2, 1.3
- **Draft versions**: 1.0-draft1, 1.0-draft2 (not officially released)

### Version Watermark
On non-current versions, add watermark:
```
ARCHIVED VERSION
This is Version 1.0 dated Feb 16, 2025
Current version is 2.0 dated Feb 16, 2026
```

### Version Comparison View
Generate side-by-side PDF showing:
- Old version (left column)
- New version (right column)
- Highlighted changes (yellow background)
- Change annotations (margin notes)

## Export Formats

### PDF (Primary)
- Compliance documents, risk assessments, certificates
- Archival quality (PDF/A-1b compliant)
- Embedded fonts for consistency
- Bookmarks for navigation (multi-page docs)

### Word/DOCX (Editable Templates)
- For pharmacies that want to customize templates
- Preserve formatting with styles
- Include field codes for dynamic content

### Excel/XLSX (Data Reports)
- Audit trails, inventory lists, compliance tracking
- Formatted tables with filters
- Formulas for calculations
- Charts/graphs embedded

### JSON (API Integration)
- Structured data export for third-party systems
- Quality management system (QMS) integration
- Electronic health records (EHR) integration

### CSV (Simple Data)
- Ingredient lists, assessment inventories
- Bulk import/export
- Compatible with all spreadsheet software

## Branding & Customization

### Pharmacy Branding
- Upload logo (PNG, max 200KB)
- Configure primary brand color
- Customize header/footer text
- Add pharmacy contact info (address, phone, license number)

### Multi-Facility Support
- Each facility has its own branding profile
- Documents auto-branded based on facility
- Centralized management for pharmacy chains

## Performance Optimization

### Generation Speed
- Target: <5 seconds for single risk assessment PDF
- Target: <60 seconds for full compliance report (100+ pages)
- Use background jobs for batch exports

### Caching
- Cache common template components (headers, footers, logos)
- Cache ingredient hazard data lookups
- Invalidate cache on data updates

### Storage
- Store generated PDFs in cloud storage (S3, Azure Blob)
- Expire temporary download links after 24 hours
- Archive old versions to cold storage after 2 years

## Integration Points
- **Input from**: Risk Assessment Generator Agent (assessment data)
- **Input from**: Compliance Tracker Agent (compliance reports, audit trails)
- **Input from**: Ingredient Hazard Database Agent (hazard data for display)
- **Output to**: Cloud storage (S3, Azure)
- **Output to**: Email service (send documents to users)
- **Output to**: Electronic signature service (DocuSign, Adobe Sign integration)

## Quality Checks
Before generating final document:
- [ ] All required fields populated
- [ ] No "undefined" or "null" values displayed
- [ ] Checkboxes aligned and rendered correctly
- [ ] Tables fit within page margins (no cutoff)
- [ ] Page breaks logical (no orphaned headers)
- [ ] Signature blocks properly formatted
- [ ] Document ID and version correct
- [ ] Footer info accurate
- [ ] PDF/A compliant (for archival)
- [ ] Accessible (screen reader compatible)
