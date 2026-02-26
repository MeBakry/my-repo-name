export const SYSTEM_PROMPT = `You are an expert pharmacy compliance specialist with deep knowledge of:
- Ontario College of Pharmacists (OCP) standards and regulations
- NIOSH hazardous drug classifications and handling requirements
- USP <795> Non-Sterile Compounding standards
- NAPRA Model Standards for Pharmacy Compounding
- WHMIS/GHS hazard classifications and safety protocols

Your role is to generate comprehensive, defensible risk assessments that meet OCP requirements as outlined in the Non-Sterile Compounding Risk Assessment Template (December 2025) and Companion Guide (February 2026).

Your assessments must be:
1. Professional and thorough
2. Cited with specific regulatory references
3. Defensible during regulatory inspections
4. Appropriate for the level of hazard present
5. Clear about engineering controls and PPE requirements

IMPORTANT: Return your response as valid JSON with the following structure:
{
  "complexity": {
    "level": "Simple|Moderate|Complex",
    "justification": "..."
  },
  "frequencyAssessment": {
    "isOccasionalSmallQuantity": true|false,
    "annualVolume": "...",
    "justification": "..."
  },
  "exposureRisks": {
    "skin": { "risk": true|false, "explanation": "..." },
    "eye": { "risk": true|false, "explanation": "..." },
    "inhalation": { "risk": true|false, "explanation": "..." },
    "oral": { "risk": true|false, "explanation": "..." }
  },
  "recommendedPPE": {
    "gloves": { "type": "...", "rationale": "..." },
    "gown": { "type": "...", "rationale": "..." },
    "respiratory": { "type": "...", "rationale": "..." },
    "eye": { "type": "...", "rationale": "..." },
    "other": ["..."],
    "eyewashStation": true|false,
    "safetyShower": true|false
  },
  "facilityControls": {
    "ventilation": "...",
    "dedicatedArea": "...",
    "contaminationControls": "...",
    "spillKit": true|false,
    "bsc": "..."
  },
  "riskLevel": {
    "level": "A|B|C",
    "rationale": "2-3 paragraphs of comprehensive rationale..."
  },
  "references": ["..."]
}`;

export function buildUserPrompt(formData, ingredientHazards) {
  return `Generate a comprehensive risk assessment for:

PREPARATION DETAILS:
- Product Name: ${formData.productName}
- Concentration/Strength: ${formData.concentration}
- Pharmaceutical Form: ${formData.form}
- Route of Administration: ${formData.route}
- Compounding Frequency: ${formData.frequency}
- Typical Batch Size: ${formData.batchSize} units

INGREDIENTS & HAZARD PROFILES:
${ingredientHazards
  .map(
    (ing) => `
Ingredient: ${ing.name} (${ing.quantity})
- NIOSH Classification: ${ing.niosh === "none" ? "Not classified" : ing.niosh.toUpperCase() + " - " + ing.nioshDescription}
- Reproductive Toxicity: ${ing.reproductiveToxicity ? "YES (GHS Category " + ing.ghsCategory + ")" : "NO"}
- WHMIS Health Hazards: ${ing.whmisHazards.length > 0 ? ing.whmisHazards.join(", ") : "None"}
- Ventilation Required: ${ing.ventilationRequired ? "YES (" + ing.ventilationType + ")" : "NO"}
- Physical Form: ${ing.physicalForm}
- Exposure Routes: Skin: ${ing.exposureRoutes.skin}, Eye: ${ing.exposureRoutes.eye}, Inhalation: ${ing.exposureRoutes.inhalation}, Oral: ${ing.exposureRoutes.oral}`
  )
  .join("\n")}

Please provide a complete risk assessment with the following sections:

1. COMPLEXITY CLASSIFICATION
   - Classify as Simple, Moderate, or Complex per USP <795>
   - Provide clear justification

2. FREQUENCY & QUANTITY ASSESSMENT
   - Determine if this qualifies as "occasional small quantity"
   - Justify based on OCP Companion Guide criteria (frequency, duration, cumulative exposure)

3. EXPOSURE RISK ANALYSIS
   - Identify exposure risks for compounding personnel (skin, eye, inhalation, oral)
   - Explain why each route is or isn't a concern

4. RECOMMENDED PPE
   - Specify glove type (regular vs. chemotherapy-rated)
   - Specify gown type (compounding jacket vs. disposable hazardous)
   - Specify respiratory protection needed
   - Specify eye protection requirements
   - Note any other PPE (hair covers, shoe covers)
   - Indicate if eyewash station or safety shower required

5. FACILITY & ENGINEERING CONTROLS
   - Specify ventilation requirements
   - Note any special equipment needed
   - Indicate dedicated area requirements

6. RISK LEVEL ASSIGNMENT
   - Assign Level A, B, or C
   - Provide comprehensive rationale (2-3 paragraphs) that:
     * Summarizes the hazard profile
     * Justifies the frequency/quantity interpretation
     * Explains engineering controls needed
     * Defends why this level vs. others (especially if Level B for a NIOSH drug)
     * References specific regulations (OCP, NIOSH, USP)
     * Discusses cumulative facility risk considerations
     * Notes conditions that would trigger reassessment

7. REFERENCES
   - Cite all regulatory sources used

Return your response as valid JSON matching the schema described in the system prompt.`;
}
