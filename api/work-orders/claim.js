/**
 * POST /api/work-orders/claim
 * 
 * Allows a technician to claim an available work order.
 * Uses optimistic locking to prevent race conditions.
 * 
 * Request Body:
 * {
 *   "workOrderId": "uuid",
 *   "technicianId": "uuid"
 * }
 */

import { supabaseAdmin, verifyAuth, hasRole, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(req);
    if (authError) {
      return errorResponse(authError, 401);
    }

    // Parse request body
    const { workOrderId, technicianId } = await req.json();

    // Validate
    if (!workOrderId || !technicianId) {
      return errorResponse('workOrderId and technicianId are required', 400);
    }

    // Verify the technician is claiming for themselves (or is admin)
    if (technicianId !== user.id) {
      const admin = await hasRole(user.id, ['S_ADM', 'OWNER', 'ADM']);
      if (!admin) {
        return errorResponse('You can only claim work orders for yourself', 403);
      }
    }

    // Atomic claim with optimistic locking
    // This query will only succeed if:
    // 1. The work order exists
    // 2. Status is 'confirmed' (ready to be claimed)
    // 3. No technician is assigned yet
    const { data, error } = await supabaseAdmin
      .from('work_orders')
      .update({
        technician_id: technicianId,
        status: 'open',
        claimed_at: new Date().toISOString()
      })
      .eq('id', workOrderId)
      .eq('status', 'confirmed')
      .is('technician_id', null)
      .select(`
        *,
        customers(name, address, phone, lat, lng),
        employees(name, employee_id)
      `)
      .single();

    if (error) {
      return errorResponse(`Database error: ${error.message}`, 500);
    }

    if (!data) {
      return errorResponse('Work order is no longer available or already claimed', 409);
    }

    return jsonResponse({
      success: true,
      message: 'Work order claimed successfully',
      data
    });

  } catch (error) {
    console.error('Claim work order error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
