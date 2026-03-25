/**
 * Server-side Supabase Client for Vercel Functions
 *
 * This module provides two Supabase clients:
 * - supabase: Uses anon key, respects RLS policies
 * - supabaseAdmin: Uses service role key, bypasses RLS (use carefully!)
 *
 * IMPORTANT: This file is in api/_lib/ which means it's NOT exposed as an endpoint.
 * Files/folders starting with _ are excluded from routing.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

/**
 * Regular Supabase client — respects RLS policies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * Admin Supabase client — bypasses ALL RLS. NEVER expose to the client!
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Verify JWT token from Authorization header.
 * @param {Request} req
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
export async function verifyAuth(req) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }

  return { user, error: null };
}

/**
 * Fetch the role code for a user from the profiles table.
 * Profiles is the bridge between auth.users and roles.
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
export async function getEmployeeRole(userId) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('roles(code)')
    .eq('id', userId)
    .single();
  return data?.roles?.code ?? null;
}

/**
 * Check whether the user holds one of the supplied role codes.
 * Role codes from schema: S_ADM, OWNER, ADM, TREASURER, SPV_TECH, TECH, CUST
 * @param {string} userId
 * @param {string[]} roleCodes
 * @returns {Promise<boolean>}
 */
export async function hasRole(userId, roleCodes) {
  const code = await getEmployeeRole(userId);
  return code !== null && roleCodes.includes(code);
}

/**
 * Check if user is an admin-class employee.
 * Matches the actual role codes defined in schema.sql.
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isAdmin(userId) {
  return hasRole(userId, ['S_ADM', 'OWNER', 'ADM']);
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Standard JSON response helper.
 */
export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

/**
 * Error response helper.
 */
export function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

/**
 * Wrap a handler with CORS preflight support.
 * Usage: export default withCors(async (req) => { ... });
 * @param {(req: Request) => Promise<Response>} handler
 * @returns {(req: Request) => Promise<Response>}
 */
export function withCors(handler) {
  return async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    return handler(req);
  };
}

// ---------------------------------------------------------------------------
// Business-logic helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique customer code with the format YYMMXXXXXXX (11 chars).
 * Retries up to 5 times on collision.
 * @returns {Promise<string>}
 */
export async function generateCustomerCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${yy}${mm}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = String(Math.floor(10000000 + Math.random() * 90000000)).slice(0, 7);
    const code = `${prefix}${suffix}`;

    const { data } = await supabaseAdmin
      .from('customers')
      .select('customer_code')
      .eq('customer_code', code)
      .maybeSingle();

    if (!data) return code; // unique
  }

  throw new Error('Could not generate a unique customer code after 5 attempts');
}
