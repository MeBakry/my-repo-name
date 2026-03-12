import { useState, useEffect, useRef } from "react";
import IngredientInput from "./IngredientInput";
import { getIngredientByName } from "../data/ingredientDatabase";
import { listMFRs, getMFR } from "../services/api";

const CONCENTRATION_UNITS = [
  "%",
  "mg",
  "mg/mL",
  "mg/g",
  "mg/capsule",
  "mg/unit",
  "mg/patch",
  "g/100g",
  "mcg",
  "mcg/mL",
  "IU",
  "IU/mL",
  "mEq/mL",
];

const FORMS = [
  "Capsule",
  "Cream",
  "Gel",
  "Ointment",
  "Solution",
  "Suppository",
  "Suspension",
  "Tablet",
  "Troche",
];

const ROUTES = ["Oral", "Topical", "Rectal", "Sublingual", "Vaginal"];

const FREQUENCIES = ["Daily", "2-3x/week", "Weekly", "Monthly", "Rarely"];

const EXAMPLES = [
  {
    label: "Progesterone Supp",
    data: {
      productName: "Progesterone 400mg Suppository",
      concentrationValue: "400",
      concentrationUnit: "mg",
      form: "Suppository",
      route: "Rectal",
      frequency: "Weekly",
      batchSize: "30",
      ingredients: [
        { name: "Progesterone", quantity: "400mg per unit", matched: true, data: getIngredientByName("Progesterone") },
        { name: "Witepsol H15", quantity: "qs to 2g", matched: true, data: getIngredientByName("Witepsol H15") },
      ],
    },
  },
  {
    label: "Testosterone Gel",
    data: {
      productName: "Testosterone 50mg/mL Gel",
      concentrationValue: "50",
      concentrationUnit: "mg/mL",
      form: "Gel",
      route: "Topical",
      frequency: "Daily",
      batchSize: "50",
      ingredients: [
        { name: "Testosterone", quantity: "50mg/mL", matched: true, data: getIngredientByName("Testosterone") },
        { name: "PLO Gel Base", quantity: "qs to 1mL", matched: true, data: getIngredientByName("PLO Gel Base") },
      ],
    },
  },
  {
    label: "Hydrocortisone Cream",
    data: {
      productName: "Hydrocortisone 2.5% Cream",
      concentrationValue: "2.5",
      concentrationUnit: "%",
      form: "Cream",
      route: "Topical",
      frequency: "Daily",
      batchSize: "100",
      ingredients: [
        { name: "Hydrocortisone", quantity: "2.5g per 100g", matched: true, data: getIngredientByName("Hydrocortisone") },
        { name: "VersaBase Cream", quantity: "qs to 100g", matched: true, data: getIngredientByName("VersaBase Cream") },
      ],
    },
  },
  {
    label: "Zinc Oxide Ointment",
    data: {
      productName: "Zinc Oxide 20% Ointment",
      concentrationValue: "20",
      concentrationUnit: "%",
      form: "Ointment",
      route: "Topical",
      frequency: "Weekly",
      batchSize: "50",
      ingredients: [
        { name: "Zinc Oxide", quantity: "20g per 100g", matched: true, data: getIngredientByName("Zinc Oxide") },
        { name: "Aquaphor", quantity: "qs to 100g", matched: true, data: getIngredientByName("Aquaphor") },
      ],
    },
  },
];

const EMPTY_INGREDIENT = { name: "", quantity: "", matched: false, data: null };

const DEFAULT_FORM_DATA = {
  mfrId: null,
  protocolNumber: "",
  productName: "",
  concentrationValue: "",
  concentrationUnit: "%",
  form: "",
  route: "",
  frequency: "",
  batchSize: "",
  ingredients: [{ ...EMPTY_INGREDIENT }, { ...EMPTY_INGREDIENT }],
};

export default function MFRForm({ onSubmit, authStatus, initialData, onOpenExisting }) {
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      // Ensure at least 2 ingredient slots
      const ings = initialData.ingredients?.length
        ? initialData.ingredients
        : [{ ...EMPTY_INGREDIENT }, { ...EMPTY_INGREDIENT }];
      return { ...DEFAULT_FORM_DATA, ...initialData, ingredients: ings };
    }
    return { ...DEFAULT_FORM_DATA };
  });

  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const duplicateTimer = useRef(null);

  // Check for existing MFR with same product name after user stops typing (500ms debounce)
  useEffect(() => {
    clearTimeout(duplicateTimer.current);
    setDuplicateWarning(null);
    const name = formData.productName.trim();
    // Skip duplicate check if we're editing an existing MFR (it IS the duplicate)
    if (name.length < 4 || authStatus !== "ready" || formData.mfrId) return;
    duplicateTimer.current = setTimeout(async () => {
      try {
        const existing = await listMFRs({ search: name, limit: 3 });
        const matches = (existing.mfrs || existing || []).filter(
          (m) => m.productName.toLowerCase().includes(name.toLowerCase())
        );
        if (matches.length > 0) {
          setDuplicateWarning(matches);
        }
      } catch {
        // silently ignore — backend might be unavailable
      }
    }, 500);
    return () => clearTimeout(duplicateTimer.current);
  }, [formData.productName, authStatus]);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  }

  function handleIngredientUpdate(index, updatedIngredient) {
    setFormData((prev) => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = updatedIngredient;
      return { ...prev, ingredients: newIngredients };
    });
    if (errors.ingredients) {
      setErrors((prev) => ({ ...prev, ingredients: null }));
    }
  }

  function handleIngredientRemove(index) {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  }

  function addIngredient() {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...EMPTY_INGREDIENT }],
    }));
  }

  function loadExample(example) {
    setFormData(example.data);
    setErrors({});
  }

  function validate() {
    const newErrors = {};
    if (!formData.productName.trim()) newErrors.productName = "Required";
    if (!formData.concentrationValue.trim()) newErrors.concentrationValue = "Required";
    if (!formData.form) newErrors.form = "Required";
    if (!formData.route) newErrors.route = "Required";
    if (!formData.frequency) newErrors.frequency = "Required";
    if (!formData.batchSize.trim()) newErrors.batchSize = "Required";

    const hasValidIngredient = formData.ingredients.some(
      (ing) => ing.name.trim() && ing.quantity.trim()
    );
    if (!hasValidIngredient)
      newErrors.ingredients = "At least one ingredient with name and quantity is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    // If this is a new formulation and we have an exact duplicate, open existing instead of creating
    if (!formData.mfrId && onOpenExisting && duplicateWarning?.length > 0) {
      const nameLower = formData.productName.trim().toLowerCase();
      const exact = duplicateWarning.find(
        (m) => m.productName.trim().toLowerCase() === nameLower
      );
      if (exact) {
        onOpenExisting(exact.id);
        return;
      }
    }

    const validIngredients = formData.ingredients.filter(
      (ing) => ing.name.trim() && ing.quantity.trim()
    );
    const concentration = `${formData.concentrationValue.trim()}${formData.concentrationUnit}`;
    onSubmit({ ...formData, concentration, ingredients: validIngredients });
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">Master Formulation Record</h2>

        {/* Duplicate Warning Banner */}
        {duplicateWarning && (
          <div className="duplicate-warning">
            <div className="duplicate-warning-icon">⚠</div>
            <div className="duplicate-warning-content">
              <strong>This product already exists in the database:</strong>
              <ul>
                {duplicateWarning.map((m) => (
                  <li key={m.id}>
                    {m.productName}
                    {m.concentration ? ` ${m.concentration}` : ""}
                    {" — "}
                    {m._count?.assessments ?? 0} assessment(s) on record
                    {m.status === "ARCHIVED" ? " (archived)" : ""}
                  </li>
                ))}
              </ul>
              <span className="duplicate-hint">
                Click &quot;Generate Risk Assessment&quot; to <strong>open the existing product</strong> instead of creating a duplicate.
              </span>
            </div>
            <button
              type="button"
              className="duplicate-dismiss"
              onClick={() => setDuplicateWarning(null)}
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Protocol Number + Product Name side by side */}
          <div className="form-row">
          <div className="form-group">
            <label className="form-label">Protocol Number</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. MFR-2024-001 or NS-001 (optional)"
              value={formData.protocolNumber}
              onChange={(e) => handleChange("protocolNumber", e.target.value)}
            />
            <span className="form-hint">
              Your internal protocol or SOP number. Optional; can be assigned or updated on approval.
            </span>
          </div>

          {/* Product Name */}
          <div className="form-group" style={{ gridColumn: "span 1" }}>
            <label className="form-label">
              Product Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`input-field ${errors.productName ? "input-error" : ""}`}
              placeholder="e.g. Progesterone Suppository"
              value={formData.productName}
              onChange={(e) => handleChange("productName", e.target.value)}
            />
            {errors.productName && (
              <span className="error-text">{errors.productName}</span>
            )}
          </div>
          </div>{/* end protocol+name row */}

          {/* Concentration */}
          <div className="form-group">
            <label className="form-label">
              Concentration/Strength <span className="required">*</span>
            </label>
            <div className="concentration-wrapper">
              <input
                type="number"
                className={`input-field concentration-value ${errors.concentrationValue ? "input-error" : ""}`}
                placeholder="e.g. 400"
                value={formData.concentrationValue}
                onChange={(e) => handleChange("concentrationValue", e.target.value)}
                min="0"
                step="any"
              />
              <select
                className="input-field concentration-unit"
                value={formData.concentrationUnit}
                onChange={(e) => handleChange("concentrationUnit", e.target.value)}
              >
                {CONCENTRATION_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            {errors.concentrationValue && (
              <span className="error-text">{errors.concentrationValue}</span>
            )}
          </div>

          {/* Form and Route - side by side */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Pharmaceutical Form <span className="required">*</span>
              </label>
              <select
                className={`input-field ${errors.form ? "input-error" : ""}`}
                value={formData.form}
                onChange={(e) => handleChange("form", e.target.value)}
              >
                <option value="">Select form...</option>
                {FORMS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              {errors.form && (
                <span className="error-text">{errors.form}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Route of Administration <span className="required">*</span>
              </label>
              <select
                className={`input-field ${errors.route ? "input-error" : ""}`}
                value={formData.route}
                onChange={(e) => handleChange("route", e.target.value)}
              >
                <option value="">Select route...</option>
                {ROUTES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.route && (
                <span className="error-text">{errors.route}</span>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="form-group">
            <label className="form-label">
              Ingredients <span className="required">*</span>
            </label>
            {errors.ingredients && (
              <span className="error-text">{errors.ingredients}</span>
            )}
            <div className="ingredients-list">
              {formData.ingredients.map((ing, i) => (
                <IngredientInput
                  key={i}
                  index={i}
                  ingredient={ing}
                  onUpdate={handleIngredientUpdate}
                  onRemove={handleIngredientRemove}
                  canRemove={formData.ingredients.length > 1}
                />
              ))}
            </div>
            <button
              type="button"
              className="btn-add-ingredient"
              onClick={addIngredient}
            >
              + Add Another Ingredient
            </button>
          </div>

          {/* Frequency and Batch Size - side by side */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Compounding Frequency <span className="required">*</span>
              </label>
              <select
                className={`input-field ${errors.frequency ? "input-error" : ""}`}
                value={formData.frequency}
                onChange={(e) => handleChange("frequency", e.target.value)}
              >
                <option value="">Select frequency...</option>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              {errors.frequency && (
                <span className="error-text">{errors.frequency}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Typical Batch Size <span className="required">*</span>
              </label>
              <div className="batch-size-wrapper">
                <input
                  type="number"
                  className={`input-field ${errors.batchSize ? "input-error" : ""}`}
                  placeholder="e.g. 30"
                  value={formData.batchSize}
                  onChange={(e) => handleChange("batchSize", e.target.value)}
                  min="1"
                />
                <span className="batch-size-label">units per batch</span>
              </div>
              {errors.batchSize && (
                <span className="error-text">{errors.batchSize}</span>
              )}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary btn-generate">
            Generate Risk Assessment &rarr;
          </button>
        </form>

        {/* Example buttons */}
        <div className="examples-section">
          <p className="examples-label">Or try an example:</p>
          <div className="examples-buttons">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                className="btn-example"
                onClick={() => loadExample(ex)}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
