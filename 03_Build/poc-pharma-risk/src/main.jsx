import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

class RootErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#f8f9fa",
            color: "#212529",
          }}
        >
          <h1 style={{ marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ marginBottom: 16, maxWidth: 480 }}>
            The app failed to load. Try refreshing the page. If it persists, check the browser console (F12) for errors.
          </p>
          <pre style={{ fontSize: 12, overflow: "auto", maxWidth: "100%" }}>
            {this.state.error?.message || "Unknown error"}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = "<p>Missing #root element.</p>";
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
}
