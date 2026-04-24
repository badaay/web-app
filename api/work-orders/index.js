/**
 * GET  /api/work-orders
 * POST /api/work-orders
 *
 * Delegates to WorkOrderService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { listWorkOrders, createWorkOrder } from '../_core/work-order.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const status = url.searchParams.get('status') || null;
    const search = url.searchParams.get('search') || '';

    const result = await listWorkOrders(supabaseAdmin, { limit, offset, status, search });
    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    
    return jsonResponse(result.data, 200, {
      'Cache-Control': 's-maxage=5, stale-while-revalidate=30',
    });
  }

  if (req.method === 'POST') {
    const adminUser = await isAdmin(user.id);
    if (!adminUser) return errorResponse('Forbidden: Admin access required', 403);

    const body = await req.json();
    const result = await createWorkOrder(supabaseAdmin, body);
    
    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse(result.data, 201);
  }

  return errorResponse('Method not allowed', 405);
});
