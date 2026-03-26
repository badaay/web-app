/**
 * POST /api/work-orders/close
 * 
 * Closes a work order and triggers point calculation.
 * 
 * Request Body:
 * {
 *   "workOrderId": "uuid",
 *   "closeData": {
 *     "mac_address": "AA:BB:CC:DD:EE:FF",
 *     "damping": -25.5,
 *     "notes": "Installation complete",
 *     "photo_proof": "base64 or URL"
 *   }
 * }
 */

import { supabaseAdmin, verifyAuth, hasRole, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { notifyWorkOrderEvent } from '../_lib/fonnte.js';

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
    const { workOrderId, closeData = {} } = await req.json();

    if (!workOrderId) {
      return errorResponse('workOrderId is required', 400);
    }

    // Get the work order first
    const { data: wo, error: fetchError } = await supabaseAdmin
      .from('work_orders')
      .select('*, master_queue_types(base_point)')
      .eq('id', workOrderId)
      .single();

    if (fetchError || !wo) {
      return errorResponse('Work order not found', 404);
    }

    // Verify the user is the assigned technician or an admin/supervisor
    let isAuthorized = (wo.claimed_by === user.id);
    
    if (!isAuthorized) {
      const canCloseForOthers = await hasRole(user.id, ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH']);
      if (canCloseForOthers) {
        isAuthorized = true;
      } else {
        // Fallback: Check if the user's email matches the employee who claimed it
        const { data: techRow } = await supabaseAdmin
            .from('employees')
            .select('id')
            .eq('id', wo.claimed_by)
            .eq('email', user.email)
            .single();
        
        if (techRow) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return errorResponse('You can only close work orders assigned to you', 403);
    }

    // Check if already closed
    if (wo.status === 'closed') {
      return errorResponse('Work order is already closed', 400);
    }

    // Update work order to closed
    const { data: updatedWO, error: updateError } = await supabaseAdmin
      .from('work_orders')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        mac_address: closeData.mac_address || wo.mac_address,
        damping: closeData.damping || wo.damping,
        notes: closeData.notes || wo.notes,
        photo_proof: closeData.photo_proof || wo.photo_proof
      })
      .eq('id', workOrderId)
      .select()
      .single();

    if (updateError) {
      return errorResponse(`Failed to close work order: ${updateError.message}`, 500);
    }

    // Update customer data if work order has customer_id
    if (wo.customer_id && (closeData.mac_address || closeData.damping)) {
      await supabaseAdmin
        .from('customers')
        .update({
          mac_address: closeData.mac_address || undefined,
          damping: closeData.damping || undefined
        })
        .eq('id', wo.customer_id);
    }

    // Calculate and add points to technician
    if (wo.claimed_by && wo.master_queue_types?.base_point) {
      const pointsToAdd = wo.master_queue_types.base_point;
      
      // Get current points
      const { data: tech } = await supabaseAdmin
        .from('employees')
        .select('total_points')
        .eq('id', wo.claimed_by)
        .single();

      // Update points
      await supabaseAdmin
        .from('employees')
        .update({
          total_points: (tech?.total_points || 0) + pointsToAdd
        })
        .eq('id', wo.claimed_by);
    }

    // ── [FONNTE] Notify customer — Centralized, reliable ─────────────────
    await notifyWorkOrderEvent(workOrderId, 'wo_closed');

    return jsonResponse({
      success: true,
      message: 'Work order closed successfully',
      data: updatedWO
    });

  } catch (error) {
    console.error('Close work order error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
