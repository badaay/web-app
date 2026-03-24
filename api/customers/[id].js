/**
 * PATCH  /api/customers/:id  — Update customer data (admin only)
 * DELETE /api/customers/:id  — Delete a customer (admin only)
 *
 * PATCH Body (all fields optional):
 * {
 *   "name", "ktp", "phone", "alt_phone", "packet", "address",
 *   "install_date", "username", "mac_address", "damping",
 *   "lat", "lng", "photo_ktp", "photo_rumah", "email"
 * }
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

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

      const ALLOWED = [
        'name', 'ktp', 'phone', 'alt_phone', 'packet', 'address',
        'install_date', 'username', 'mac_address', 'damping',
        'lat', 'lng', 'photo_ktp', 'photo_rumah', 'email',
      ];
      const updates = Object.fromEntries(
        Object.entries(body).filter(([k]) => ALLOWED.includes(k))
      );

      if (Object.keys(updates).length === 0) {
        return errorResponse('No valid fields to update', 400);
      }

      // Validate phone uniqueness if being changed
      if (updates.phone) {
        const { data: dup } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('phone', updates.phone)
          .neq('id', id)
          .maybeSingle();
        if (dup) return errorResponse('Phone number already in use by another customer', 409);
      }

      const { data, error } = await supabaseAdmin
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      if (!data) return errorResponse('Customer not found', 404);

      return jsonResponse({ success: true, data });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('id, name')
        .eq('id', id)
        .maybeSingle();

      if (!existing) return errorResponse('Customer not found', 404);

      // Soft guard: do not delete customers with active work orders
      const { count } = await supabaseAdmin
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', id)
        .in('status', ['waiting', 'confirmed', 'open']);

      if (count > 0) {
        return errorResponse(
          `Cannot delete: customer has ${count} active work order(s). Close them first.`,
          409
        );
      }

      const { error } = await supabaseAdmin.from('customers').delete().eq('id', id);
      if (error) return errorResponse(`Delete failed: ${error.message}`, 500);

      // Also delete auth user
      await supabaseAdmin.auth.admin.deleteUser(id);

      return jsonResponse({ success: true, message: `Customer '${existing.name}' deleted` });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
