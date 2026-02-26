/**
 * API Client for the Pharmacy Compliance Backend
 *
 * This module handles all communication between the frontend and the
 * Express backend. When the backend is unavailable, it falls back to
 * the local ingredient database and demo mode for offline development.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

let authToken = localStorage.getItem("pharma_token") || null;

function setToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem("pharma_token", token);
  } else {
    localStorage.removeItem("pharma_token");
  }
}

function getToken() {
  return authToken;
}

async function apiFetch(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    // Clear stale token on 401 so next login gets a fresh one
    if (response.status === 401) {
      setToken(null);
    }
    throw new Error(body.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ─── Auth ───────────────────────────────────────────────────────────

export async function login(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function register(userData) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  setToken(data.token);
  return data;
}

export function logout() {
  setToken(null);
}

export async function getCurrentUser() {
  return apiFetch("/auth/me");
}

export function isAuthenticated() {
  return !!authToken;
}

// ─── Ingredients ────────────────────────────────────────────────────

export async function searchIngredients(query) {
  if (!query || query.trim().length === 0) return [];
  return apiFetch(`/ingredients/search?q=${encodeURIComponent(query)}`);
}

export async function listIngredients(params = {}) {
  const queryStr = new URLSearchParams(params).toString();
  return apiFetch(`/ingredients?${queryStr}`);
}

export async function getIngredient(id) {
  return apiFetch(`/ingredients/${id}`);
}

export async function createIngredient(data) {
  return apiFetch("/ingredients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── MFR ────────────────────────────────────────────────────────────

export async function listMFRs(params = {}) {
  const queryStr = new URLSearchParams(params).toString();
  return apiFetch(`/mfr?${queryStr}`);
}

export async function getMFR(id) {
  return apiFetch(`/mfr/${id}`);
}

export async function createMFR(data) {
  return apiFetch("/mfr", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMFR(id, data) {
  return apiFetch(`/mfr/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Assessments ────────────────────────────────────────────────────

export async function generateAssessmentFromMFR(mfrId) {
  return apiFetch("/assessments/generate", {
    method: "POST",
    body: JSON.stringify({ mfrId }),
  });
}

export async function generateAssessmentPreview(formData, ingredientHazards) {
  return apiFetch("/assessments/generate-preview", {
    method: "POST",
    body: JSON.stringify({ formData, ingredientHazards }),
  });
}

export async function listAssessments(params = {}) {
  const queryStr = new URLSearchParams(params).toString();
  return apiFetch(`/assessments?${queryStr}`);
}

export async function getAssessment(id) {
  return apiFetch(`/assessments/${id}`);
}

export async function submitAssessment(id) {
  return apiFetch(`/assessments/${id}/submit`, { method: "PUT" });
}

export async function approveAssessment(id, notes) {
  return apiFetch(`/assessments/${id}/approve`, {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
}

// ─── Health Check ───────────────────────────────────────────────────

export async function checkBackendHealth() {
  try {
    const data = await apiFetch("/health");
    return { available: true, ...data };
  } catch {
    return { available: false };
  }
}

/** True if the error indicates an auth/token problem (401, expired, invalid). */
export function isAuthError(err) {
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("token") && (msg.includes("expired") || msg.includes("invalid") || msg.includes("required"));
}

export { setToken, getToken };
