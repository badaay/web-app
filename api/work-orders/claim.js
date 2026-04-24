/**
 * POST /api/work-orders/claim
 *
 * Delegates to WorkOrderService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { claimWorkOrder } from '../_core/work-order.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { id, technicianId, teamMembers, ket } = await req.json();
  
  // Authorization: Admins can claim for anyone, technicians can claim for themselves
  const adminUser = await isAdmin(user.id);
  
  const result = await claimWorkOrder(supabaseAdmin, id, { technicianId, teamMembers, ket }, user, adminUser);
  
  if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
  return jsonResponse(result.data);
});
