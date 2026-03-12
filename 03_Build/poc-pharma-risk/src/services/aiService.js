import { SYSTEM_PROMPT, buildUserPrompt } from "../utils/prompts.js";
import { generateAssessmentPreview, checkBackendHealth } from "./api.js";

const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || "demo";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

function buildDemoResponse(formData, ingredientHazards) {
  const hasNiosh = ingredientHazards.some(
    (ing) => ing.niosh && ing.niosh !== "none" && ing.niosh !== "unknown"
  );
  const isDaily = formData.frequency === "Daily";
  const batchSize = parseInt(formData.batchSize) || 30;

  let riskLevel, annualVolume, isOccasional, complexityLevel;

  if (hasNiosh && isDaily) {
    riskLevel = "C";
    isOccasional = false;
  } else if (hasNiosh) {
    riskLevel = "B";
    isOccasional = true;
  } else {
    riskLevel = "A";
    isOccasional = true;
  }

  const freqMultiplier = {
    Daily: 365,
    "2-3x/week": 130,
    Weekly: 52,
    Monthly: 12,
    Rarely: 4,
  };
  const annualBatches = freqMultiplier[formData.frequency] || 52;
  annualVolume = `~${(annualBatches * batchSize).toLocaleString()} units (${annualBatches} batches x ${batchSize} units)`;

  const formTypes = {
    Suppository: "Moderate",
    Capsule: "Moderate",
    Cream: "Simple",
    Ointment: "Simple",
    Gel: "Simple",
    Solution: "Simple",
    Suspension: "Moderate",
    Tablet: "Complex",
    Troche: "Moderate",
  };
  complexityLevel = formTypes[formData.form] || "Moderate";

  const complexityJustifications = {
    Simple: `This ${formData.form.toLowerCase()} preparation involves straightforward mixing and incorporation of active ingredient(s) into a commercially available base. No specialized equipment or complex techniques are required beyond standard compounding procedures.`,
    Moderate: `This ${formData.form.toLowerCase()} preparation requires specific technique and equipment, including precise measurements, temperature control, and careful incorporation of active ingredients. The process demands trained personnel and attention to detail.`,
    Complex: `This ${formData.form.toLowerCase()} preparation involves multiple complex steps, specialized equipment, and requires significant technical expertise. The process includes critical steps where deviations can affect final product quality.`,
  };

  const ingredientNames = ingredientHazards
    .map((i) => i.name)
    .join(" and ");
  const primaryIng = ingredientHazards[0];
  const isPowder = ingredientHazards.some(
    (i) => i.physicalForm === "powder" || i.physicalForm === "unknown"
  );

  const levelLabels = { A: "Low", B: "Moderate", C: "High" };
  const levelDescriptions = {
    A: `This preparation is classified as Level A (Low Risk) based on the absence of NIOSH-listed hazardous drugs among the ingredients and the straightforward nature of the compounding process.\n\nThe active ingredient(s) in this formulation (${ingredientNames}) are not classified on the NIOSH List of Hazardous Drugs in Healthcare Settings. While standard good compounding practices must always be observed, the ingredients do not pose significant occupational health risks beyond those inherent to any compounding activity. Standard personal protective equipment including regular nitrile gloves and a compounding jacket provide adequate protection.\n\nGeneral room ventilation is sufficient for this preparation. The compounding area should be clean with appropriate surfaces, but no specialized containment or engineering controls are required. A regular cleaning and maintenance schedule should be followed. This risk level should be reassessed if the formulation changes, if new hazard information becomes available for any ingredient, or if compounding conditions change significantly. Annual review is recommended per OCP standards.`,
    B: `This preparation contains ${primaryIng?.name || ingredientNames}, a NIOSH Table 2 hazardous drug with ${primaryIng?.reproductiveToxicity ? "significant reproductive toxicity concerns (GHS Category " + (primaryIng?.ghsCategory || "1A") + ")" : "documented hazard potential"}. ${primaryIng?.name || "The active ingredient"} is classified as hazardous due to its documented ability to cause ${primaryIng?.reproductiveToxicity ? "reproductive harm and potential endocrine disruption" : "adverse health effects with occupational exposure"}. The Safety Data Sheet indicates precautionary measures including ventilation and protective equipment are necessary during handling.\n\nDespite the inherent hazards of the active ingredient, Level B classification is appropriate based on several mitigating factors. The preparation is compounded ${formData.frequency.toLowerCase()} in batches of ${batchSize} ${formData.form.toLowerCase()}s, representing ${annualVolume}. This frequency and volume meet the Ontario College of Pharmacists' definition of "occasional small quantity" as outlined in the OCP Companion Guide (February 2026). The ${formData.form.toLowerCase()} form ${formData.form === "Cream" || formData.form === "Gel" || formData.form === "Ointment" ? "involves incorporating the active into a base, which limits aerosolization compared to other dosage forms" : "involves specific handling steps"}, though proper containment during the initial weighing and incorporation steps remains critical.\n\nThe facility must implement robust engineering controls and administrative safeguards to maintain Level B status. Local exhaust ventilation is mandatory during powder handling and should be verified periodically for effectiveness. The compounding area must be dedicated with cleanable, non-porous surfaces, and a documented cleaning protocol specific to hazardous drugs should be maintained. All personnel must complete hazardous drug handling training and demonstrate competency in the use of PPE, including chemotherapy-rated gloves, disposable hazardous drug gowns, N95 respirators, and eye protection. An eyewash station must be accessible within 10 seconds of the compounding area. A spill kit specific to hazardous powder containment should be readily available. If compounding frequency increases to daily or batch sizes exceed 50 units, reassessment for Level C designation would be warranted. Regular review of this risk assessment (annually minimum, or when practices change) ensures continued alignment with current OCP standards and NIOSH recommendations.`,
    C: `This preparation contains ${primaryIng?.name || ingredientNames}, a NIOSH Table 2 hazardous drug with ${primaryIng?.reproductiveToxicity ? "significant reproductive toxicity concerns (GHS Category " + (primaryIng?.ghsCategory || "1A") + ")" : "documented hazard potential"}. The daily compounding frequency and batch size of ${batchSize} units result in substantial cumulative occupational exposure that exceeds the threshold for "occasional small quantity" under OCP guidelines.\n\nLevel C classification is warranted due to the combination of hazardous drug handling and high-frequency compounding. With ${annualVolume} of annual production, compounding personnel face regular and sustained exposure to ${primaryIng?.name || "hazardous ingredients"}. This volume of hazardous drug handling requires the highest level of engineering controls and administrative safeguards available. The OCP Companion Guide (February 2026) clearly indicates that daily preparation of NIOSH-listed drugs does not qualify as occasional small quantity, regardless of individual batch sizes.\n\nThe facility must implement comprehensive Level C controls including: a Biological Safety Cabinet (BSC) or Containment Ventilated Enclosure (CVE) for all weighing, measuring, and compounding steps; a dedicated negative-pressure compounding room with appropriate air handling; closed-system drug transfer devices where applicable; chemotherapy-rated double gloving; impervious disposable hazardous drug gowns; N95 respirators (minimum) with consideration for powered air-purifying respirators (PAPRs) for extended sessions; full eye protection; and comprehensive environmental monitoring including surface wipe sampling. All waste must be handled as hazardous pharmaceutical waste. Personnel must undergo initial and annual competency assessments for hazardous drug handling. Medical surveillance including baseline and periodic health assessments should be implemented. This assessment should be reviewed if frequency decreases, if formulation changes, or at minimum annually.`,
  };

  return {
    complexity: {
      level: complexityLevel,
      justification: complexityJustifications[complexityLevel],
    },
    frequencyAssessment: {
      isOccasionalSmallQuantity: isOccasional,
      annualVolume,
      justification: isOccasional
        ? `Prepared ${formData.frequency.toLowerCase()} in batches of ${batchSize} units. The cumulative annual compounding time and exposure duration meet OCP Companion Guide criteria for "occasional small quantity." The frequency and volume are within acceptable thresholds for the assigned risk level.`
        : `Prepared ${formData.frequency.toLowerCase()} in batches of ${batchSize} units, resulting in ${annualVolume}. This frequency does NOT qualify as "occasional small quantity" per OCP Companion Guide criteria. Daily compounding of hazardous drugs represents sustained occupational exposure requiring the highest level of controls.`,
    },
    exposureRisks: {
      skin: {
        risk: hasNiosh || isPowder,
        explanation: hasNiosh
          ? `${isPowder ? "Powder handling and" : "Ingredient handling and"} potential contact during the compounding process poses a dermal absorption risk. ${primaryIng?.name || "Active ingredient"} can be absorbed through intact skin.`
          : "Standard compounding practices with appropriate gloves provide adequate skin protection. No significant dermal absorption risk with these ingredients.",
      },
      eye: {
        risk: isPowder || hasNiosh,
        explanation: isPowder
          ? "Powder aerosolization risk during weighing and incorporation steps could result in ocular exposure. Eye protection is required."
          : "Minimal risk with semi-solid/liquid preparation. Safety glasses recommended as standard practice.",
      },
      inhalation: {
        risk: hasNiosh || isPowder,
        explanation: isPowder
          ? `Fine powder can become airborne during weighing and transfer without proper controls.${hasNiosh ? " Given the NIOSH classification, inhalation exposure must be minimized through engineering controls and respiratory protection." : " Dust mask recommended during powder handling."}`
          : "Minimal inhalation risk as ingredients are in semi-solid or liquid form with low vapor pressure.",
      },
      oral: {
        risk: false,
        explanation:
          "Low risk with proper hygiene practices. No eating, drinking, or applying cosmetics in the compounding area. Hand washing required before and after compounding.",
      },
    },
    recommendedPPE: hasNiosh
      ? {
          gloves: {
            type: "Chemotherapy-rated nitrile gloves (double gloving recommended)",
            rationale: `Required for NIOSH Table 2 drugs. Chemotherapy-rated gloves have been tested for permeation resistance against hazardous drugs per ASTM D6978.`,
          },
          gown: {
            type: "Disposable hazardous drug gown",
            rationale:
              "Low-lint, impervious to powder contamination. Must be worn closed in front with long sleeves and elastic or knit cuffs.",
          },
          respiratory: {
            type: riskLevel === "C" ? "N95 respirator minimum; PAPR recommended for extended sessions" : "N95 respirator",
            rationale:
              "Required during powder handling and any step that may generate aerosols. Must be fit-tested per CSA Z94.4.",
          },
          eye: {
            type: "Safety glasses or goggles",
            rationale:
              "Protect against powder exposure and splash hazards during compounding.",
          },
          other: ["Hair/head covers", "Shoe covers recommended for Level C"],
          eyewashStation: true,
          safetyShower: riskLevel === "C",
        }
      : {
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
            type: isPowder ? "Dust mask during powder handling" : "Not required",
            rationale: isPowder
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
        },
    facilityControls: {
      ventilation: hasNiosh
        ? "Local exhaust ventilation required during powder handling. Ventilation must be verified periodically for effectiveness. Consider BSC or CVE for Level C preparations."
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
    },
    riskLevel: {
      level: riskLevel,
      rationale: levelDescriptions[riskLevel],
    },
    references: [
      "NIOSH List of Hazardous Drugs in Healthcare Settings (Current Edition)",
      "Ontario College of Pharmacists - Non-Sterile Compounding Risk Assessment Template (December 2025)",
      "Ontario College of Pharmacists - Non-Sterile Compounding Risk Assessment Companion Guide (February 2026)",
      "USP <795> Pharmaceutical Compounding - Non-Sterile Preparations",
      "NAPRA Model Standards for Pharmacy Compounding of Non-Sterile Preparations",
      "WHMIS 2015 / GHS Hazard Classification Criteria",
      "CSA Z94.4 - Selection, Use, and Care of Respirators",
    ],
  };
}

async function callDemo(formData, ingredientHazards) {
  await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 2000));
  return JSON.stringify(buildDemoResponse(formData, ingredientHazards));
}

async function callOpenAI(systemPrompt, userPrompt) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file."
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callClaude(systemPrompt, userPrompt) {
  if (!CLAUDE_API_KEY) {
    throw new Error(
      "Claude API key not configured. Please add VITE_CLAUDE_API_KEY to your .env file."
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseAIResponse(rawText) {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch (e) {
    console.warn("Failed to parse structured JSON, using raw text:", e);
    return { rawText, parseError: true };
  }
}

export async function generateRiskAssessment(formData, ingredientHazards) {
  // Try backend rule engine first (no AI, pure deterministic)
  if (AI_PROVIDER === "demo" || AI_PROVIDER === "backend") {
    try {
      const health = await checkBackendHealth();
      if (health.available) {
        const result = await generateAssessmentPreview(formData, ingredientHazards);
        return {
          ...result,
          rawText: JSON.stringify(result),
          generatedAt: new Date().toISOString(),
          formData,
          ingredientHazards,
          source: "backend_rule_engine",
        };
      }
    } catch {
      // Backend unavailable, fall through to local demo
    }
  }

  const userPrompt = buildUserPrompt(formData, ingredientHazards);
  let rawText;

  if (AI_PROVIDER === "demo" || AI_PROVIDER === "backend") {
    rawText = await callDemo(formData, ingredientHazards);
  } else if (AI_PROVIDER === "claude") {
    rawText = await callClaude(SYSTEM_PROMPT, userPrompt);
  } else {
    rawText = await callOpenAI(SYSTEM_PROMPT, userPrompt);
  }

  const parsed = parseAIResponse(rawText);
  return {
    ...parsed,
    rawText,
    generatedAt: new Date().toISOString(),
    formData,
    ingredientHazards,
    source: AI_PROVIDER === "demo" ? "local_demo" : AI_PROVIDER,
  };
}
