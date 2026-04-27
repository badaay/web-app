/**
 * POST /api/work-orders/revision
 * Admin requests a revision for a completed work order.
 */
import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { requestRevision } from '../_core/work-order.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  // Authorization: Admins only
  if (!await isAdmin(user.id)) return errorResponse('Forbidden: Admin access required', 403);

  const { workOrderId, reason } = await req.json();
  
  const result = await requestRevision(supabaseAdmin, workOrderId, { reason }, user);
  
  if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
  return jsonResponse(result.data);
});
