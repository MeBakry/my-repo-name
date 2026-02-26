/**
 * Health Canada Drug Product Database (DPD) Fetcher
 *
 * Fetches drug product data from the Health Canada DPD API.
 * For each ingredient in our database, looks up:
 *   - Drug Identification Numbers (DINs)
 *   - Brand names
 *   - Status (marketed, cancelled, etc.)
 *   - Therapeutic class
 *   - Route of administration
 *
 * API Docs: https://health-products.canada.ca/api/documentation/dpd-documentation-en.html
 * Base URL: https://health-products.canada.ca/api/drug/
 *
 * Note: Health Canada API does not require authentication.
 * The full database (~57,000 products) is downloaded once and filtered locally.
 *
 * Run: node src/data/fetchers/fetch-health-canada.js
 * Output: src/data/seed/health-canada-dpd.json
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INGREDIENTS_FILE = join(__dirname, "..", "seed", "ingredients-compounding.json");
const OUTPUT_FILE = join(__dirname, "..", "seed", "health-canada-dpd.json");

const HC_API = "https://health-products.canada.ca/api/drug";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

let allDrugProducts = null;
let allActiveIngredients = null;

async function downloadBulkData() {
  if (allDrugProducts && allActiveIngredients) return;

  console.log("Downloading full Health Canada DPD database (one-time bulk download)...");

  console.log("  Fetching drug products...");
  allDrugProducts = await fetchJson(`${HC_API}/drugproduct/?lang=en&type=json`);
  console.log(`  Got ${allDrugProducts.length} drug products`);

  await sleep(2000);

  console.log("  Fetching active ingredients...");
  allActiveIngredients = await fetchJson(`${HC_API}/activeingredient/?lang=en&type=json`);
  console.log(`  Got ${allActiveIngredients.length} active ingredient records`);
  console.log("");
}

function lookupIngredientLocal(ingredientName) {
  // Strip salt forms and parenthetical suffixes for matching
  const searchTerms = [
    ingredientName.toUpperCase(),
    ingredientName.replace(/\s*\([^)]*\)\s*/g, "").toUpperCase(),
    ingredientName.replace(/\s+HCl$/i, "").toUpperCase(),
    ingredientName.replace(/\s+Sodium$/i, "").toUpperCase(),
    ingredientName.replace(/\s+Nitrate$/i, "").toUpperCase(),
    ingredientName.replace(/\s+Citrate$/i, "").toUpperCase(),
  ];

  // Find matching active ingredient records
  const aiMatches = allActiveIngredients.filter((ai) => {
    const aiName = (ai.ingredient_name || "").toUpperCase();
    return searchTerms.some((term) => aiName.includes(term));
  });

  if (aiMatches.length === 0) return null;

  // Get unique drug codes from matches
  const drugCodes = [...new Set(aiMatches.map((m) => m.drug_code))];

  // Look up products for those drug codes (human only, limit to 5)
  const products = drugCodes
    .map((code) => allDrugProducts.find((p) => p.drug_code === code))
    .filter((p) => p && p.class_name === "Human")
    .slice(0, 5)
    .map((product) => {
      const ai = aiMatches.find((m) => m.drug_code === product.drug_code);
      return {
        drugCode: product.drug_code,
        din: product.drug_identification_number || null,
        brandName: product.brand_name || null,
        className: product.class_name || null,
        companyName: product.company_name || null,
        lastUpdateDate: product.last_update_date || null,
        strength: ai?.strength || null,
        strengthUnit: ai?.strength_unit || null,
      };
    });

  return {
    ingredientName,
    totalMatches: aiMatches.length,
    humanProducts: products.length,
    products,
  };
}

async function main() {
  console.log("\n=== Health Canada DPD Fetcher ===\n");

  const ingredientData = JSON.parse(readFileSync(INGREDIENTS_FILE, "utf-8"));
  const ingredients = ingredientData.ingredients;

  // Only fetch for real drug ingredients (skip excipients with N/A CAS)
  const toFetch = ingredients.filter(
    (i) =>
      i.cas &&
      i.cas !== "N/A" &&
      !i.nioshDescription?.includes("Excipient") &&
      !i.nioshDescription?.includes("Preservative") &&
      !i.name.includes("Flavor")
  );

  console.log(`Total ingredients: ${ingredients.length}`);
  console.log(`Drug ingredients to look up: ${toFetch.length}\n`);

  // Download bulk data once
  await downloadBulkData();

  const results = [];
  const errors = [];
  const notFound = [];

  for (let i = 0; i < toFetch.length; i++) {
    const ing = toFetch[i];
    const progress = `[${i + 1}/${toFetch.length}]`;

    try {
      const data = lookupIngredientLocal(ing.name);

      if (data && data.products.length > 0) {
        results.push(data);
        console.log(`${progress} ${ing.name} - ${data.humanProducts} human products, DIN: ${data.products[0]?.din || "N/A"}`);
      } else {
        notFound.push(ing.name);
        console.log(`${progress} ${ing.name} - not found in DPD`);
      }
    } catch (err) {
      console.log(`${progress} ${ing.name} - [ERROR] ${err.message}`);
      errors.push({ name: ing.name, error: err.message });
    }
  }

  const output = {
    _metadata: {
      source: "Health Canada Drug Product Database (DPD) API",
      url: "https://health-products.canada.ca/api/drug/",
      fetchedDate: new Date().toISOString().split("T")[0],
      method: "Automated API fetch: active ingredient search → drug product details → route/form",
      totalSearched: toFetch.length,
      totalFound: results.length,
      totalNotFound: notFound.length,
      totalErrors: errors.length,
    },
    drugProducts: results,
    notFound: notFound,
    errors: errors,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n=== Results ===`);
  console.log(`  Found: ${results.length}`);
  console.log(`  Not found: ${notFound.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Saved to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Fetcher failed:", err.message);
  process.exit(1);
});
