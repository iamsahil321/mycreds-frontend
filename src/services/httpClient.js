import { apiUrl } from '../lib/api.js';

export async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json', ...(options.headers || {}) } : options.headers,
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

export async function getSession() {
  const response = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
  if (!response.ok) return null;
  return response.json();
}

export async function loginUser(credentials) {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function logoutUser() {
  await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
}
