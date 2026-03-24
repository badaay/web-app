/**
 * GET  /api/queue-types        - List all queue types (points)
 * POST /api/queue-types        - Create a queue type (admin only)
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('master_queue_types')
        .select('*')
        .order('name');
      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      return jsonResponse({ data }, 200, { 'Cache-Control': 's-maxage=60' });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  if (req.method === 'POST') {
    try {
      const { user, error: authError } = await verifyAuth(req);
      if (authError) return errorResponse(authError, 401);
      if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

      const body = await req.json();
      const { name, base_point, color, icon } = body;
      if (!name) return errorResponse('name is required', 400);

      const { data, error } = await supabaseAdmin
        .from('master_queue_types')
        .insert({ name, base_point: base_point ?? 0, color: color || '#6b7280', icon: icon || 'bi-ticket-detailed' })
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
