import { useState, useEffect } from "react";
import { listAssessments, approveAssessment } from "../services/api";

export default function ApprovalQueue({ user, onLogout }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    try {
      setLoading(true);
      const data = await listAssessments({ status: "PENDING_REVIEW", limit: 50 });
      setAssessments(data.assessments || []);
    } catch (err) {
      setError("Could not load assessments: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(assessment) {
    setApprovingId(assessment.id);
    setError(null);
    try {
      await approveAssessment(assessment.id, "Approved by supervisor");
      setAssessments((prev) => prev.filter((a) => a.id !== assessment.id));
    } catch (err) {
      setError("Approval failed: " + err.message);
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="approval-queue">
      <div className="approval-header">
        <h2 className="approval-title">Supervisor — Pending Approvals</h2>
        <p className="approval-subtitle">
          Assessments submitted for your review
        </p>
        <div className="approval-user">
          Signed in as <strong>{user?.name || user?.email}</strong>
          <button type="button" className="btn-logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <div className="approval-error">
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {loading && <div className="approval-loading">Loading...</div>}

      {!loading && assessments.length === 0 && (
        <div className="approval-empty">
          <div className="approval-empty-icon">✓</div>
          <h3>All caught up</h3>
          <p>No assessments pending your approval.</p>
          <p className="approval-empty-hint">
            Pharmacists submit assessments from their view. When one is submitted, it will appear here.
          </p>
        </div>
      )}

      {!loading && assessments.length > 0 && (
        <div className="approval-list">
          {assessments.map((a) => (
            <div key={a.id} className="approval-card">
              <div className="approval-card-main">
                <div className="approval-card-product">
                  {a.mfr?.productName}
                  {a.mfr?.concentration && (
                    <span className="approval-concentration"> {a.mfr.concentration}</span>
                  )}
                </div>
                <div className="approval-card-meta">
                  <span className="approval-risk">Level {a.riskLevel}</span>
                  <span className="approval-version">v{a.version}</span>
                  <span className="approval-creator">Submitted by {a.createdBy?.name}</span>
                  <span className="approval-form">{a.mfr?.form}</span>
                </div>
              </div>
              <button
                className="btn-primary btn-approve"
                onClick={() => handleApprove(a)}
                disabled={approvingId === a.id}
              >
                {approvingId === a.id ? "Approving..." : "Approve"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
