/**
 * GET /api/financial-transactions/summary
 *
 * Delegates to FinanceService.
 */

import { supabaseAdmin, verifyAuth, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { getFinancialSummary } from '../_core/finance.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
  const { user, error: authErr } = await verifyAuth(req);
  if (authErr) return errorResponse(authErr, 401);

  if (req.method !== 'GET') return errorResponse('Method not allowed', 405);

  const url = new URL(req.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  const result = await getFinancialSummary(supabaseAdmin, { startDate, endDate });

  if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
  return jsonResponse(result.data);
});
