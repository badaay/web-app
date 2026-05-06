/**
 * GET  /api/financial-transactions
 * POST /api/financial-transactions
 *
 * Delegates to FinanceService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { listTransactions, createTransaction } from '../_core/finance.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
  const { user, error: authErr } = await verifyAuth(req);
  if (authErr) return errorResponse(authErr, 401);

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const search = url.searchParams.get('search') || '';

    const result = await listTransactions(supabaseAdmin, { limit, offset, search });
    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse(result.data);
  }

  if (req.method === 'POST') {
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) return errorResponse('Forbidden: Admin access required', 403);

    const body = await req.json();
    const result = await createTransaction(supabaseAdmin, body, user.id);
    
    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse(result.data, 201);
  }

  return errorResponse('Method not allowed', 405);
});
