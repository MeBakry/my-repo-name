import { useState, useEffect } from "react";
import { listMFRs, getMFR, isAuthError } from "../services/api";

// ─── Status helpers ──────────────────────────────────────────────────────────

function getMFRStatus(mfr) {
  if (!mfr.assessments || mfr.assessments.length === 0) return "NO_ASSESSMENT";
  const latest = mfr.assessments[0];
  if (latest.status === "APPROVED") {
    if (latest.nextReviewDate && new Date(latest.nextReviewDate) < new Date()) {
      return "REVIEW_DUE";
    }
    return "APPROVED";
  }
  if (latest.status === "EXPIRED") return "REVIEW_DUE";
  if (latest.status === "PENDING_REVIEW") return "PENDING_REVIEW";
  return "DRAFT";
}

const STATUS_CONFIG = {
  APPROVED:       { label: "Approved",       cls: "status-approved",    icon: "✓" },
  PENDING_REVIEW: { label: "Pending Review", cls: "status-pending",     icon: "⏳" },
  DRAFT:          { label: "Draft",          cls: "status-draft-badge", icon: "✏" },
  REVIEW_DUE:     { label: "Review Due",     cls: "status-expired",     icon: "⚠" },
  NO_ASSESSMENT:  { label: "No Assessment",  cls: "status-none",        icon: "—" },
};

const RISK_CONFIG = {
  A: { label: "Level A", cls: "risk-a" },
  B: { label: "Level B", cls: "risk-b" },
  C: { label: "Level C", cls: "risk-c" },
};

// ─── Parse concentration string back to value + unit ────────────────────────
// "400mg" → { value: "400", unit: "mg" }
// "2.5%" → { value: "2.5", unit: "%" }
export function parseConcentration(str) {
  if (!str) return { value: "", unit: "%" };
  const match = str.match(/^([\d.]+)\s*(.*)$/);
  if (match) return { value: match[1], unit: match[2] || "%" };
  return { value: str, unit: "%" };
}

// ─── Map backend MFR ingredient to form ingredient format ───────────────────
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

// ─── Dashboard component ─────────────────────────────────────────────────────

export default function Dashboard({ onNewFormulation, onLoadMFR, onViewAssessment, onRefreshAuth, authStatus }) {
  const [mfrs, setMfrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    if (authStatus !== "ready") {
      setLoading(false);
      return;
    }
    fetchMFRs();
  }, [authStatus]);

  async function fetchMFRs() {
    try {
      setLoading(true);
      setError(null);
      const data = await listMFRs({ limit: 100 });
      setMfrs(data.mfrs || data || []);
    } catch (err) {
      if (isAuthError(err) && onRefreshAuth) {
        const ok = await onRefreshAuth();
        if (ok) return fetchMFRs();
      }
      setError("Could not load formulations: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMFRClick(mfr) {
    const status = getMFRStatus(mfr);
    setLoadingId(mfr.id);

    try {
      // Always fetch full MFR with ingredient data
      const full = await getMFR(mfr.id);

      const { value, unit } = parseConcentration(full.concentration);
      const formData = {
        mfrId: full.id,
        protocolNumber: full.protocolNumber || "",
        productName: full.productName,
        concentrationValue: value,
        concentrationUnit: unit,
        form: full.form,
        route: full.route || "",
        frequency: full.frequency || "",
        batchSize: full.batchSize ? String(full.batchSize) : "",
        ingredients: full.ingredients?.length
          ? full.ingredients.map(mapIngredient)
          : [{ name: "", quantity: "", matched: false, data: null }],
      };

      if (status === "APPROVED") {
        // Show the existing approved assessment — no regeneration needed
        onViewAssessment(full, formData);
      } else {
        // DRAFT, REVIEW_DUE, PENDING_REVIEW, NO_ASSESSMENT → open in form
        onLoadMFR(formData, status);
      }
    } catch (err) {
      if (isAuthError(err) && onRefreshAuth) {
        const ok = await onRefreshAuth();
        if (ok) return handleMFRClick(mfr);
      }
      setError("Could not load formulation: " + err.message);
    } finally {
      setLoadingId(null);
    }
  }

  // Filter + search
  const displayed = mfrs.filter((m) => {
    const status = getMFRStatus(m);
    const matchesFilter = filter === "ALL" || status === filter;
    const matchesSearch =
      !search ||
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      (m.protocolNumber || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Summary counts
  const counts = mfrs.reduce((acc, m) => {
    const s = getMFRStatus(m);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="dashboard">
      {/* Dashboard header */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Formulation Library</h2>
          <p className="dashboard-subtitle">
            {mfrs.length} formulation{mfrs.length !== 1 ? "s" : ""} on record
          </p>
        </div>
        <button className="btn-primary btn-new-formulation" onClick={onNewFormulation}>
          + New Formulation
        </button>
      </div>

      {/* Summary stats */}
      {mfrs.length > 0 && (
        <div className="dashboard-stats">
          {[
            { key: "APPROVED",      label: "Approved",      cls: "stat-green" },
            { key: "DRAFT",         label: "Draft",         cls: "stat-muted" },
            { key: "PENDING_REVIEW",label: "Pending Review",cls: "stat-yellow" },
            { key: "REVIEW_DUE",    label: "Review Due",    cls: "stat-red" },
            { key: "NO_ASSESSMENT", label: "No Assessment", cls: "stat-muted" },
          ].map(({ key, label, cls }) =>
            counts[key] ? (
              <button
                key={key}
                className={`dashboard-stat ${cls} ${filter === key ? "active" : ""}`}
                onClick={() => setFilter(filter === key ? "ALL" : key)}
                title={`Filter by: ${label}`}
              >
                <span className="stat-num">{counts[key]}</span>
                <span className="stat-label">{label}</span>
              </button>
            ) : null
          )}
          {filter !== "ALL" && (
            <button className="dashboard-stat stat-muted" onClick={() => setFilter("ALL")}>
              <span className="stat-num">×</span>
              <span className="stat-label">Clear filter</span>
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="dashboard-search-row">
        <input
          type="text"
          className="input-field dashboard-search"
          placeholder="Search by product name or protocol number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="dashboard-error">
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="dashboard-loading">Loading formulations...</div>
      )}

      {/* Demo mode notice */}
      {!loading && authStatus !== "ready" && (
        <div className="dashboard-demo-notice">
          <strong>Demo mode</strong> — Connect to the backend to see your saved formulations.
          The library is empty in demo mode.
        </div>
      )}

      {/* Empty state */}
      {!loading && authStatus === "ready" && mfrs.length === 0 && (
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">🧪</div>
          <h3>No formulations yet</h3>
          <p>Create your first formulation to get started.</p>
          <button className="btn-primary" onClick={onNewFormulation}>
            + New Formulation
          </button>
        </div>
      )}

      {/* MFR list */}
      {!loading && displayed.length > 0 && (
        <div className="mfr-list">
          {displayed.map((mfr) => {
            const status = getMFRStatus(mfr);
            const statusCfg = STATUS_CONFIG[status];
            const latest = mfr.assessments?.[0];
            const riskCfg = latest?.riskLevel ? RISK_CONFIG[latest.riskLevel] : null;
            const isLoading = loadingId === mfr.id;
            const reviewDue = latest?.nextReviewDate
              ? new Date(latest.nextReviewDate).toLocaleDateString("en-CA")
              : null;

            return (
              <button
                key={mfr.id}
                className={`mfr-card ${isLoading ? "mfr-card-loading" : ""}`}
                onClick={() => handleMFRClick(mfr)}
                disabled={isLoading}
              >
                <div className="mfr-card-main">
                  <div className="mfr-card-name">
                    {mfr.productName}
                    {mfr.concentration && (
                      <span className="mfr-concentration"> {mfr.concentration}</span>
                    )}
                  </div>
                  <div className="mfr-card-meta">
                    {mfr.protocolNumber && (
                      <span className="mfr-protocol">{mfr.protocolNumber}</span>
                    )}
                    <span className="mfr-form">{mfr.form}</span>
                    {mfr.route && <span className="mfr-route">{mfr.route}</span>}
                    <span className="mfr-created">
                      by {mfr.createdBy?.name || "—"}
                    </span>
                  </div>
                  {status === "REVIEW_DUE" && reviewDue && (
                    <div className="mfr-review-warning">
                      ⚠ Annual review overdue since {reviewDue}
                    </div>
                  )}
                  {status === "APPROVED" && reviewDue && (
                    <div className="mfr-review-info">
                      Next review: {reviewDue}
                    </div>
                  )}
                </div>

                <div className="mfr-card-right">
                  {riskCfg && (
                    <span className={`mfr-risk ${riskCfg.cls}`}>{riskCfg.label}</span>
                  )}
                  <span className={`mfr-status-badge ${statusCfg.cls}`}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                  {isLoading ? (
                    <span className="mfr-action-hint">Loading...</span>
                  ) : (
                    <span className="mfr-action-hint">
                      {status === "APPROVED" && "View Assessment →"}
                      {status === "DRAFT" && "Continue →"}
                      {status === "PENDING_REVIEW" && "View →"}
                      {status === "REVIEW_DUE" && "Start Review →"}
                      {status === "NO_ASSESSMENT" && "Generate →"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filtered empty state */}
      {!loading && authStatus === "ready" && mfrs.length > 0 && displayed.length === 0 && (
        <div className="dashboard-empty">
          <p>No formulations match your search or filter.</p>
          <button className="btn-secondary" onClick={() => { setSearch(""); setFilter("ALL"); }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
