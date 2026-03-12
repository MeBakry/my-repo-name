/**
 * Risk Assessment Rule Engine
 *
 * Deterministic rule engine that generates risk assessments from:
 *   - MFR data (product name, form, concentration, ingredients, frequency, batch size)
 *   - Ingredient hazard profiles (from local database, never hits external APIs)
 *   - Regulatory rules (OCP, NAPRA, WHMIS/GHS, USP <795>)
 *
 * This is the evolved, production-ready version of the PoC demo mode.
 * No AI, no external API calls at runtime. Pure deterministic logic.
 */

// ─── Complexity Classification (NAPRA) ───────────────────────────────

const FORM_COMPLEXITY_MAP = {
  Cream: "SIMPLE",
  Ointment: "SIMPLE",
  Gel: "SIMPLE",
  Solution: "SIMPLE",
  Lotion: "SIMPLE",
  Suppository: "MODERATE",
  Capsule: "MODERATE",
  Troche: "MODERATE",
  Lozenge: "MODERATE",
  Suspension: "MODERATE",
  Paste: "MODERATE",
  Enema: "MODERATE",
  Tablet: "COMPLEX",
  Rapid_Dissolve_Tablet: "COMPLEX",
  Controlled_Release: "COMPLEX",
  Transdermal: "COMPLEX",
};

function classifyComplexity(form) {
  return FORM_COMPLEXITY_MAP[form] || "MODERATE";
}

function buildComplexityJustification(form, complexityLevel) {
  const formLower = form.toLowerCase();
  const justifications = {
    SIMPLE: `This ${formLower} preparation involves straightforward mixing and incorporation of active ingredient(s) into a commercially available base. No specialized equipment or complex techniques are required beyond standard compounding procedures. Per NAPRA Model Standards, this is classified as a Simple preparation.`,
    MODERATE: `This ${formLower} preparation requires specific technique and equipment, including precise measurements, temperature control, and careful incorporation of active ingredients. The process demands trained personnel and attention to detail. Per NAPRA Model Standards, this is classified as a Moderate complexity preparation.`,
    COMPLEX: `This ${formLower} preparation involves multiple complex steps, specialized equipment, and requires significant technical expertise. The process includes critical steps where deviations can affect final product quality. Per NAPRA Model Standards, this is classified as a Complex preparation.`,
  };
  return justifications[complexityLevel];
}

// ─── Frequency and Volume Assessment ─────────────────────────────────

const FREQUENCY_MULTIPLIERS = {
  Daily: 365,
  "2-3x/week": 130,
  Weekly: 52,
  Monthly: 12,
  Rarely: 4,
};

function assessFrequency(frequency, batchSize, hasNiosh) {
  const multiplier = FREQUENCY_MULTIPLIERS[frequency] || 52;
  const size = parseInt(batchSize) || 30;
  const annualBatches = multiplier;
  const annualUnits = annualBatches * size;
  const annualVolume = `~${annualUnits.toLocaleString()} units (${annualBatches} batches x ${size} units)`;

  const isDaily = frequency === "Daily";
  const isOccasional = !isDaily && size <= 50;

  let justification;
  if (!hasNiosh) {
    justification = `Prepared ${frequency.toLowerCase()} in batches of ${size} units, resulting in ${annualVolume} of annual production. No NIOSH-listed hazardous drugs present; frequency assessment is for documentation purposes. Standard compounding practices apply.`;
  } else if (isOccasional) {
    justification = `Prepared ${frequency.toLowerCase()} in batches of ${size} units. The cumulative annual compounding time and exposure duration meet OCP Companion Guide criteria for "occasional small quantity." The frequency and volume are within acceptable thresholds for the assigned risk level.`;
  } else {
    justification = `Prepared ${frequency.toLowerCase()} in batches of ${size} units, resulting in ${annualVolume}. This frequency does NOT qualify as "occasional small quantity" per OCP Companion Guide criteria. ${isDaily ? "Daily compounding of hazardous drugs represents sustained occupational exposure requiring the highest level of controls." : `Batch size of ${size} exceeds the guidance threshold of 50 units.`}`;
  }

  return {
    isOccasionalSmallQuantity: isOccasional && hasNiosh ? isOccasional : !hasNiosh,
    annualVolume,
    annualBatches,
    annualUnits,
    justification,
  };
}

// ─── Risk Level Determination (OCP Rules) ────────────────────────────

function determineRiskLevel(ingredientHazards, frequency, batchSize) {
  const hasTable1 = ingredientHazards.some(
    (i) => i.nioshTable === "TABLE_1"
  );
  const hasTable2 = ingredientHazards.some(
    (i) => i.nioshTable === "TABLE_2"
  );
  const hasTable3 = ingredientHazards.some(
    (i) => i.nioshTable === "TABLE_3"
  );
  const hasNiosh = hasTable1 || hasTable2 || hasTable3;
  const isDaily = frequency === "Daily";
  const size = parseInt(batchSize) || 30;

  if (hasTable1) return "C";
  if ((hasTable2 || hasTable3) && isDaily) return "C";
  if ((hasTable2 || hasTable3) && size > 50) return "C";
  if (hasTable2 || hasTable3) return "B";
  return "A";
}

function buildRiskRationale(riskLevel, ingredientHazards, formData, frequencyAssessment) {
  const ingredientNames = ingredientHazards.map((i) => i.name).join(" and ");
  const primaryIng = ingredientHazards.find(
    (i) => i.nioshTable !== "NONE"
  ) || ingredientHazards[0];
  const batchSize = parseInt(formData.batchSize) || 30;
  const levelLabels = { A: "Low", B: "Moderate", C: "High" };

  const rationales = {
    A: `This preparation is classified as Level A (${levelLabels.A} Risk) based on the absence of NIOSH-listed hazardous drugs among the ingredients and the straightforward nature of the compounding process.

The active ingredient(s) in this formulation (${ingredientNames}) are not classified on the NIOSH List of Hazardous Drugs in Healthcare Settings. While standard good compounding practices must always be observed, the ingredients do not pose significant occupational health risks beyond those inherent to any compounding activity. Standard personal protective equipment including regular nitrile gloves and a compounding jacket provide adequate protection.

General room ventilation is sufficient for this preparation. The compounding area should be clean with appropriate surfaces, but no specialized containment or engineering controls are required. A regular cleaning and maintenance schedule should be followed.

This risk level should be reassessed if the formulation changes, if new hazard information becomes available for any ingredient, or if compounding conditions change significantly. Annual review is recommended per OCP standards.`,

    B: `This preparation contains ${primaryIng.name}, a NIOSH ${primaryIng.nioshTable === "TABLE_2" ? "Table 2" : "Table 3"} hazardous drug with ${primaryIng.reproductiveToxicity ? `significant reproductive toxicity concerns (GHS Category ${primaryIng.ghsCategory || "1A"})` : "documented hazard potential"}. ${primaryIng.name} is classified as hazardous due to its documented ability to cause ${primaryIng.reproductiveToxicity ? "reproductive harm and potential endocrine disruption" : "adverse health effects with occupational exposure"}.

Despite the inherent hazards of the active ingredient, Level B classification is appropriate based on several mitigating factors. The preparation is compounded ${formData.frequency.toLowerCase()} in batches of ${batchSize} ${formData.form.toLowerCase()}s, representing ${frequencyAssessment.annualVolume}. This frequency and volume meet the Ontario College of Pharmacists' definition of "occasional small quantity" as outlined in the OCP Companion Guide (February 2026).

The facility must implement robust engineering controls and administrative safeguards to maintain Level B status. Local exhaust ventilation is mandatory during powder handling and should be verified periodically for effectiveness. The compounding area must be dedicated with cleanable, non-porous surfaces, and a documented cleaning protocol specific to hazardous drugs should be maintained. All personnel must complete hazardous drug handling training and demonstrate competency in the use of PPE.

If compounding frequency increases to daily or batch sizes exceed 50 units, reassessment for Level C designation would be warranted. Regular review of this risk assessment (annually minimum, or when practices change) ensures continued alignment with current OCP standards and NIOSH recommendations.`,

    C: `This preparation contains ${primaryIng.name}, a NIOSH ${primaryIng.nioshTable === "TABLE_1" ? "Table 1 antineoplastic" : primaryIng.nioshTable === "TABLE_2" ? "Table 2" : "Table 3"} hazardous drug with ${primaryIng.reproductiveToxicity ? `significant reproductive toxicity concerns (GHS Category ${primaryIng.ghsCategory || "1A"})` : "documented hazard potential"}.

${primaryIng.nioshTable === "TABLE_1" ? "As a NIOSH Table 1 antineoplastic drug, Level C classification is mandatory regardless of compounding frequency. These drugs require the highest level of containment due to their carcinogenic, mutagenic, and/or teratogenic properties." : `The ${formData.frequency.toLowerCase()} compounding frequency and batch size of ${batchSize} units result in substantial cumulative occupational exposure that exceeds the threshold for "occasional small quantity" under OCP guidelines.`}

Level C classification requires comprehensive controls including: a Biological Safety Cabinet (BSC) or Containment Ventilated Enclosure (CVE) for all weighing, measuring, and compounding steps; a dedicated negative-pressure compounding room with appropriate air handling; chemotherapy-rated double gloving; impervious disposable hazardous drug gowns; N95 respirators (minimum); full eye protection; and comprehensive environmental monitoring. All waste must be handled as hazardous pharmaceutical waste. Personnel must undergo initial and annual competency assessments.

This assessment should be reviewed if frequency decreases, if formulation changes, or at minimum annually per OCP standards.`,
  };

  return rationales[riskLevel];
}

// ─── Exposure Risk Analysis ──────────────────────────────────────────

function analyzeExposureRisks(ingredientHazards) {
  const hasNiosh = ingredientHazards.some(
    (i) => i.nioshTable && i.nioshTable !== "NONE"
  );
  const hasPowder = ingredientHazards.some(
    (i) => i.physicalForm === "POWDER"
  );
  const primaryIng = ingredientHazards.find(
    (i) => i.nioshTable !== "NONE"
  ) || ingredientHazards[0];

  return {
    skin: {
      risk: hasNiosh || hasPowder,
      explanation: hasNiosh
        ? `${hasPowder ? "Powder handling and" : "Ingredient handling and"} potential contact during the compounding process poses a dermal absorption risk. ${primaryIng.name} can be absorbed through intact skin.`
        : "Standard compounding practices with appropriate gloves provide adequate skin protection. No significant dermal absorption risk with these ingredients.",
    },
    eye: {
      risk: hasPowder || hasNiosh,
      explanation: hasPowder
        ? "Powder aerosolization risk during weighing and incorporation steps could result in ocular exposure. Eye protection is required."
        : "Minimal risk with semi-solid/liquid preparation. Safety glasses recommended as standard practice.",
    },
    inhalation: {
      risk: hasNiosh || hasPowder,
      explanation: hasPowder
        ? `Fine powder can become airborne during weighing and transfer without proper controls.${hasNiosh ? " Given the NIOSH classification, inhalation exposure must be minimized through engineering controls and respiratory protection." : " Dust mask recommended during powder handling."}`
        : "Minimal inhalation risk as ingredients are in semi-solid or liquid form with low vapor pressure.",
    },
    oral: {
      risk: false,
      explanation:
        "Low risk with proper hygiene practices. No eating, drinking, or applying cosmetics in the compounding area. Hand washing required before and after compounding.",
    },
  };
}

// ─── PPE Recommendation ─────────────────────────────────────────────

function recommendPPE(ingredientHazards, riskLevel) {
  const hasNiosh = ingredientHazards.some(
    (i) => i.nioshTable && i.nioshTable !== "NONE"
  );
  const hasTable1 = ingredientHazards.some(
    (i) => i.nioshTable === "TABLE_1"
  );
  const hasPowder = ingredientHazards.some(
    (i) => i.physicalForm === "POWDER"
  );

  if (hasNiosh) {
    return {
      gloves: {
        type: hasTable1
          ? "Chemotherapy-rated nitrile gloves, double gloving required"
          : "Chemotherapy-rated nitrile gloves (double gloving recommended)",
        rationale:
          "Required for NIOSH-listed drugs. Chemotherapy-rated gloves have been tested for permeation resistance against hazardous drugs per ASTM D6978.",
      },
      gown: {
        type: "Disposable hazardous drug gown",
        rationale:
          "Low-lint, impervious to powder contamination. Must be worn closed in front with long sleeves and elastic or knit cuffs.",
      },
      respiratory: {
        type:
          riskLevel === "C"
            ? "N95 respirator minimum; PAPR recommended for extended sessions"
            : "N95 respirator",
        rationale:
          "Required during powder handling and any step that may generate aerosols. Must be fit-tested per CSA Z94.4.",
      },
      eye: {
        type: "Safety glasses or goggles",
        rationale:
          "Protect against powder exposure and splash hazards during compounding.",
      },
      other: riskLevel === "C"
        ? ["Hair/head covers", "Shoe covers", "Face shield for splash risk"]
        : ["Hair/head covers"],
      eyewashStation: true,
      safetyShower: riskLevel === "C",
    };
  }

  return {
    gloves: {
      type: "Regular nitrile gloves",
      rationale:
        "Standard nitrile examination gloves provide adequate protection for non-hazardous compounding.",
    },
    gown: {
      type: "Compounding jacket or lab coat",
      rationale:
        "Clean, low-lint garment to protect clothing and minimize particulate contamination.",
    },
    respiratory: {
      type: hasPowder
        ? "Dust mask during powder handling"
        : "Not required",
      rationale: hasPowder
        ? "Simple dust mask (surgical mask) is sufficient during powder weighing and mixing to reduce particulate inhalation."
        : "No significant inhalation hazard with this formulation. General room ventilation is adequate.",
    },
    eye: {
      type: "Safety glasses recommended",
      rationale:
        "Recommended as standard practice during compounding to protect against splash or particulate exposure.",
    },
    other: [],
    eyewashStation: false,
    safetyShower: false,
  };
}

// ─── Facility Controls ──────────────────────────────────────────────

function determineFacilityControls(ingredientHazards, riskLevel) {
  const hasNiosh = ingredientHazards.some(
    (i) => i.nioshTable && i.nioshTable !== "NONE"
  );

  return {
    ventilation: hasNiosh
      ? riskLevel === "C"
        ? "Biological Safety Cabinet (BSC) or Containment Ventilated Enclosure (CVE) required for all weighing and compounding. Dedicated negative-pressure room with HEPA-filtered exhaust."
        : "Local exhaust ventilation required during powder handling. Ventilation must be verified periodically for effectiveness."
      : "General room ventilation is sufficient. No specialized ventilation required.",
    dedicatedArea: hasNiosh
      ? "Dedicated compounding area required with restricted access during hazardous drug compounding. Area must be clearly labeled."
      : "Standard compounding area with cleanable surfaces. Separate from patient care and dispensing areas.",
    contaminationControls: hasNiosh
      ? "Cleanable, non-porous surfaces required. Documented cleaning protocol specific to hazardous drugs. Deactivation, decontamination, and cleaning procedures must be followed."
      : "Cleanable surfaces with routine cleaning between preparations. Standard compounding area maintenance procedures.",
    spillKit: hasNiosh,
    bsc: hasNiosh
      ? riskLevel === "C"
        ? "Required - Biological Safety Cabinet or Containment Ventilated Enclosure for all weighing and compounding steps"
        : "Recommended but not required for Level B (occasional small quantity). Required if frequency increases."
      : "Not required for non-hazardous preparations.",
    environmentalMonitoring:
      riskLevel === "C"
        ? "Required - Surface wipe sampling for hazardous drug contamination at regular intervals."
        : "Not required at this risk level.",
  };
}

// ─── Main Entry Point ───────────────────────────────────────────────

export function generateAssessment(formData, ingredientHazards) {
  const hasNiosh = ingredientHazards.some(
    (i) => i.nioshTable && i.nioshTable !== "NONE"
  );

  const complexityLevel = classifyComplexity(formData.form);
  const complexityJustification = buildComplexityJustification(
    formData.form,
    complexityLevel
  );

  const frequencyAssessment = assessFrequency(
    formData.frequency,
    formData.batchSize,
    hasNiosh
  );

  const riskLevel = determineRiskLevel(
    ingredientHazards,
    formData.frequency,
    formData.batchSize
  );

  const exposureRisks = analyzeExposureRisks(ingredientHazards);
  const recommendedPPE = recommendPPE(ingredientHazards, riskLevel);
  const facilityControls = determineFacilityControls(ingredientHazards, riskLevel);
  const rationale = buildRiskRationale(
    riskLevel,
    ingredientHazards,
    formData,
    frequencyAssessment
  );

  return {
    complexity: {
      level: complexityLevel,
      justification: complexityJustification,
    },
    frequencyAssessment,
    exposureRisks,
    recommendedPPE,
    facilityControls,
    riskLevel: {
      level: riskLevel,
      rationale,
    },
    references: [
      "NIOSH List of Hazardous Drugs in Healthcare Settings, 2024 Edition",
      "Ontario College of Pharmacists - Non-Sterile Compounding Risk Assessment Template (December 2025)",
      "Ontario College of Pharmacists - Non-Sterile Compounding Risk Assessment Companion Guide (February 2026)",
      "USP <795> Pharmaceutical Compounding - Non-Sterile Preparations (2023)",
      "NAPRA Model Standards for Pharmacy Compounding of Non-Sterile Preparations",
      "WHMIS 2015 / GHS Hazard Classification Criteria",
      "CSA Z94.4 - Selection, Use, and Care of Respirators",
    ],
    generatedAt: new Date().toISOString(),
    engineVersion: "1.0.0",
  };
}
