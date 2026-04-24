/**
 * GET /api/customers
 *
 * Fetch paginated list of customers.
 * Thin handler — delegates to CustomerService.
 */

import { supabaseAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { listCustomers } from '../_core/customer.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
  const offset = parseInt(url.searchParams.get('offset')) || 0;
  const search = url.searchParams.get('search') || '';

  const result = await listCustomers(supabaseAdmin, { limit, offset, search });

  if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));

  return jsonResponse(result.data, 200, {
    'Cache-Control': 's-maxage=10, stale-while-revalidate=59'
  });
});
