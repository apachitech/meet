'use client';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function authHeader() {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token')
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(
  path: string,
  opts: RequestInit & { requireAuth?: boolean } = {},
) {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
    ...(opts.requireAuth ? authHeader() : authHeader()),
  };
  const res = await fetch(
    path.startsWith('http') ? path : `${API_BASE}${path}`,
    { ...opts, headers },
  );
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  }
  return res;
}

export async function apiJson<T>(
  path: string,
  opts: RequestInit & { requireAuth?: boolean } = {},
): Promise<T> {
  const res = await apiFetch(path, opts);
  return res.json();
}

export const api = {
  get: (path: string, requireAuth = false) =>
    apiFetch(path, { method: 'GET', requireAuth }),
  post: (path: string, body: any, requireAuth = false) =>
    apiFetch(path, {
      method: 'POST',
      body: JSON.stringify(body),
      requireAuth,
    }),
  put: (path: string, body: any, requireAuth = false) =>
    apiFetch(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      requireAuth,
    }),
};

