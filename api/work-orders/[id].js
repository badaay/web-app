/**
 * PATCH  /api/work-orders/[id]
 * DELETE /api/work-orders/[id]
 *
 * Delegates to WorkOrderService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { updateWorkOrder, deleteWorkOrder } from '../_core/work-order.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (req.method === 'PATCH') {
    const adminUser = await isAdmin(user.id);
    if (!adminUser) return errorResponse('Forbidden: Admin access required', 403);

    const body = await req.json();
    const result = await updateWorkOrder(supabaseAdmin, id, body);
    
    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse(result.data);
  }

  if (req.method === 'DELETE') {
    const adminUser = await isAdmin(user.id);
    if (!adminUser) return errorResponse('Forbidden: Admin access required', 403);

    const result = await deleteWorkOrder(supabaseAdmin, id);
    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse(result.data);
  }

  return errorResponse('Method not allowed', 405);
});
