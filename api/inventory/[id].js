/**
 * PATCH  /api/inventory/:id  — Update inventory item (admin only)
 * DELETE /api/inventory/:id  — Delete inventory item (admin only)
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);
  if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  if (!id || id === 'inventory') return errorResponse('Inventory item id is required', 400);

  if (req.method === 'PATCH') {
    try {
      const body = await req.json();
      const ALLOWED = ['name', 'stock', 'unit', 'category'];
      const updates = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.includes(k)));
      if (Object.keys(updates).length === 0) return errorResponse('No valid fields to update', 400);

      const { data, error } = await supabaseAdmin
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      if (!data) return errorResponse('Item not found', 404);
      return jsonResponse({ success: true, data });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin.from('inventory_items').delete().eq('id', id);
      if (error) return errorResponse(`Delete failed: ${error.message}`, 500);
      return jsonResponse({ success: true, message: 'Item deleted' });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
