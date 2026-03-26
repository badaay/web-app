/**
 * GET  /api/work-orders       — Paginated, filtered list
 * POST /api/work-orders       — Create a new work order
 *
 * GET Query Parameters:
 *   status   filter by status (waiting|confirmed|open|closed)
 *   search   search title or customer name
 *   limit    default 50, max 100
 *   offset   default 0
 *
 * POST Body:
 * {
 *   "type_id"        : "uuid",
 *   "title"          : "PSB",
 *   "customer_id"    : "uuid",
 *   "employee_id"    : "uuid|null",
 *   "package_id"     : "uuid|null",
 *   "ket"            : "notes",
 *   "payment_status" : "pending|paid"
 * }
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { notifyWorkOrderEvent } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
      const offset = parseInt(url.searchParams.get('offset')) || 0;
      const status = url.searchParams.get('status') || null;
      const search = url.searchParams.get('search') || '';

      let query = supabaseAdmin
        .from('work_orders')
        .select(
          `*, customers(name, address, phone, lat, lng),
           employees!employee_id(name, employee_id),
           master_queue_types(name, color, icon, base_point)`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);
      if (search) query = query.ilike('title', `%${search}%`);

      const { data, error, count } = await query;
      if (error) return errorResponse(`Database error: ${error.message}`, 500);

      return jsonResponse({ data, count, limit, offset }, 200, {
        'Cache-Control': 's-maxage=5, stale-while-revalidate=30',
      });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  // ── POST ───────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const adminUser = await isAdmin(user.id);
      if (!adminUser) return errorResponse('Forbidden: Admin access required', 403);

      const body = await req.json();
      const { type_id, title, customer_id, employee_id, package_id, ket, payment_status } = body;

      if (!type_id || !title) {
        return errorResponse('type_id and title are required', 400);
      }

      const { data, error } = await supabaseAdmin
        .from('work_orders')
        .insert({
          type_id,
          title,
          status: 'waiting',
          customer_id: customer_id || null,
          employee_id: employee_id || null,
          package_id: package_id || null,
          ket: ket || null,
          payment_status: payment_status || 'pending',
          created_at: new Date().toISOString(),
        })
        .select('*, customers(name), employees!employee_id(name)')
        .single();

      if (error) return errorResponse(`Database error: ${error.message}`, 500);

      // ── [FONNTE] Notify customer — Centralized, non-blocking ──────────────
      notifyWorkOrderEvent(data.id, 'wo_created');

      return jsonResponse({ success: true, data }, 201);
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
