import { useState, useEffect } from "react";
import { listAssessments, approveAssessment, rejectAssessment } from "../services/api";

export default function ApprovalQueue({ user, onLogout }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectModalFor, setRejectModalFor] = useState(null);

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

  function openRejectModal(assessment) {
    setRejectModalFor(assessment);
    setRejectNotes("");
  }

  function closeRejectModal() {
    setRejectModalFor(null);
    setRejectNotes("");
  }

  async function handleReject() {
    if (!rejectModalFor) return;
    setRejectingId(rejectModalFor.id);
    setError(null);
    try {
      await rejectAssessment(rejectModalFor.id, rejectNotes || "Returned for updates");
      setAssessments((prev) => prev.filter((a) => a.id !== rejectModalFor.id));
      closeRejectModal();
    } catch (err) {
      setError("Reject failed: " + err.message);
    } finally {
      setRejectingId(null);
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
              <div className="approval-card-actions">
                <button
                  className="btn-primary btn-approve"
                  onClick={() => handleApprove(a)}
                  disabled={approvingId === a.id}
                >
                  {approvingId === a.id ? "Approving..." : "Approve"}
                </button>
                <button
                  className="btn-secondary btn-reject"
                  onClick={() => openRejectModal(a)}
                  disabled={rejectingId === a.id}
                  title="Return to pharmacist to update the product"
                >
                  {rejectingId === a.id ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModalFor && (
        <div className="approval-reject-modal-overlay" onClick={closeRejectModal}>
          <div className="approval-reject-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject assessment</h3>
            <p className="approval-reject-product">
              {rejectModalFor.mfr?.productName} {rejectModalFor.mfr?.concentration && rejectModalFor.mfr.concentration}
            </p>
            <p className="approval-reject-hint">
              The assessment will return to Draft. The pharmacist can update the product and resubmit.
            </p>
            <label className="approval-reject-label">Reason (optional, visible in audit):</label>
            <textarea
              className="approval-reject-notes"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. Please correct PPE section and resubmit."
              rows={3}
            />
            <div className="approval-reject-buttons">
              <button className="btn-secondary" onClick={closeRejectModal}>Cancel</button>
              <button className="btn-primary btn-reject-confirm" onClick={handleReject}>
                Reject & return to pharmacist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
