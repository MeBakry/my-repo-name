/**
 * MFR → form data helpers. Extracted to avoid circular/init-order issues
 * when App and Dashboard both reference the same module.
 */

/** "400mg" → { value: "400", unit: "mg" }; "2.5%" → { value: "2.5", unit: "%" } */
export function parseConcentration(str) {
  if (!str) return { value: "", unit: "%" };
  const match = String(str).match(/^([\d.]+)\s*(.*)$/);
  if (match) return { value: match[1], unit: match[2] || "%" };
  return { value: str, unit: "%" };
}

function mapIngredient(mi) {
  const ing = mi.ingredient;
  return {
    name: ing.name,
    quantity: mi.quantity || "",
    matched: true,
    data: {
      id: ing.id,
      name: ing.name,
      niosh: (ing.nioshTable || "NONE").toLowerCase().replace("_", " "),
      nioshTable: ing.nioshTable,
      nioshDescription: ing.nioshDescription,
      reproductiveToxicity: ing.reproductiveToxicity,
      ghsCategory: ing.ghsCategory,
      physicalForm: ing.physicalForm,
      whmisHazards: ing.whmisHazards || [],
      ventilationRequired: ing.ventilationRequired,
      ventilationType: ing.ventilationType,
      exposureRoutes: ing.exposureRoutes || {},
    },
  };
}

/** Build form data from a full MFR (for opening existing product in form). */
export function buildFormDataFromMfr(full) {
  const { value, unit } = parseConcentration(full.concentration);
  const ingredients = full.ingredients?.length
    ? full.ingredients.map(mapIngredient)
    : [{ name: "", quantity: "", matched: false, data: null }];
  while (ingredients.length < 2) {
    ingredients.push({ name: "", quantity: "", matched: false, data: null });
  }
  return {
    mfrId: full.id,
    protocolNumber: full.protocolNumber || "",
    productName: full.productName,
    concentrationValue: value,
    concentrationUnit: unit,
    form: full.form,
    route: full.route || "",
    frequency: full.frequency || "",
    batchSize: full.batchSize != null ? String(full.batchSize) : "",
    ingredients,
  };
}
