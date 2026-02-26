# Ingredient Hazard Database Agent

## Role
Maintain and query comprehensive chemical hazard information for pharmaceutical ingredients used in compounding preparations.

## Core Responsibilities
1. Store and update ingredient hazard profiles
2. Query NIOSH hazardous drug classifications
3. Parse Safety Data Sheets (SDS)
4. Extract product monograph safety data
5. Maintain WHMIS/GHS hazard classifications
6. Flag reproductive toxicity and carcinogenicity
7. Provide real-time ingredient lookup
8. Alert when regulatory lists are updated

## Data Sources to Integrate

### Primary Regulatory Sources
1. **NIOSH List of Hazardous Drugs in Healthcare Settings**
   - URL: https://www.cdc.gov/niosh/topics/hazdrug/
   - Update frequency: Annually or as revised
   - Classifications: Table 1 (antineoplastic), Table 2 (non-antineoplastic), Table 3 (reproductive risk)
   
2. **Health Canada Drug Product Database (DPD)**
   - URL: https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/drug-product-database.html
   - Contains: DINs, product monographs, therapeutic classifications
   
3. **WHMIS/GHS Hazard Classifications**
   - Globally Harmonized System (GHS) pictograms and categories
   - Health hazards: acute toxicity, reproductive toxicity, carcinogenicity, etc.

4. **Safety Data Sheets (SDS) Repositories**
   - Manufacturer-specific SDS documents
   - Key sections: Section 2 (Hazard Identification), Section 8 (Exposure Controls)

5. **USP Reference Standards**
   - Official monographs for pharmaceutical ingredients
   - Purity standards and handling requirements

### Supplementary Sources
6. **PubChem Database**
   - URL: https://pubchem.ncbi.nlm.nih.gov/
   - Chemical structures, CAS numbers, toxicity data
   
7. **TOXNET (if still available) / EPA Databases**
   - Environmental toxicity data
   - Carcinogenicity classifications

8. **Pharmaceutical Compounding Literature**
   - Remington: The Science and Practice of Pharmacy
   - USP Compounding Compendium
   - ASHP publications on hazardous drugs

## Database Schema

### Ingredient Master Table
```
ingredient_id (UUID, primary key)
ingredient_name (text, indexed)
cas_number (text, unique)
synonyms (array of text)
molecular_formula (text)
molecular_weight (decimal)
physical_form (enum: solid, liquid, powder, volatile_liquid, semi_solid)
created_at (timestamp)
updated_at (timestamp)
data_version (integer)
```

### NIOSH Classification Table
```
ingredient_id (foreign key)
niosh_table (enum: table_1, table_2, table_3, none)
classification_date (date)
classification_rationale (text)
meets_niosh_criteria (boolean)
source_document_url (text)
last_verified (date)
```

### Hazard Profile Table
```
ingredient_id (foreign key)
reproductive_toxicity (boolean)
ghs_reproductive_category (enum: 1A, 1B, 2, none)
carcinogenicity (boolean)
ghs_carcinogenicity_category (enum: 1A, 1B, 2, none)
mutagenicity (boolean)
acute_toxicity_oral (enum: category_1, category_2, category_3, category_4, none)
acute_toxicity_dermal (enum: category_1, category_2, category_3, category_4, none)
acute_toxicity_inhalation (enum: category_1, category_2, category_3, category_4, none)
skin_corrosion (boolean)
skin_irritation (boolean)
eye_damage (boolean)
eye_irritation (boolean)
respiratory_sensitization (boolean)
skin_sensitization (boolean)
target_organ_toxicity (text)
```

### WHMIS/GHS Hazard Table
```
ingredient_id (foreign key)
pictogram (array: flame, skull_crossbones, corrosion, exclamation, health_hazard, etc.)
signal_word (enum: danger, warning, none)
hazard_statements (array of text) -- e.g., H350 "May cause cancer"
precautionary_statements (array of text) -- e.g., P201 "Obtain special instructions"
```

### SDS Information Table
```
sds_id (UUID, primary key)
ingredient_id (foreign key)
manufacturer (text)
sds_date (date)
sds_version (text)
sds_document_url (text)
section_2_hazards (text) -- Hazard identification
section_8_exposure_controls (text) -- PPE and ventilation requirements
ventilation_required (boolean)
ventilation_type (enum: local_exhaust, mechanical, general, none)
recommended_ppe_gloves (text)
recommended_ppe_respiratory (text)
recommended_ppe_eye (text)
recommended_ppe_skin (text)
emergency_eyewash_required (boolean)
emergency_shower_required (boolean)
exposure_limits_ppm (decimal)
exposure_limits_mgm3 (decimal)
```

### Product Monograph Table
```
monograph_id (UUID, primary key)
ingredient_id (foreign key)
din (text, indexed)
brand_name (text)
manufacturer (text)
therapeutic_class (text)
monograph_date (date)
contraindications (text)
warnings (text)
precautions (text)
pregnancy_category (text)
lactation_risk (text)
handling_precautions (text)
document_url (text)
```

### Compounding Recommendations Table
```
ingredient_id (foreign key)
recommended_facility_level (enum: A, B, C)
recommended_ppe (jsonb) -- structured PPE recommendations
ventilation_requirement (text)
special_handling_notes (text)
incompatibilities (array of ingredient_ids)
stability_concerns (text)
storage_requirements (text)
```

## Query API Endpoints

### 1. Lookup Ingredient by Name
```
GET /api/ingredients/search?name={ingredient_name}

Response:
{
  "ingredient_id": "uuid",
  "name": "Progesterone",
  "cas_number": "57-83-0",
  "physical_form": "powder",
  "niosh_classification": "table_2",
  "reproductive_toxicity": true,
  "ghs_reproductive_category": "1A",
  "ventilation_required": true,
  "recommended_facility_level": "B_or_C"
}
```

### 2. Get Complete Hazard Profile
```
GET /api/ingredients/{ingredient_id}/hazard-profile

Response:
{
  "ingredient": {...},
  "niosh": {...},
  "hazards": {...},
  "whmis_ghs": {...},
  "sds": [{...}, {...}],
  "monographs": [{...}, {...}],
  "recommendations": {...}
}
```

### 3. Batch Lookup (for MFR with multiple APIs)
```
POST /api/ingredients/batch-lookup
Body: {
  "ingredients": [
    {"name": "Progesterone", "concentration": "400mg"},
    {"name": "Witepsol base", "concentration": "qs"}
  ]
}

Response: {
  "results": [
    {"ingredient": "Progesterone", "hazard_level": "high", ...},
    {"ingredient": "Witepsol base", "hazard_level": "low", ...}
  ],
  "overall_risk": "high"
}
```

### 4. Check for Updates
```
GET /api/ingredients/{ingredient_id}/updates?since={date}

Response: {
  "has_updates": true,
  "changes": [
    {"field": "niosh_classification", "old": "none", "new": "table_2", "date": "2025-12-01"},
    {"field": "reproductive_toxicity", "old": false, "new": true, "date": "2025-12-01"}
  ],
  "affected_preparations": 47
}
```

### 5. NIOSH List Query
```
GET /api/niosh/table/{table_number}

Response: {
  "table": "table_2",
  "description": "Non-antineoplastic drugs that meet NIOSH criteria",
  "ingredients": [
    {"name": "Progesterone", "cas": "57-83-0", "criteria": "reproductive_toxicity"},
    ...
  ],
  "last_updated": "2024-09-01"
}
```

## Data Maintenance Workflows

### Automated Updates
1. **NIOSH List Monitoring**
   - Check CDC website monthly for updates
   - Parse new NIOSH list when released
   - Flag ingredients moved between tables
   - Notify affected pharmacies

2. **SDS Expiration Tracking**
   - Alert when SDS >3 years old
   - Prompt for updated SDS upload
   - Validate SDS format and completeness

3. **Regulatory Change Alerts**
   - Monitor Health Canada DPD updates
   - Track GHS classification changes
   - Alert when ingredient reclassified

### Manual Data Entry
1. **New Ingredient Addition**
   - Pharmacist submits new ingredient request
   - Agent prompts for CAS number, DIN, manufacturer
   - Auto-populate from PubChem/DPD if available
   - Request SDS upload
   - Manual review before activation

2. **SDS Upload & Parsing**
   - OCR/parse PDF SDS documents
   - Extract key sections (2, 8, 11)
   - Validate completeness
   - Flag missing information
   - Store original PDF + parsed data

3. **Quality Assurance**
   - Flag incomplete records
   - Require supervisor review for high-risk additions
   - Cross-reference multiple sources
   - Validate CAS numbers against PubChem

## AI-Powered Features

### 1. Intelligent SDS Parsing
Use NLP to extract from SDS PDFs:
- Hazard statements from Section 2
- PPE recommendations from Section 8
- Ventilation requirements
- Emergency equipment needs
- Exposure limits

### 2. Smart Search
- Fuzzy matching for misspelled ingredient names
- Synonym recognition (e.g., "Vitamin E" → "Tocopherol")
- CAS number lookup
- DIN lookup

### 3. Hazard Prediction
For ingredients without complete data:
- Predict hazard profile based on chemical structure similarity
- Flag for manual review
- Suggest "assume higher risk until verified"

### 4. Cumulative Risk Analysis
- Aggregate exposure across all preparations using an ingredient
- Calculate total annual handling hours
- Identify facility-wide high-risk ingredients
- Recommend facility-level controls

### 5. Incompatibility Alerts
- Flag known incompatibilities between ingredients
- Warn about storage conflicts
- Suggest separation requirements

## Integration Points
- **Called by**: Risk Assessment Generator Agent
- **Updates to**: Compliance Tracker Agent (when ingredient data changes)
- **Notifies**: All pharmacies using affected ingredients when hazard data updates
- **Imports from**: External regulatory databases (NIOSH, Health Canada, PubChem)

## Quality Metrics
- Data completeness score per ingredient (target: >95%)
- SDS currency (target: <2 years old)
- NIOSH verification frequency (target: quarterly)
- Response time for queries (target: <100ms)
- Update propagation time (target: <24 hours)

## User Interface Components
1. **Ingredient Search Bar** with autocomplete
2. **Hazard Profile Card** with visual indicators (red/yellow/green)
3. **NIOSH Badge** showing table classification
4. **SDS Quick View** with key sections highlighted
5. **Update Notifications** banner when ingredient data changes
6. **Bulk Import Tool** for uploading ingredient lists
7. **Data Quality Dashboard** showing completeness metrics
