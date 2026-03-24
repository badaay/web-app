/**
 * GET  /api/roles   — List all roles (public, no auth required)
 * POST /api/roles   — Create a role (super-admin only)
 */

import { supabaseAdmin, verifyAuth, hasRole, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('name');
      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      return jsonResponse({ data }, 200, { 'Cache-Control': 's-maxage=120' });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  if (req.method === 'POST') {
    try {
      const { user, error: authError } = await verifyAuth(req);
      if (authError) return errorResponse(authError, 401);
      // Only super-admins and owners may create roles
      const allowed = await hasRole(user.id, ['S_ADM', 'OWNER']);
      if (!allowed) return errorResponse('Forbidden: Super-admin access required', 403);

      const { name, code, description } = await req.json();
      if (!name || !code) return errorResponse('name and code are required', 400);

      const { data, error } = await supabaseAdmin
        .from('roles')
        .insert({ name, code, description: description || null })
        .select()
        .single();

      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      return jsonResponse({ success: true, data }, 201);
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
