import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
}

/**
 * Server-side admin client — bypasses RLS.
 * Use ONLY in API routes, never in browser code.
 */
export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Server-side client scoped to a user JWT.
 * Pass the Authorization header value ("Bearer <token>").
 * Respects RLS policies.
 */
export function createUserClient(accessToken) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Browser-side client (anon key).
 * Used in React components for client-side Supabase auth helpers.
 */
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
