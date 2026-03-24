/**
 * GET  /api/packages        — List all internet packages
 * POST /api/packages        — Create a package (admin only)
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('internet_packages')
        .select('*')
        .order('name');
      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      return jsonResponse({ data }, 200, { 'Cache-Control': 's-maxage=60' });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  // ── POST ───────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { user, error: authError } = await verifyAuth(req);
      if (authError) return errorResponse(authError, 401);
      if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

      const body = await req.json();
      const { name, price, speed, description } = body;
      if (!name || price == null) return errorResponse('name and price are required', 400);

      const { data, error } = await supabaseAdmin
        .from('internet_packages')
        .insert({ name, price, speed: speed || null, description: description || null })
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
