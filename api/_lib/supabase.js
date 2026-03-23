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

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

/**
 * Regular Supabase client with Anon Key
 * - Respects Row Level Security (RLS) policies
 * - Use for queries that should follow user permissions
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Admin Supabase client with Service Role Key
 * - Bypasses ALL Row Level Security policies
 * - Use ONLY for admin operations (create user, delete user, etc.)
 * - NEVER expose this to the client!
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Helper to verify JWT token from request
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
 * Helper to check if user has admin role
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
export async function isAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('roles(code)')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  
  const adminRoles = ['SUPERADMIN', 'ADMIN'];
  return adminRoles.includes(data.roles?.code);
}

/**
 * Standard JSON response helper
 */
export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

/**
 * Error response helper
 */
export function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}
