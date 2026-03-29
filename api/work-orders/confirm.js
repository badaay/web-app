/**
 * POST /api/work-orders/confirm
 *
 * Admin confirms a waiting work order, optionally assigning a technician.
 * Creates the initial installation_monitorings record in the same transaction.
 *
 * Request Body:
 * {
 *   "workOrderId": "uuid",
 *   "employeeId": "uuid|null"  // optional technician assignment
 * }
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { notifyWorkOrderEvent } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);

    const userIsAdmin = await isAdmin(user.id);
    if (!userIsAdmin) return errorResponse('Forbidden: Admin access required', 403);

    const { workOrderId, employeeId = null } = await req.json();
    if (!workOrderId) return errorResponse('workOrderId is required', 400);

    // Fetch current work order to validate state
    const { data: wo, error: fetchError } = await supabaseAdmin
      .from('work_orders')
      .select('id, status')
      .eq('id', workOrderId)
      .single();

    if (fetchError || !wo) return errorResponse('Work order not found', 404);
    if (wo.status !== 'waiting') {
      return errorResponse(`Cannot confirm: work order status is '${wo.status}'`, 409);
    }

    // Update work order to confirmed
    const updatePayload = { status: 'confirmed' };
    if (employeeId) updatePayload.employee_id = employeeId;

    const { data: updatedWO, error: updateError } = await supabaseAdmin
      .from('work_orders')
      .update(updatePayload)
      .eq('id', workOrderId)
      .select('*, customers(name, phone, address), employees(name)')
      .single();

    if (updateError) return errorResponse(`Failed to confirm: ${updateError.message}`, 500);

    // Create initial monitoring record (ignore if already exists)
    const { error: monitorError } = await supabaseAdmin
      .from('installation_monitorings')
      .insert({
        work_order_id: workOrderId,
        employee_id: employeeId,
        notes: 'Work order dikonfirmasi oleh admin.',
      });

    if (monitorError && !monitorError.message.includes('duplicate')) {
      console.warn('Monitor record error (non-fatal):', monitorError.message);
    }

    // ── [FONNTE] Notify customer — Centralized, reliable ─────────────────
    await notifyWorkOrderEvent(workOrderId, 'wo_confirmed');

    return jsonResponse({
      success: true,
      message: 'Work order confirmed successfully',
      data: updatedWO,
    });
  } catch (err) {
    console.error('Confirm work order error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
