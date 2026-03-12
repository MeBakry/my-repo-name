import { useState } from "react";

function formatPPELabel(value) {
  if (!value) return "N/A";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function RiskLevelBadge({ level }) {
  const colors = { A: "level-a", B: "level-b", C: "level-c" };
  const labels = {
    A: "LEVEL A (Low Risk)",
    B: "LEVEL B (Moderate Risk)",
    C: "LEVEL C (High Risk)",
  };
  return (
    <span className={`risk-badge ${colors[level] || "level-b"}`}>
      {labels[level] || `LEVEL ${level}`}
    </span>
  );
}

function HazardCard({ ingredient }) {
  const isHazardous = ingredient.data && ingredient.data.niosh !== "none";

  return (
    <div className={`hazard-card ${isHazardous ? "hazardous" : "safe"}`}>
      <h4 className="hazard-ingredient-name">
        {ingredient.name}{" "}
        <span className="hazard-quantity">({ingredient.quantity})</span>
      </h4>
      {ingredient.data ? (
        <div className="hazard-details">
          <div className={`hazard-item ${ingredient.data.niosh !== "none" ? "warning" : "ok"}`}>
            <span className="hazard-icon">
              {ingredient.data.niosh !== "none" ? "\u26A0\uFE0F" : "\u2713"}
            </span>
            <span>
              <strong>NIOSH Classification:</strong>{" "}
              {ingredient.data.niosh === "none"
                ? "None"
                : `${ingredient.data.niosh.replace("_", " ").toUpperCase()} - ${ingredient.data.nioshDescription}`}
            </span>
          </div>
          <div className={`hazard-item ${ingredient.data.reproductiveToxicity ? "warning" : "ok"}`}>
            <span className="hazard-icon">
              {ingredient.data.reproductiveToxicity ? "\u26A0\uFE0F" : "\u2713"}
            </span>
            <span>
              <strong>Reproductive Toxicity:</strong>{" "}
              {ingredient.data.reproductiveToxicity
                ? `YES (GHS Category ${ingredient.data.ghsCategory})`
                : "NO"}
            </span>
          </div>
          {ingredient.data.whmisHazards.length > 0 && (
            <div className="hazard-item warning">
              <span className="hazard-icon">{"\u26A0\uFE0F"}</span>
              <span>
                <strong>WHMIS Health Hazards:</strong>{" "}
                {ingredient.data.whmisHazards.join("; ")}
              </span>
            </div>
          )}
          {ingredient.data.whmisHazards.length === 0 && (
            <div className="hazard-item ok">
              <span className="hazard-icon">{"\u2713"}</span>
              <span>
                <strong>WHMIS Health Hazards:</strong> None
              </span>
            </div>
          )}
          <div className={`hazard-item ${ingredient.data.ventilationRequired ? "warning" : "ok"}`}>
            <span className="hazard-icon">
              {ingredient.data.ventilationRequired ? "\u2713" : "\u2713"}
            </span>
            <span>
              <strong>Ventilation Required:</strong>{" "}
              {ingredient.data.ventilationRequired
                ? `YES (${formatPPELabel(ingredient.data.ventilationType)})`
                : "NO"}
            </span>
          </div>
          <div className="hazard-item info">
            <span className="hazard-icon">{"\uD83D\uDCCB"}</span>
            <span>
              <strong>Physical Form:</strong>{" "}
              {formatPPELabel(ingredient.data.physicalForm)}
            </span>
          </div>
        </div>
      ) : (
        <p className="hazard-no-data">
          Not found in database. Hazard data included in AI analysis based on ingredient name.
        </p>
      )}
    </div>
  );
}

export default function RiskAssessmentDisplay({
  assessment,
  formData,
  onBack,
  onRegenerate,
  onSubmitForReview,
  onRemoveAssessment,
}) {
  const [copied, setCopied] = useState(false);

  function openPrintView() {
    const a = assessment;
    const productLine = [formData.productName, formData.concentration, formData.form].filter(Boolean).join(" ");
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Risk Assessment — ${escapeHtml(productLine || "Product")}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Georgia", "Times New Roman", serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #1a1a1a;
      max-width: 720px;
      margin: 0 auto;
      padding: 28px 32px 40px;
      background: #fff;
    }
    h1 {
      font-size: 18pt;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #0d2137;
      border-bottom: 2px solid #0d2137;
      padding-bottom: 10px;
      margin: 0 0 20px;
    }
    .meta {
      background: #f5f7f9;
      border-left: 4px solid #0d2137;
      padding: 14px 18px;
      margin-bottom: 28px;
      font-size: 10.5pt;
      color: #444;
    }
    .meta p { margin: 6px 0; }
    .meta p:first-child { margin-top: 0; }
    .meta p:last-child { margin-bottom: 0; }
    .meta strong { color: #1a1a1a; min-width: 100px; display: inline-block; }

    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 12pt;
      font-weight: 700;
      color: #0d2137;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #c9d1d9;
    }
    .section p {
      margin: 0 0 10px;
    }
    .section p:last-child { margin-bottom: 0; }

    .row { margin-bottom: 8px; }
    .row strong { display: inline-block; min-width: 140px; color: #333; }

    .rationale {
      white-space: pre-wrap;
      margin: 12px 0 0;
      padding: 14px 16px;
      background: #fafbfc;
      border-radius: 4px;
      border: 1px solid #e8ecf0;
      font-size: 10.5pt;
      line-height: 1.65;
    }
    .rationale br { display: block; content: ""; margin-top: 0.5em; }

    .level-a { color: #0a6b0a; font-weight: 700; font-size: 12pt; }
    .level-b { color: #b8860b; font-weight: 700; font-size: 12pt; }
    .level-c { color: #b22222; font-weight: 700; font-size: 12pt; }

    .ppe-list, .facility-list {
      list-style: none;
      padding: 0;
      margin: 0 0 8px;
    }
    .ppe-list li, .facility-list li {
      padding: 6px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      gap: 12px;
    }
    .ppe-list li:last-child, .facility-list li:last-child { border-bottom: none; }
    .ppe-list strong, .facility-list strong { min-width: 120px; flex-shrink: 0; color: #333; }

    ol.references { padding-left: 22px; margin: 8px 0 0; }
    ol.references li { margin-bottom: 6px; line-height: 1.5; }

    .disclaimer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #dde;
      font-size: 9pt;
      color: #666;
      line-height: 1.5;
    }

    @media print {
      body { padding: 16px 20px; max-width: none; }
      .section { page-break-inside: avoid; }
      .meta { background: #f5f5f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .rationale { background: #fafafa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <h1>Risk Assessment Record</h1>
  <div class="meta">
    <p><strong>Product</strong> ${escapeHtml(productLine || "—")}</p>
    <p><strong>Protocol</strong> ${escapeHtml(formData.protocolNumber || "—")}</p>
    <p><strong>Generated</strong> ${escapeHtml(new Date(a.generatedAt).toLocaleString())}</p>
    ${a.savedRecord ? `<p><strong>Status</strong> ${escapeHtml(a.savedRecord.status)} · Version ${escapeHtml(String(a.savedRecord.version))}</p>` : ""}
  </div>

  ${a.complexity ? `
  <div class="section">
    <h2 class="section-title">Complexity &amp; frequency</h2>
    <p class="row"><strong>Complexity</strong> ${escapeHtml(a.complexity.level)}</p>
    <p>${escapeHtml(a.complexity.justification)}</p>
    ${a.frequencyAssessment ? `<p class="row"><strong>Annual volume</strong> ${escapeHtml(a.frequencyAssessment.annualVolume)}</p><p class="row"><strong>Occasional small quantity</strong> ${a.frequencyAssessment.isOccasionalSmallQuantity ? "Yes" : "No"}</p>` : ""}
  </div>` : ""}

  ${a.exposureRisks && Object.keys(a.exposureRisks).length ? `
  <div class="section">
    <h2 class="section-title">Exposure risk</h2>
    ${Object.entries(a.exposureRisks).map(([route, info]) =>
      `<p class="row"><strong>${escapeHtml(route)}</strong> ${info.risk ? "Yes" : "Low"} — ${escapeHtml(info.explanation)}</p>`
    ).join("")}
  </div>` : ""}

  ${a.recommendedPPE ? `
  <div class="section">
    <h2 class="section-title">Recommended PPE</h2>
    <ul class="ppe-list">
      <li><strong>Gloves</strong> ${escapeHtml(a.recommendedPPE.gloves?.type || "—")}${a.recommendedPPE.gloves?.rationale ? " — " + escapeHtml(a.recommendedPPE.gloves.rationale) : ""}</li>
      <li><strong>Gown</strong> ${escapeHtml(a.recommendedPPE.gown?.type || "—")}</li>
      <li><strong>Respiratory</strong> ${escapeHtml(a.recommendedPPE.respiratory?.type || "—")}</li>
      <li><strong>Eye protection</strong> ${escapeHtml(a.recommendedPPE.eye?.type || "—")}</li>
      <li><strong>Eyewash / shower</strong> Eyewash: ${a.recommendedPPE.eyewashStation ? "Required" : "Not required"} · Safety shower: ${a.recommendedPPE.safetyShower ? "Required" : "Not required"}</li>
    </ul>
  </div>` : ""}

  ${a.facilityControls ? `
  <div class="section">
    <h2 class="section-title">Facility &amp; engineering controls</h2>
    <p>${escapeHtml(a.facilityControls.ventilation)}</p>
    <ul class="facility-list">
      <li><strong>Dedicated area</strong> ${escapeHtml(a.facilityControls.dedicatedArea)}</li>
      <li><strong>Contamination controls</strong> ${escapeHtml(a.facilityControls.contaminationControls)}</li>
      <li><strong>Spill kit</strong> ${a.facilityControls.spillKit ? "Required" : "Not required"}</li>
      <li><strong>BSC / CVE</strong> ${escapeHtml(a.facilityControls.bsc)}</li>
    </ul>
  </div>` : ""}

  ${a.riskLevel ? `
  <div class="section">
    <h2 class="section-title">Risk level</h2>
    <p><span class="level-${escapeHtml(a.riskLevel.level.toLowerCase())}">LEVEL ${escapeHtml(a.riskLevel.level)}</span></p>
    <div class="rationale">${escapeHtml(a.riskLevel.rationale).replace(/\n/g, "<br>")}</div>
  </div>` : ""}

  ${a.references?.length ? `
  <div class="section">
    <h2 class="section-title">References</h2>
    <ol class="references">${a.references.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ol>
  </div>` : ""}

  <p class="disclaimer">A licensed pharmacist must review and approve all risk assessments before use. This is a system-generated document.</p>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!printWindow) {
      URL.revokeObjectURL(url);
      return;
    }
    printWindow.onload = () => {
      URL.revokeObjectURL(url);
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  }

  function escapeHtml(str) {
    if (str == null) return "";
    const s = String(str);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getPlainText() {
    const a = assessment;
    let text = `RISK ASSESSMENT RECORD\n`;
    text += `${"=".repeat(50)}\n\n`;
    text += `Product: ${formData.productName} ${formData.concentration} ${formData.form}\n`;
    text += `Generated: ${new Date(a.generatedAt).toLocaleString()}\n\n`;

    if (a.complexity) {
      text += `COMPLEXITY CLASSIFICATION\n${"-".repeat(30)}\n`;
      text += `Level: ${a.complexity.level}\n`;
      text += `Justification: ${a.complexity.justification}\n\n`;
    }

    if (a.frequencyAssessment) {
      text += `FREQUENCY & QUANTITY ASSESSMENT\n${"-".repeat(30)}\n`;
      text += `Occasional Small Quantity: ${a.frequencyAssessment.isOccasionalSmallQuantity ? "YES" : "NO"}\n`;
      text += `Annual Volume: ${a.frequencyAssessment.annualVolume}\n`;
      text += `Justification: ${a.frequencyAssessment.justification}\n\n`;
    }

    if (a.exposureRisks) {
      text += `EXPOSURE RISK ANALYSIS\n${"-".repeat(30)}\n`;
      for (const [route, info] of Object.entries(a.exposureRisks)) {
        text += `${route.charAt(0).toUpperCase() + route.slice(1)}: ${info.risk ? "YES" : "LOW"} - ${info.explanation}\n`;
      }
      text += "\n";
    }

    if (a.recommendedPPE) {
      text += `RECOMMENDED PPE\n${"-".repeat(30)}\n`;
      text += `Gloves: ${a.recommendedPPE.gloves?.type || "N/A"} - ${a.recommendedPPE.gloves?.rationale || ""}\n`;
      text += `Gown: ${a.recommendedPPE.gown?.type || "N/A"} - ${a.recommendedPPE.gown?.rationale || ""}\n`;
      text += `Respiratory: ${a.recommendedPPE.respiratory?.type || "N/A"} - ${a.recommendedPPE.respiratory?.rationale || ""}\n`;
      text += `Eye: ${a.recommendedPPE.eye?.type || "N/A"} - ${a.recommendedPPE.eye?.rationale || ""}\n`;
      if (a.recommendedPPE.other?.length) {
        text += `Other: ${a.recommendedPPE.other.join(", ")}\n`;
      }
      text += `Eyewash Station: ${a.recommendedPPE.eyewashStation ? "Required" : "Not required"}\n`;
      text += `Safety Shower: ${a.recommendedPPE.safetyShower ? "Required" : "Not required"}\n\n`;
    }

    if (a.facilityControls) {
      text += `FACILITY & ENGINEERING CONTROLS\n${"-".repeat(30)}\n`;
      text += `Ventilation: ${a.facilityControls.ventilation}\n`;
      text += `Dedicated Area: ${a.facilityControls.dedicatedArea}\n`;
      text += `Contamination Controls: ${a.facilityControls.contaminationControls}\n`;
      text += `Spill Kit: ${a.facilityControls.spillKit ? "Required" : "Not required"}\n`;
      text += `BSC: ${a.facilityControls.bsc}\n\n`;
    }

    if (a.riskLevel) {
      text += `RISK LEVEL ASSIGNMENT\n${"-".repeat(30)}\n`;
      text += `Level: ${a.riskLevel.level}\n\n`;
      text += `Rationale:\n${a.riskLevel.rationale}\n\n`;
    }

    if (a.references?.length) {
      text += `REFERENCES\n${"-".repeat(30)}\n`;
      a.references.forEach((ref, i) => {
        text += `${i + 1}. ${ref}\n`;
      });
      text += "\n";
    }

    text += `${"=".repeat(50)}\n`;
    text += `DISCLAIMER: This is a PoC demonstration. A licensed pharmacist must review and approve all risk assessments before use.\n`;

    return text;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getPlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = getPlainText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const a = assessment;
  const hasParsedData = !a.parseError;

  return (
    <div className="assessment-container">
      {/* Toolbar */}
      <div className="assessment-toolbar">
        <button className="btn-secondary" onClick={onBack}>
          &larr; Back to Form
        </button>
        <div className="toolbar-actions">
          {a.savedRecord?.status === "DRAFT" && onSubmitForReview && (
            <button className="btn-primary" onClick={() => onSubmitForReview(a.savedRecord.id)}>
              Submit for Review
            </button>
          )}
          <button className="btn-secondary" onClick={onRegenerate}>
            Regenerate
          </button>
          <button className="btn-secondary no-print" onClick={openPrintView} title="Open print-friendly version (no page header/footer)">
            Print / PDF
          </button>
          <button className="btn-primary" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Text"}
          </button>
          {a.savedRecord && onRemoveAssessment && (
            <button
              type="button"
              className="btn-secondary btn-remove-assessment no-print"
              onClick={() => onRemoveAssessment(a.savedRecord.id)}
              title="Remove this assessment from the library; you can create a new one later"
            >
              Remove assessment
            </button>
          )}
        </div>
      </div>

      <div className="assessment-card">
        {/* Header */}
        <div className="assessment-header">
          <div className="assessment-header-top">
            <h2>RISK ASSESSMENT RECORD</h2>
            {a.savedRecord && (
              <span className="saved-indicator" title={`Assessment ID: ${a.savedRecord.id}`}>
                ✓ Saved · v{a.savedRecord.version}
              </span>
            )}
          </div>
          <div className="assessment-meta">
            <p>
              <strong>Product:</strong> {formData.productName}{" "}
              {formData.concentration} {formData.form}
            </p>
            <p>
              <strong>Generated:</strong>{" "}
              {new Date(a.generatedAt).toLocaleString()}
            </p>
            <p>
              <strong>Protocol:</strong>{" "}
              {formData.protocolNumber
                ? formData.protocolNumber
                : a.savedRecord
                ? "Auto-assigned on approval"
                : "Not assigned"}
            </p>
            {a.savedRecord && (
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`assessment-status-inline status-${a.savedRecord.status?.toLowerCase()}`}
                  title={a.savedRecord.status === "DRAFT" ? "Workflow: Draft → Submit for Review → Supervisor Approves" : ""}
                >
                  {a.savedRecord.status}
                </span>
                {" — "}
                <span style={{ fontSize: "0.8em", color: "var(--text-muted)" }}>
                  Review due:{" "}
                  {a.savedRecord.nextReviewDate
                    ? new Date(a.savedRecord.nextReviewDate).toLocaleDateString()
                    : "—"}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Ingredient Hazard Analysis */}
        <section className="assessment-section">
          <h3 className="section-title">INGREDIENT HAZARD ANALYSIS</h3>
          <div className="hazard-cards">
            {formData.ingredients.map((ing, i) => (
              <HazardCard key={i} ingredient={ing} />
            ))}
          </div>
        </section>

        {hasParsedData ? (
          <>
            {/* Complexity */}
            {a.complexity && (
              <section className="assessment-section">
                <h3 className="section-title">
                  COMPLEXITY &amp; FREQUENCY ASSESSMENT
                </h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Complexity:</strong> {a.complexity.level}
                    <p className="detail-justification">
                      {a.complexity.justification}
                    </p>
                  </div>
                  {a.frequencyAssessment && (
                    <>
                      <div className="detail-item">
                        <strong>Preparation Frequency:</strong>{" "}
                        {formData.frequency}
                      </div>
                      <div className="detail-item">
                        <strong>Batch Size:</strong> {formData.batchSize} units
                        per batch
                      </div>
                      <div className="detail-item">
                        <strong>Annual Volume:</strong>{" "}
                        {a.frequencyAssessment.annualVolume}
                      </div>
                      <div className="detail-item">
                        <strong>Occasional Small Quantity:</strong>{" "}
                        {a.frequencyAssessment.isOccasionalSmallQuantity
                          ? "YES"
                          : "NO"}
                        <p className="detail-justification">
                          {a.frequencyAssessment.justification}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Exposure Risks */}
            {a.exposureRisks && (
              <section className="assessment-section">
                <h3 className="section-title">
                  EXPOSURE RISK TO COMPOUNDING PERSONNEL
                </h3>
                <div className="exposure-grid">
                  {Object.entries(a.exposureRisks).map(([route, info]) => (
                    <div
                      key={route}
                      className={`exposure-item ${info.risk ? "exposure-high" : "exposure-low"}`}
                    >
                      <span className="exposure-icon">
                        {info.risk ? "\u26A0\uFE0F" : "\u2713"}
                      </span>
                      <div>
                        <strong>
                          {route.charAt(0).toUpperCase() + route.slice(1)}{" "}
                          Contact:
                        </strong>{" "}
                        {info.risk ? "YES" : "LOW"}
                        <p className="exposure-explanation">
                          {info.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PPE */}
            {a.recommendedPPE && (
              <section className="assessment-section">
                <h3 className="section-title">
                  RECOMMENDED PERSONAL PROTECTIVE EQUIPMENT (PPE)
                </h3>
                <div className="ppe-grid">
                  <div className="ppe-item">
                    <span className="ppe-icon">&#x1F9E4;</span>
                    <div>
                      <strong>Gloves:</strong>{" "}
                      {a.recommendedPPE.gloves?.type || "N/A"}
                      <p className="ppe-rationale">
                        {a.recommendedPPE.gloves?.rationale}
                      </p>
                    </div>
                  </div>
                  <div className="ppe-item">
                    <span className="ppe-icon">&#x1F454;</span>
                    <div>
                      <strong>Gown:</strong>{" "}
                      {a.recommendedPPE.gown?.type || "N/A"}
                      <p className="ppe-rationale">
                        {a.recommendedPPE.gown?.rationale}
                      </p>
                    </div>
                  </div>
                  <div className="ppe-item">
                    <span className="ppe-icon">&#x1F637;</span>
                    <div>
                      <strong>Respiratory Protection:</strong>{" "}
                      {a.recommendedPPE.respiratory?.type || "N/A"}
                      <p className="ppe-rationale">
                        {a.recommendedPPE.respiratory?.rationale}
                      </p>
                    </div>
                  </div>
                  <div className="ppe-item">
                    <span className="ppe-icon">&#x1F453;</span>
                    <div>
                      <strong>Eye Protection:</strong>{" "}
                      {a.recommendedPPE.eye?.type || "N/A"}
                      <p className="ppe-rationale">
                        {a.recommendedPPE.eye?.rationale}
                      </p>
                    </div>
                  </div>
                  {a.recommendedPPE.other?.length > 0 && (
                    <div className="ppe-item">
                      <span className="ppe-icon">&#x1F464;</span>
                      <div>
                        <strong>Other PPE:</strong>{" "}
                        {a.recommendedPPE.other.join(", ")}
                      </div>
                    </div>
                  )}
                  <div className="ppe-item">
                    <span className="ppe-icon">&#x1F6BF;</span>
                    <div>
                      <strong>Safety Equipment:</strong>
                      <p className="ppe-rationale">
                        Eye wash station:{" "}
                        {a.recommendedPPE.eyewashStation
                          ? "Required"
                          : "Not required"}
                      </p>
                      <p className="ppe-rationale">
                        Safety shower:{" "}
                        {a.recommendedPPE.safetyShower
                          ? "Required"
                          : "Not required"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Facility Controls */}
            {a.facilityControls && (
              <section className="assessment-section">
                <h3 className="section-title">
                  FACILITY &amp; ENGINEERING CONTROLS
                </h3>
                <div className="facility-grid">
                  <div className="facility-item">
                    <span className="facility-check">{"\u2713"}</span>
                    <span>
                      <strong>Ventilation:</strong>{" "}
                      {a.facilityControls.ventilation}
                    </span>
                  </div>
                  <div className="facility-item">
                    <span className="facility-check">{"\u2713"}</span>
                    <span>
                      <strong>Dedicated Area:</strong>{" "}
                      {a.facilityControls.dedicatedArea}
                    </span>
                  </div>
                  <div className="facility-item">
                    <span className="facility-check">{"\u2713"}</span>
                    <span>
                      <strong>Contamination Controls:</strong>{" "}
                      {a.facilityControls.contaminationControls}
                    </span>
                  </div>
                  <div className="facility-item">
                    <span className="facility-check">{"\u2713"}</span>
                    <span>
                      <strong>Spill Kit:</strong>{" "}
                      {a.facilityControls.spillKit
                        ? "Must be available"
                        : "Not required"}
                    </span>
                  </div>
                  <div className="facility-item">
                    <span className="facility-check">
                      {a.facilityControls.bsc?.toLowerCase().includes("not")
                        ? "\u2713"
                        : "\u26A0\uFE0F"}
                    </span>
                    <span>
                      <strong>Biological Safety Cabinet:</strong>{" "}
                      {a.facilityControls.bsc}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Risk Level */}
            {a.riskLevel && (
              <section className="assessment-section">
                <h3 className="section-title">RISK LEVEL ASSIGNMENT</h3>
                <div className="risk-level-display">
                  <RiskLevelBadge level={a.riskLevel.level} />
                </div>
                <div className="rationale-section">
                  <h4 className="rationale-title">COMPREHENSIVE RATIONALE</h4>
                  <div className="rationale-text">
                    {a.riskLevel.rationale
                      .split("\n")
                      .filter((p) => p.trim())
                      .map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                  </div>
                </div>
              </section>
            )}

            {/* References */}
            {a.references?.length > 0 && (
              <section className="assessment-section">
                <h3 className="section-title">REFERENCES</h3>
                <ol className="references-list">
                  {a.references.map((ref, i) => (
                    <li key={i}>{ref}</li>
                  ))}
                </ol>
              </section>
            )}
          </>
        ) : (
          /* Fallback: raw text display */
          <section className="assessment-section">
            <h3 className="section-title">AI-GENERATED ASSESSMENT</h3>
            <div className="raw-text-display">
              <pre>{a.rawText}</pre>
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <div className="disclaimer">
          <strong>DISCLAIMER:</strong> This is a PoC demonstration. A licensed
          pharmacist must review and approve all risk assessments before use.
          This tool assists with documentation but does not replace professional
          judgment.
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="assessment-toolbar bottom-toolbar">
        <button className="btn-secondary" onClick={onBack}>
          &larr; Back to Form
        </button>
        <div className="toolbar-actions">
          {a.savedRecord?.status === "DRAFT" && onSubmitForReview && (
            <button className="btn-primary" onClick={() => onSubmitForReview(a.savedRecord.id)}>
              Submit for Review
            </button>
          )}
          <button className="btn-secondary" onClick={onRegenerate}>
            Regenerate
          </button>
          <button className="btn-secondary no-print" onClick={openPrintView} title="Open print-friendly version (no page header/footer)">
            Print / PDF
          </button>
          <button className="btn-primary" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Text"}
          </button>
          {a.savedRecord && onRemoveAssessment && (
            <button
              type="button"
              className="btn-secondary btn-remove-assessment no-print"
              onClick={() => onRemoveAssessment(a.savedRecord.id)}
              title="Remove this assessment from the library; you can create a new one later"
            >
              Remove assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
