/**
 * PATCH  /api/customers/:id  — Update customer data (admin only)
 * DELETE /api/customers/:id  — Delete a customer (admin only)
 *
 * Thin handler — delegates to CustomerService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { updateCustomer, deleteCustomer } from '../_core/customer.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  const adminUser = await isAdmin(user.id);
  if (!adminUser) return errorResponse('Forbidden: Admin access required', 403);

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  if (!id || id === 'customers') return errorResponse('Customer id is required', 400);

  // ── PATCH ──────────────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const body = await req.json();
      const result = await updateCustomer(supabaseAdmin, id, body);

      if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
      return jsonResponse({ success: true, data: result.data });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const result = await deleteCustomer(supabaseAdmin, supabaseAdmin, id);

      if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
      return jsonResponse({ success: true, message: result.data.message });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
