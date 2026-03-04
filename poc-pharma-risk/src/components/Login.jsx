import { useState } from "react";

const CREDENTIALS = {
  pharmacist: { email: "shereen", password: "shereen", label: "Pharmacist" },
  supervisor: { email: "elsayad", password: "elsayad", label: "Supervisor" },
};

export default function Login({ onLogin, onError, loading, backendAvailable }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) return;
    try {
      await onLogin(trimmedEmail, trimmedPassword);
    } catch (err) {
      onError?.(err.message || "Login failed");
    }
  }

  function fillCredentials(role) {
    const c = CREDENTIALS[role];
    setEmail(c.email);
    setPassword(c.password);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">
          <span className="title-icon">🧪</span> Pharmacy Risk Assessment
        </h1>
        <p className="login-subtitle">Sign in to continue</p>

        {!backendAvailable && (
          <div className="login-warning">
            Backend not connected. Login will not work until the server is running on port 3001.
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email or username</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. shereen"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary btn-login" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="login-quick-fill">
          <span className="quick-fill-label">Quick fill:</span>
          <button type="button" className="btn-quick" onClick={() => fillCredentials("pharmacist")}>
            Pharmacist (shereen)
          </button>
          <button type="button" className="btn-quick" onClick={() => fillCredentials("supervisor")}>
            Supervisor (elsayad)
          </button>
        </div>
      </div>
    </div>
  );
}
