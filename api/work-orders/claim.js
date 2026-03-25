/**
 * POST /api/work-orders/claim
 * 
 * Allows a technician to claim an available work order.
 * Uses optimistic locking to prevent race conditions.
 * 
 * Request Body:
 * {
 *   "workOrderId": "uuid",
 *   "technicianId": "uuid",
 *   "teamMembers": ["uuid", "uuid"]
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
    const { workOrderId, technicianId, teamMembers = [], ket } = await req.json();

    // Validate
    if (!workOrderId || !technicianId) {
      return errorResponse('workOrderId and technicianId are required', 400);
    }

    // Verify the technician is claiming for themselves (or is admin)
    let isAuthorized = (technicianId === user.id);
    
    if (!isAuthorized) {
      const canClaimForOthers = await hasRole(user.id, ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH']);
      if (canClaimForOthers) {
        isAuthorized = true;
      } else {
        // Fallback: Check if the employee record matches the user's email
        // This handles cases where employees.id is not linked to auth.users.id
        const { data: techRecord } = await supabaseAdmin
          .from('employees')
          .select('id, email')
          .eq('id', technicianId)
          .single();
        
        if (techRecord && techRecord.email === user.email) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return errorResponse('You can only claim work orders for yourself', 403);
    }

    // Atomic claim with optimistic locking
    // 1. Update work order status and claimed_by
    const { data: wo, error: woErr } = await supabaseAdmin
      .from('work_orders')
      .update({
        claimed_by: technicianId,
        status: 'open',
        claimed_at: new Date().toISOString(),
        ...(ket && { ket })
      })
      .eq('id', workOrderId)
      .eq('status', 'confirmed')
      .is('claimed_by', null)
      .select('*')
      .single();

    if (woErr) {
      return errorResponse(`Database error updating work order: ${woErr.message}`, 500);
    }

    if (!wo) {
      return errorResponse('Work order is no longer available or already claimed', 409);
    }

    // 2. Write lead + members to work_order_assignments
    const assignmentRows = [
      { 
        work_order_id: workOrderId, 
        employee_id: technicianId, 
        assignment_role: 'lead', 
        assigned_at: new Date().toISOString() 
      },
      ...teamMembers.map(memberId => ({
        work_order_id: workOrderId, 
        employee_id: memberId, 
        assignment_role: 'member', 
        assigned_at: new Date().toISOString()
      }))
    ];

    const { error: assignErr } = await supabaseAdmin
      .from('work_order_assignments')
      .upsert(assignmentRows, { onConflict: 'work_order_id,employee_id' });

    if (assignErr) {
      console.warn('Gagal menyimpan assignment tim:', assignErr.message);
      // We don't fail the whole request since the WO is already claimed, 
      // but it's good to log or handle it.
    }

    return jsonResponse({
      success: true,
      message: 'Work order claimed successfully',
      data: wo
    });

  } catch (error) {
    console.error('Claim work order error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});

