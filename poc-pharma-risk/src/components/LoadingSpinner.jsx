import { useState, useEffect } from "react";

const STEPS = [
  "Analyzing ingredient hazards...",
  "Checking NIOSH classifications...",
  "Evaluating exposure routes...",
  "Determining PPE requirements...",
  "Assessing compounding complexity...",
  "Generating compliance rationale...",
  "Citing regulatory references...",
  "Finalizing risk assessment...",
];

export default function LoadingSpinner() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        return prev + Math.random() * 8 + 2;
      });
    }, 600);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-card">
        <div className="loading-icon">
          <div className="spinner"></div>
        </div>
        <h2 className="loading-title">Generating Risk Assessment...</h2>
        <div className="loading-steps">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`loading-step ${i < currentStep ? "completed" : ""} ${i === currentStep ? "active" : ""} ${i > currentStep ? "pending" : ""}`}
            >
              <span className="step-icon">
                {i < currentStep ? "\u2713" : i === currentStep ? "\u25CF" : "\u25CB"}
              </span>
              <span className="step-text">{step}</span>
            </div>
          ))}
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${Math.min(progress, 95)}%` }}
          ></div>
        </div>
        <p className="loading-subtext">
          This typically takes 5-15 seconds
        </p>
      </div>
    </div>
  );
}
