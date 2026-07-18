const API = '/api';

async function request(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function fetchSessions() {
  return request('/sessions');
}

export function fetchSessionDetail(sessionId) {
  return request(`/sessions/${sessionId}`);
}

export function fetchEventStats() {
  return request('/events/stats');
}

export function fetchConfirmations() {
  return request('/confirmations');
}

export function fetchHealth() {
  return request('/health');
}
