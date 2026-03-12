/**
 * PubChem Data Fetcher
 *
 * Fetches chemical properties and GHS hazard classifications from
 * PubChem's PUG REST API for all ingredients in our seed database.
 *
 * APIs used:
 *   1. PUG REST: /compound/name/{name}/property/... → molecular data
 *   2. PUG View: /data/compound/{CID}/JSON?heading=GHS+Classification → hazard data
 *
 * Rate limit: max 5 requests/second (PubChem policy).
 *
 * Run: node src/data/fetchers/fetch-pubchem.js
 * Output: src/data/seed/pubchem-data.json
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INGREDIENTS_FILE = join(__dirname, "..", "seed", "ingredients-compounding.json");
const OUTPUT_FILE = join(__dirname, "..", "seed", "pubchem-data.json");

const PUG_REST = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUG_VIEW = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function getCompoundProperties(name) {
  const url = `${PUG_REST}/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight,IUPACName,InChIKey/JSON`;
  const data = await fetchJson(url);
  if (!data || !data.PropertyTable?.Properties?.[0]) return null;
  return data.PropertyTable.Properties[0];
}

async function getCID(name) {
  const url = `${PUG_REST}/compound/name/${encodeURIComponent(name)}/cids/JSON`;
  const data = await fetchJson(url);
  if (!data || !data.IdentifierList?.CID?.[0]) return null;
  return data.IdentifierList.CID[0];
}

async function getSynonyms(cid) {
  const url = `${PUG_REST}/compound/cid/${cid}/synonyms/JSON`;
  const data = await fetchJson(url);
  if (!data || !data.InformationList?.Information?.[0]?.Synonym) return [];
  return data.InformationList.Information[0].Synonym.slice(0, 10);
}

async function getGHSClassification(cid) {
  const url = `${PUG_VIEW}/data/compound/${cid}/JSON/?response_type=display&heading=GHS+Classification`;
  const data = await fetchJson(url);

  if (!data?.Record?.Section) return null;

  const ghsData = {
    pictograms: [],
    signalWord: null,
    hazardStatements: [],
    precautionaryStatements: [],
  };

  function extractFromSection(sections) {
    for (const section of sections) {
      if (section.Section) extractFromSection(section.Section);
      if (!section.Information) continue;

      for (const info of section.Information) {
        const name = info.Name || "";

        if (name.includes("Pictogram")) {
          const markups = info.Value?.StringWithMarkup?.[0]?.Markup || [];
          for (const m of markups) {
            if (m.Extra) ghsData.pictograms.push(m.Extra);
          }
        }

        if (name.includes("Signal")) {
          const val = info.Value?.StringWithMarkup?.[0]?.String;
          if (val) ghsData.signalWord = val.trim();
        }

        if (name === "GHS Hazard Statements") {
          const vals = info.Value?.StringWithMarkup || [];
          for (const v of vals) {
            if (v.String) ghsData.hazardStatements.push(v.String.trim());
          }
        }

        if (name === "Precautionary Statement Codes") {
          const vals = info.Value?.StringWithMarkup || [];
          for (const v of vals) {
            if (v.String) ghsData.precautionaryStatements.push(v.String.trim());
          }
        }
      }
    }
  }

  extractFromSection(data.Record.Section);
  return ghsData;
}

async function fetchIngredientData(ingredient) {
  const searchName = ingredient.name.replace(/\s*\([^)]*\)\s*/g, "").trim();

  // Step 1: Get CID
  const cid = await getCID(searchName);
  if (!cid) {
    console.log(`    [SKIP] No CID found for "${searchName}"`);
    return null;
  }

  await sleep(250);

  // Step 2: Get properties
  const props = await getCompoundProperties(searchName);
  await sleep(250);

  // Step 3: Get synonyms
  const synonyms = await getSynonyms(cid);
  await sleep(250);

  // Step 4: Get GHS classification
  const ghs = await getGHSClassification(cid);
  await sleep(250);

  return {
    name: ingredient.name,
    cid: cid.toString(),
    molecularFormula: props?.MolecularFormula || null,
    molecularWeight: props?.MolecularWeight ? parseFloat(props.MolecularWeight) : null,
    iupacName: props?.IUPACName || null,
    inchiKey: props?.InChIKey || null,
    synonyms: synonyms,
    ghs: ghs,
    fetchedAt: new Date().toISOString(),
  };
}

async function main() {
  console.log("\n=== PubChem Data Fetcher ===\n");

  const ingredientData = JSON.parse(readFileSync(INGREDIENTS_FILE, "utf-8"));
  const ingredients = ingredientData.ingredients;

  // Only fetch for ingredients that have a real CAS number
  const toFetch = ingredients.filter(
    (i) => i.cas && i.cas !== "N/A" && !i.name.includes("Flavor")
  );

  console.log(`Total ingredients in database: ${ingredients.length}`);
  console.log(`Ingredients with CAS numbers to fetch: ${toFetch.length}`);
  console.log(`Estimated time: ~${Math.ceil((toFetch.length * 1.2) / 60)} minutes (rate-limited)\n`);

  const results = [];
  const errors = [];

  for (let i = 0; i < toFetch.length; i++) {
    const ing = toFetch[i];
    const progress = `[${i + 1}/${toFetch.length}]`;

    try {
      console.log(`${progress} Fetching: ${ing.name} (CAS: ${ing.cas})`);
      const data = await fetchIngredientData(ing);
      if (data) {
        results.push(data);
        console.log(`    CID: ${data.cid}, Formula: ${data.molecularFormula}, GHS: ${data.ghs?.hazardStatements?.length || 0} statements`);
      }
    } catch (err) {
      console.log(`    [ERROR] ${err.message}`);
      errors.push({ name: ing.name, cas: ing.cas, error: err.message });
    }

    // Extra delay every 5 requests to stay well within rate limits
    if (i % 5 === 4) {
      await sleep(1000);
    }
  }

  const output = {
    _metadata: {
      source: "PubChem PUG REST + PUG View APIs (NIH/NLM)",
      url: "https://pubchem.ncbi.nlm.nih.gov/",
      fetchedDate: new Date().toISOString().split("T")[0],
      method: "Automated API fetch: PUG REST for properties, PUG View for GHS classification",
      totalFetched: results.length,
      totalErrors: errors.length,
      totalSkipped: toFetch.length - results.length - errors.length,
    },
    compounds: results,
    errors: errors,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n=== Results ===`);
  console.log(`  Fetched: ${results.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Saved to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Fetcher failed:", err.message);
  process.exit(1);
});
