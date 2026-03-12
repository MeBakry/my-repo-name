import { useState, useCallback, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ApprovalQueue from "./components/ApprovalQueue";
import MFRForm from "./components/MFRForm";
import LoadingSpinner from "./components/LoadingSpinner";
import RiskAssessmentDisplay from "./components/RiskAssessmentDisplay";
import { generateRiskAssessment } from "./services/aiService";
import {
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  createMFR,
  updateMFR,
  getMFR,
  generateAssessmentFromMFR,
  getAssessment,
  submitAssessment,
  deactivateAssessment,
  checkBackendHealth,
  isAuthError,
  searchIngredients,
} from "./services/api";
import { buildFormDataFromMfr } from "./utils/mfrFormData";

// UUID pattern — local demo DB uses numeric ids (1,2,3), backend uses UUIDs
const isUUID = (id) => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const SCREENS = {
  DASHBOARD: "dashboard",
  FORM:      "form",
  LOADING:   "loading",
  RESULTS:   "results",
};

export default function App() {
  const [authUser, setAuthUser]       = useState(null);
  const [authStatus, setAuthStatus]   = useState("connecting");
  const [loginLoading, setLoginLoading] = useState(false);
  const [screen, setScreen]           = useState(SCREENS.DASHBOARD);
  const [formData, setFormData]       = useState(null);
  const [assessment, setAssessment]  = useState(null);
  const [error, setError]             = useState(null);
  const [formMode, setFormMode]       = useState("new");

  // ─── Init: check backend + existing token ─────────────────────────────────
  const [initComplete, setInitComplete] = useState(false);
  useEffect(() => {
    async function init() {
      try {
        const health = await checkBackendHealth();
        if (!health.available) {
          setAuthStatus("demo");
          setInitComplete(true);
          return;
        }
        setAuthStatus("ready");
        if (isAuthenticated()) {
          try {
            const user = await getCurrentUser();
            setAuthUser(user);
          } catch {
            logout(); // stale token
          }
        }
      } catch {
        setAuthStatus("demo");
      }
      setInitComplete(true);
    }
    init();
  }, []);

  // ─── Login ───────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async (emailOrUsername, password) => {
    setLoginLoading(true);
    setError(null);
    try {
      await login(emailOrUsername.trim(), password);
      const user = await getCurrentUser();
      setAuthUser(user);
    } finally {
      setLoginLoading(false);
    }
  }, []);

  // ─── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    logout();
    setAuthUser(null);
    setScreen(SCREENS.DASHBOARD);
    setFormData(null);
    setAssessment(null);
  }, []);

  // ─── Refresh auth (e.g. token expired) ───────────────────────────────────
  const refreshAuth = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setAuthUser(user);
      return true;
    } catch {
      handleLogout();
      return false;
    }
  }, [handleLogout]);

  // ─── Dashboard → New Formulation ─────────────────────────────────────────
  const handleNewFormulation = useCallback(() => {
    setFormData(null);
    setFormMode("new");
    setScreen(SCREENS.FORM);
  }, []);

  // ─── Dashboard → Load existing MFR ───────────────────────────────────────
  const handleLoadMFR = useCallback((preFilledData, status) => {
    setFormData(preFilledData);
    setFormMode(status === "REVIEW_DUE" ? "review_due" :
                status === "NO_ASSESSMENT" ? "no_assessment" : "draft");
    setScreen(SCREENS.FORM);
  }, []);

  // ─── Open existing MFR (e.g. when duplicate detected — open instead of create)
  const handleOpenExistingMFR = useCallback(async (mfrId) => {
    setError(null);
    try {
      const full = await getMFR(mfrId);
      const formDataFromMfr = buildFormDataFromMfr(full);
      setFormData(formDataFromMfr);
      setFormMode("draft");
      setScreen(SCREENS.FORM);
    } catch (err) {
      setError("Could not load formulation: " + err.message);
    }
  }, []);

  // ─── Dashboard → View approved assessment ─────────────────────────────────
  const handleViewAssessment = useCallback(async (mfr, formDataForDisplay) => {
    setFormData(formDataForDisplay);
    setScreen(SCREENS.LOADING);
    try {
      const latestAssessmentId = mfr.assessments?.[0]?.id;
      if (latestAssessmentId) {
        const saved = await getAssessment(latestAssessmentId);
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

  // ─── Submit for Review (pharmacist) ──────────────────────────────────────
  const handleSubmitForReview = useCallback(async (assessmentId) => {
    try {
      await submitAssessment(assessmentId);
      setAssessment((prev) =>
        prev?.savedRecord?.id === assessmentId
          ? { ...prev, savedRecord: { ...prev.savedRecord, status: "PENDING_REVIEW" } }
          : prev
      );
    } catch (err) {
      setError("Submit failed: " + err.message);
    }
  }, []);

  const handleBack = useCallback(() => {
    setScreen(SCREENS.DASHBOARD);
  }, []);

  // ─── Remove assessment (pharmacist) ───────────────────────────────────────
  const handleRemoveAssessment = useCallback(async (assessmentId) => {
    if (!window.confirm("Remove this assessment? It will no longer appear in the library. You can create a new assessment for this formulation later.")) return;
    try {
      await deactivateAssessment(assessmentId);
      handleBack();
    } catch (err) {
      setError("Remove failed: " + err.message);
    }
  }, [handleBack]);

  // ─── Form submit → Generate + Save ───────────────────────────────────────
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

    if (authStatus === "ready" && isAuthenticated()) {
      try {
        const resolved = await Promise.all(
          data.ingredients
            .filter((ing) => ing.name.trim())
            .map(async (ing) => {
              let backendId = ing.data?.id;
              if (!backendId || !isUUID(backendId)) {
                const matches = await searchIngredients(ing.name.trim());
                backendId = matches?.[0]?.id ?? null;
              }
              return backendId ? { ingredientId: backendId, quantity: ing.quantity, isActiveIngredient: true } : null;
            })
        );
        const ingredientIds = resolved.filter(Boolean);

        if (ingredientIds.length === 0) {
          throw new Error("Could not resolve any ingredients to the database. Check that ingredient names match.");
        }

        let mfr;
        if (data.mfrId) {
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
        setFormData({ ...data, mfrId: mfr.id });
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

    try {
      const result = await generateRiskAssessment(data, ingredientHazards);
      setAssessment(result);
      setScreen(SCREENS.RESULTS);
    } catch (err) {
      setError(err.message);
      setScreen(SCREENS.FORM);
    }
  }, [authStatus]);

  const handleRegenerate = useCallback(() => {
    if (formData) handleSubmit(formData);
  }, [formData, handleSubmit]);

  const statusLabel = {
    connecting: { text: "Connecting...",        cls: "status-connecting" },
    ready:      { text: "Connected · Saving",   cls: "status-ready"      },
    demo:       { text: "Demo mode",            cls: "status-demo"       },
  }[authStatus];

  const formTitle = {
    new:          "New Formulation",
    draft:        "Continue Assessment",
    review_due:   "Annual Review",
    no_assessment:"Generate Assessment",
  }[formMode] || "Formulation";

  // ─── Initial loading ─────────────────────────────────────────────────────
  if (!initComplete) {
    return (
      <div className="app app-loading">
        <div className="loading-screen">Loading...</div>
      </div>
    );
  }

  // ─── Login screen (no user) ──────────────────────────────────────────────
  if (!authUser) {
    return (
      <div className="app app-login">
        <Login
          onLogin={handleLogin}
          onError={setError}
          loading={loginLoading}
          backendAvailable={authStatus === "ready"}
        />
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button className="error-dismiss" onClick={() => setError(null)}>&times;</button>
          </div>
        )}
      </div>
    );
  }

  // ─── Supervisor / Admin → Approval Queue ─────────────────────────────────
  if (authUser && ["SUPERVISOR", "ADMIN"].includes(authUser.role)) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">
            <span className="title-icon">🧪</span> Pharmacy Risk Assessment — Supervisor
          </h1>
        </header>
        <main className="app-main">
          <ApprovalQueue user={authUser} onLogout={handleLogout} />
        </main>
      </div>
    );
  }

  // ─── Pharmacist → Main app (Dashboard, Form, Results) ─────────────────────
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
            <span className="user-badge">{authUser?.name || authUser?.email}</span>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Sign out
            </button>
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
                  ⚠ This assessment is overdue for its annual review.
                </div>
              )}
              {formMode === "draft" && (
                <div className="form-mode-banner draft-banner">
                  ✏ This formulation has an unfinished assessment.
                </div>
              )}
            </div>
            <MFRForm
              key={formData?.mfrId ?? "new"}
              onSubmit={handleSubmit}
              authStatus={authStatus}
              initialData={formData}
              onOpenExisting={authStatus === "ready" ? handleOpenExistingMFR : undefined}
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
            onSubmitForReview={handleSubmitForReview}
            onRemoveAssessment={authStatus === "ready" ? handleRemoveAssessment : undefined}
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
