import { supabase } from '../lib/supabase.js';

const API_URL = import.meta.env.VITE_API_URL || '';

/** Calls the Express API, attaching the signed-in user's access token. */
export async function api(path, { method = 'GET', body } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(
      json?.details?.[0]?.message || json?.error || `Request failed (${res.status})`,
    );
    err.status = res.status;
    err.details = json?.details;
    throw err;
  }
  return json;
}

/** Builds a query string, skipping empty values. */
export function toQuery(params) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}
