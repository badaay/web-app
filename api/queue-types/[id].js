/**
 * PATCH  /api/queue-types/:id
 * DELETE /api/queue-types/:id
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);
    if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 1];
    
    if (!id || id === 'queue-types') return errorResponse('Missing ID', 400);

    if (req.method === 'PATCH') {
      const body = await req.json();
      const { name, base_point, color, icon } = body;
      
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (base_point !== undefined) updateData.base_point = base_point;
      if (color !== undefined) updateData.color = color;
      if (icon !== undefined) updateData.icon = icon;

      const { data, error } = await supabaseAdmin
        .from('master_queue_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      return jsonResponse({ success: true, data });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin
        .from('master_queue_types')
        .delete()
        .eq('id', id);

      if (error) {
        // Handle FK constraint errors e.g. if the point type is in use
        if (error.code === '23503') {
           return errorResponse('Cannot delete: Point Type is currently assigned to Work Orders.', 409);
        }
        return errorResponse(`Database error: ${error.message}`, 500);
      }
      return jsonResponse({ success: true });
    }
  } catch (error) {
    console.error('Queue types update/delete error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
