import { useState, useCallback, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import MFRForm from "./components/MFRForm";
import LoadingSpinner from "./components/LoadingSpinner";
import RiskAssessmentDisplay from "./components/RiskAssessmentDisplay";
import { generateRiskAssessment } from "./services/aiService";
import {
  login,
  isAuthenticated,
  createMFR,
  updateMFR,
  generateAssessmentFromMFR,
  getAssessment,
  checkBackendHealth,
  isAuthError,
} from "./services/api";

const SCREENS = {
  DASHBOARD: "dashboard",
  FORM:      "form",
  LOADING:   "loading",
  RESULTS:   "results",
};

export default function App() {
  const [screen, setScreen]       = useState(SCREENS.DASHBOARD);
  const [formData, setFormData]   = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [error, setError]         = useState(null);
  const [authStatus, setAuthStatus] = useState("connecting");
  // Context about why we're on the form screen
  const [formMode, setFormMode]   = useState("new"); // "new" | "draft" | "review_due" | "no_assessment"

  // ─── Auto-login on mount ───────────────────────────────────────────────────
  // Always re-login when backend is available (refresh stale token from localStorage)
  useEffect(() => {
    async function init() {
      try {
        const health = await checkBackendHealth();
        if (!health.available) { setAuthStatus("demo"); return; }
        await login("pharmacist@demo.com", "demo123");
        setAuthStatus("ready");
      } catch {
        setAuthStatus("demo");
      }
    }
    init();
  }, []);

  // ─── Refresh auth (e.g. after token expired mid-session) ───────────────────
  const refreshAuth = useCallback(async () => {
    try {
      await login("pharmacist@demo.com", "demo123");
      setAuthStatus("ready");
      return true;
    } catch {
      setAuthStatus("demo");
      return false;
    }
  }, []);

  // ─── Dashboard → New Formulation ──────────────────────────────────────────
  const handleNewFormulation = useCallback(() => {
    setFormData(null);
    setFormMode("new");
    setScreen(SCREENS.FORM);
  }, []);

  // ─── Dashboard → Load existing MFR (Draft / Review Due / No Assessment) ───
  // formData is pre-populated from the existing MFR record
  const handleLoadMFR = useCallback((preFilledData, status) => {
    setFormData(preFilledData);
    setFormMode(status === "REVIEW_DUE" ? "review_due" :
                status === "NO_ASSESSMENT" ? "no_assessment" : "draft");
    setScreen(SCREENS.FORM);
  }, []);

  // ─── Dashboard → View approved assessment directly ────────────────────────
  const handleViewAssessment = useCallback(async (mfr, formDataForDisplay) => {
    setFormData(formDataForDisplay);
    setScreen(SCREENS.LOADING);
    try {
      // Fetch the latest approved assessment content
      const latestAssessmentId = mfr.assessments?.[0]?.id;
      if (latestAssessmentId) {
        const saved = await getAssessment(latestAssessmentId);
        // Reconstruct the assessment shape the display component expects
        setAssessment({
          ...(saved.frequencyAssessment || {}),
          complexity: {
            level: saved.complexityLevel,
            justification: saved.complexityJustification,
          },
          frequencyAssessment: saved.frequencyAssessment,
          exposureRisks: saved.exposureRisks,
          recommendedPPE: saved.recommendedPPE,
          facilityControls: saved.facilityControls,
          riskLevel: { level: saved.riskLevel, rationale: saved.rationale },
          references: saved.references || [],
          generatedAt: saved.generatedAt,
          savedRecord: saved,
          source: "backend_saved",
          rawText: "",
        });
      }
      setScreen(SCREENS.RESULTS);
    } catch (err) {
      setError("Could not load assessment: " + err.message);
      setScreen(SCREENS.DASHBOARD);
    }
  }, []);

  // ─── Form submit → Generate + Save ────────────────────────────────────────
  const handleSubmit = useCallback(async (data) => {
    setFormData(data);
    setScreen(SCREENS.LOADING);
    setError(null);

    const ingredientHazards = data.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      ...(ing.data || {
        niosh: "unknown",
        nioshDescription: "Not in database",
        reproductiveToxicity: false,
        ghsCategory: null,
        whmisHazards: [],
        ventilationRequired: false,
        ventilationType: "unknown",
        physicalForm: "unknown",
        exposureRoutes: { skin: false, eye: false, inhalation: false, oral: false },
      }),
    }));

    // Full save flow
    if (authStatus === "ready" && isAuthenticated()) {
      try {
        const ingredientIds = data.ingredients
          .filter((ing) => ing.data?.id)
          .map((ing) => ({
            ingredientId: ing.data.id,
            quantity: ing.quantity,
            isActiveIngredient: true,
          }));

        let mfr;
        if (data.mfrId) {
          // Existing MFR — update it rather than creating a duplicate
          mfr = await updateMFR(data.mfrId, {
            productName: data.productName,
            concentration: data.concentration,
            protocolNumber: data.protocolNumber || null,
            form: data.form,
            route: data.route,
            frequency: data.frequency,
            batchSize: parseInt(data.batchSize),
            ingredientIds,
          });
        } else {
          // Brand new MFR
          mfr = await createMFR({
            productName: data.productName,
            concentration: data.concentration,
            protocolNumber: data.protocolNumber || null,
            form: data.form,
            route: data.route,
            frequency: data.frequency,
            batchSize: parseInt(data.batchSize),
            ingredientIds,
          });
        }

        const result = await generateAssessmentFromMFR(mfr.id);
        setAssessment({
          ...result.assessment,
          rawText: JSON.stringify(result.assessment),
          generatedAt: result.generatedAt || new Date().toISOString(),
          savedRecord: result,
          source: "backend_saved",
        });
        setScreen(SCREENS.RESULTS);
        return;
      } catch (err) {
        console.warn("Full save flow failed, falling back to preview:", err.message);
      }
    }

    // Fallback: preview mode
    try {
      const result = await generateRiskAssessment(data, ingredientHazards);
      setAssessment(result);
      setScreen(SCREENS.RESULTS);
    } catch (err) {
      setError(err.message);
      setScreen(SCREENS.FORM);
    }
  }, [authStatus]);

  // ─── Results → Back ────────────────────────────────────────────────────────
  // Always go back to dashboard so the updated status is reflected
  const handleBack = useCallback(() => {
    setScreen(SCREENS.DASHBOARD);
  }, []);

  const handleRegenerate = useCallback(() => {
    if (formData) handleSubmit(formData);
  }, [formData, handleSubmit]);

  // ─── Status badge ──────────────────────────────────────────────────────────
  const statusLabel = {
    connecting: { text: "Connecting...",        cls: "status-connecting" },
    ready:      { text: "Connected · Saving",   cls: "status-ready"      },
    demo:       { text: "Demo mode",            cls: "status-demo"       },
  }[authStatus];

  // ─── Form screen title context ─────────────────────────────────────────────
  const formTitle = {
    new:          "New Formulation",
    draft:        "Continue Assessment",
    review_due:   "Annual Review",
    no_assessment:"Generate Assessment",
  }[formMode] || "Formulation";

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            {screen !== SCREENS.DASHBOARD && (
              <button className="btn-back-header" onClick={handleBack} title="Back to library">
                ← Library
              </button>
            )}
            <h1 className="app-title">
              <span className="title-icon">🧪</span> Pharmacy Risk Assessment
            </h1>
          </div>
          <div className="header-badges">
            <span className={`status-badge ${statusLabel.cls}`}>{statusLabel.text}</span>
            <span className="poc-badge">Dev</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <strong>Error:</strong> {error}
            <button className="error-dismiss" onClick={() => setError(null)}>&times;</button>
          </div>
        </div>
      )}

      <main className="app-main">
        {screen === SCREENS.DASHBOARD && (
          <Dashboard
            authStatus={authStatus}
            onNewFormulation={handleNewFormulation}
            onLoadMFR={handleLoadMFR}
            onViewAssessment={handleViewAssessment}
            onRefreshAuth={refreshAuth}
          />
        )}

        {screen === SCREENS.FORM && (
          <>
            <div className="form-screen-header">
              <h2 className="form-screen-title">{formTitle}</h2>
              {formMode === "review_due" && (
                <div className="form-mode-banner review-due-banner">
                  ⚠ This assessment is overdue for its annual review. The form is pre-filled with the existing formulation data. Review, adjust if anything changed, then generate a new version.
                </div>
              )}
              {formMode === "draft" && (
                <div className="form-mode-banner draft-banner">
                  ✏ This formulation has an unfinished assessment. Review the details and generate to complete it.
                </div>
              )}
            </div>
            <MFRForm
              onSubmit={handleSubmit}
              authStatus={authStatus}
              initialData={formData}
            />
          </>
        )}

        {screen === SCREENS.LOADING && <LoadingSpinner />}

        {screen === SCREENS.RESULTS && assessment && (
          <RiskAssessmentDisplay
            assessment={assessment}
            formData={formData}
            onBack={handleBack}
            onRegenerate={handleRegenerate}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Pharmacy Risk Assessment Generator &mdash; Development Build &mdash;
          Not for clinical use without pharmacist review
        </p>
      </footer>
    </div>
  );
}
