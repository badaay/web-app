/**
 * POST /api/work-orders/confirm
 *
 * Delegates to WorkOrderService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { confirmWorkOrder } from '../_core/work-order.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const adminUser = await isAdmin(user.id);
  if (!adminUser) return errorResponse('Forbidden: Admin access required', 403);

  const { id, employeeId } = await req.json();
  const result = await confirmWorkOrder(supabaseAdmin, id, employeeId);
  
  if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
  return jsonResponse(result.data);
});
