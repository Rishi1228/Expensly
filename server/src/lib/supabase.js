import { createClient } from '@supabase/supabase-js';

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}. Copy server/.env.example to server/.env.`);
  return value;
}

let anonClient;
/** Shared client using the anon key. Used to verify tokens. */
export function getAnonClient() {
  anonClient ??= createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_ANON_KEY'),
    clientOptions,
  );
  return anonClient;
}

/**
 * Client acting as the signed-in user. Every query runs under that user's
 * RLS policies, so the API can never read another user's rows.
 */
export function getUserClient(accessToken) {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    ...clientOptions,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

let adminClient;
/** Bypasses RLS. Only for background jobs, never for user requests. */
export function getAdminClient() {
  adminClient ??= createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    clientOptions,
  );
  return adminClient;
}
