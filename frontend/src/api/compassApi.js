/**
 * All fetch() calls to the Flask backend.
 *
 * During development the Vite dev server proxies /api to localhost:5000
 * (see vite.config.js), so these paths work without a full URL.
 */

const API_BASE = "/api";

/**
 * Generate letters on demand. Requires an active session (intake must have run first).
 */
export async function generateLetters() {
  const res = await fetch(`${API_BASE}/letters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Letter generation failed (${res.status})`);
  }

  return res.json();
}

/**
 * Submit the intake form.  Returns the full response with roadmap,
 * letters, providers, and a session_id.
 */
export async function submitIntake(intakeData) {
  const res = await fetch(`${API_BASE}/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(intakeData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Intake failed (${res.status})`);
  }

  return res.json();
}

/**
 * Send a chat message.  Requires an active session_id.
 */
export async function sendChatMessage(sessionId, message) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Chat failed (${res.status})`);
  }

  return res.json();
}

/**
 * Get all children in the clinic database.
 */
export async function getClinicChildren() {
  const res = await fetch(`${API_BASE}/clinic/children`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to load clinic children (${res.status})`);
  }

  return res.json();
}

/**
 * Get a single child's full profile from the clinic database.
 */
export async function getClinicChild(childId) {
  const res = await fetch(`${API_BASE}/clinic/children/${childId}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to load child profile (${res.status})`);
  }

  return res.json();
}
