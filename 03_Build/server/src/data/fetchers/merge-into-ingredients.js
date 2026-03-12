/**
 * Merge Fetched Data into Ingredient Seed File
 *
 * After running fetch-pubchem.js and fetch-health-canada.js, this script
 * reads the fetched data and enriches the main ingredients-compounding.json
 * with real API data (molecular formulas, GHS hazard statements, DINs, etc.)
 *
 * Run: node src/data/fetchers/merge-into-ingredients.js
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEED_DIR = join(__dirname, "..", "seed");
const INGREDIENTS_FILE = join(SEED_DIR, "ingredients-compounding.json");
const PUBCHEM_FILE = join(SEED_DIR, "pubchem-data.json");
const HC_FILE = join(SEED_DIR, "health-canada-dpd.json");

function loadIfExists(filepath) {
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, "utf-8"));
}

function main() {
  console.log("\n=== Merge Fetched Data into Ingredients ===\n");

  const ingredientData = JSON.parse(readFileSync(INGREDIENTS_FILE, "utf-8"));
  const pubchemData = loadIfExists(PUBCHEM_FILE);
  const hcData = loadIfExists(HC_FILE);

  let pubchemUpdates = 0;
  let hcUpdates = 0;

  for (const ing of ingredientData.ingredients) {
    // Merge PubChem data
    if (pubchemData) {
      const pc = pubchemData.compounds.find(
        (c) => c.name.toLowerCase() === ing.name.toLowerCase()
      );

      if (pc) {
        if (pc.cid) ing.pubchemCid = pc.cid;
        if (pc.molecularFormula && (!ing.molecularFormula || ing.molecularFormula === "N/A")) {
          ing.molecularFormula = pc.molecularFormula;
        }
        if (pc.molecularWeight && !ing.molecularWeight) {
          ing.molecularWeight = pc.molecularWeight;
        }
        if (pc.synonyms && pc.synonyms.length > 0) {
          const existing = new Set((ing.synonyms || []).map((s) => s.toLowerCase()));
          for (const syn of pc.synonyms) {
            if (!existing.has(syn.toLowerCase())) {
              ing.synonyms = ing.synonyms || [];
              ing.synonyms.push(syn);
            }
          }
          // Cap synonyms at 15
          ing.synonyms = (ing.synonyms || []).slice(0, 15);
        }
        // Merge GHS hazard statements if PubChem has them and our list is empty
        if (pc.ghs?.hazardStatements?.length > 0 && (!ing.whmisHazards || ing.whmisHazards.length === 0)) {
          ing.whmisHazards = pc.ghs.hazardStatements;
          console.log(`  [PubChem GHS] ${ing.name}: added ${pc.ghs.hazardStatements.length} hazard statements`);
        }
        pubchemUpdates++;
      }
    }

    // Merge Health Canada data
    if (hcData) {
      const hc = hcData.drugProducts?.find(
        (d) => d.ingredientName.toLowerCase() === ing.name.toLowerCase()
      );

      if (hc && hc.products.length > 0) {
        const first = hc.products[0];
        if (first.din && !ing.healthCanadaDin) {
          ing.healthCanadaDin = first.din;
        }
        hcUpdates++;
      }
    }
  }

  // Update metadata
  ingredientData._metadata.lastEnriched = new Date().toISOString().split("T")[0];
  ingredientData._metadata.enrichedFrom = [];
  if (pubchemData) {
    ingredientData._metadata.enrichedFrom.push(
      `PubChem (${pubchemData._metadata.fetchedDate}): ${pubchemUpdates} ingredients updated`
    );
  }
  if (hcData) {
    ingredientData._metadata.enrichedFrom.push(
      `Health Canada DPD (${hcData._metadata.fetchedDate}): ${hcUpdates} ingredients updated`
    );
  }
  ingredientData._metadata.totalIngredients = ingredientData.ingredients.length;

  writeFileSync(INGREDIENTS_FILE, JSON.stringify(ingredientData, null, 2));

  console.log(`\nMerge complete:`);
  console.log(`  PubChem updates: ${pubchemUpdates}`);
  console.log(`  Health Canada updates: ${hcUpdates}`);
  console.log(`  Total ingredients: ${ingredientData.ingredients.length}`);
  console.log(`  Saved to: ${INGREDIENTS_FILE}`);
}

main();
