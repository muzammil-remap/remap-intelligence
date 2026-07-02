import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Public (anon) client — safe for the browser. Uses the anon key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  // Surfaced at import time so misconfiguration fails fast in any runtime.
  console.warn('[db] NEXT_PUBLIC_SUPABASE_URL is not set');
}

export const supabasePublic: SupabaseClient = createClient(
  supabaseUrl ?? '',
  anonKey ?? '',
);

// Admin client — server-side only. NEVER import this into a Client Component.
// Uses the service role key which bypasses RLS.
let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — admin client unavailable');
  }
  _admin = createClient(supabaseUrl ?? '', serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
