/**
 * PATCH  /api/work-orders/:id  — Update a work order (admin only)
 * DELETE /api/work-orders/:id  — Delete a work order (admin only)
 *
 * PATCH Body (all fields optional):
 * {
 *   "title"          : "...",
 *   "status"         : "waiting|confirmed|open|closed",
 *   "customer_id"    : "uuid|null",
 *   "employee_id"    : "uuid|null",
 *   "package_id"     : "uuid|null",
 *   "ket"            : "...",
 *   "payment_status" : "pending|paid"
 * }
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  const adminUser = await isAdmin(user.id);
  if (!adminUser) return errorResponse('Forbidden: Admin access required', 403);

  // Extract :id from URL  e.g. /api/work-orders/abc-123
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  if (!id || id === 'work-orders') return errorResponse('Work order id is required', 400);

  // ── PATCH ──────────────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const body = await req.json();

      // Whitelist updatable fields
      const ALLOWED = ['title', 'status', 'customer_id', 'employee_id', 'package_id', 'ket', 'payment_status'];
      const updates = Object.fromEntries(
        Object.entries(body).filter(([k]) => ALLOWED.includes(k))
      );

      if (Object.keys(updates).length === 0) {
        return errorResponse('No valid fields to update', 400);
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('work_orders')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      if (!data) return errorResponse('Work order not found', 404);

      return jsonResponse({ success: true, data });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      // Verify work order exists first
      const { data: existing } = await supabaseAdmin
        .from('work_orders')
        .select('id, status')
        .eq('id', id)
        .single();

      if (!existing) return errorResponse('Work order not found', 404);

      const { error } = await supabaseAdmin
        .from('work_orders')
        .delete()
        .eq('id', id);

      if (error) return errorResponse(`Delete failed: ${error.message}`, 500);

      return jsonResponse({ success: true, message: 'Work order deleted' });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
