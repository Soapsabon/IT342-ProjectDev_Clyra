import { auth } from '../firebase/config';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors || null;
  }
}

async function request(path, { method = 'GET', body, authenticated = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (authenticated) {
    const user = auth.currentUser;
    if (!user) throw new ApiError(401, 'You are not signed in.');
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the Clyra server. Check that the backend is running.');
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || `Request failed (${response.status}).`,
      data?.fieldErrors,
    );
  }
  return data;
}

// --- public
export const registerPatient = (payload) =>
  request('/api/auth/register', { method: 'POST', body: payload, authenticated: false });

// --- authenticated
export const fetchMe = () => request('/api/users/me');
export const serverLogout = () => request('/api/auth/logout', { method: 'POST' });

// --- staff only (the backend enforces this; the UI merely hides it)
export const listUsers = () => request('/api/admin/users');
export const createUser = (payload) => request('/api/admin/users', { method: 'POST', body: payload });
export const changeUserRole = (uid, role) =>
  request(`/api/admin/users/${encodeURIComponent(uid)}/role`, { method: 'PATCH', body: { role } });
export const changeUserStatus = (uid, active) =>
  request(`/api/admin/users/${encodeURIComponent(uid)}/status`, { method: 'PATCH', body: { active } });
