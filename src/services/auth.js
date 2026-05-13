import { apiBaseUrl } from './api.js';

export async function loginUser(credentials) {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  let payload = {};

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Unable to login right now');
  }

  return payload;
}

export const persistSession = ({ token, user }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', user.role);
  localStorage.setItem('userName', user.name || user.email);
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('userId', String(user.id));
  localStorage.setItem('companyId', String(user.company_id ?? ''));
};

export const clearSession = () => {
  localStorage.clear();
};
