/**
 * POST /api/work-orders/complete
 * Technician submits job evidence and marks as 'completed'.
 */
import { supabaseAdmin, verifyAuth, hasRole, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { completeWorkOrder } from '../_core/work-order.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { workOrderId, ...evidenceData } = await req.json();
  
  // Authorization: Technicians assigned, or users with specific roles
  const canCompleteForOthers = await hasRole(user.id, ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH']);
  
  const result = await completeWorkOrder(supabaseAdmin, workOrderId, evidenceData, user, canCompleteForOthers);
  
  if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
  return jsonResponse(result.data);
});
