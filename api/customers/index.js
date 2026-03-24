/**
 * GET /api/customers
 * 
 * Fetch paginated list of customers.
 * 
 * Query Parameters:
 * - limit: number of records (default: 50, max: 100)
 * - offset: pagination offset (default: 0)
 * - search: search term for name/customer_code
 * 
 * Response:
 * {
 *   "data": [...customers],
 *   "count": total_count,
 *   "limit": 50,
 *   "offset": 0
 * }
 */

import { supabase, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Optional: Verify authentication
    // Uncomment if you want to require auth for this endpoint
    // const { user, error: authError } = await verifyAuth(req);
    // if (authError) {
    //   return errorResponse(authError, 401);
    // }

    // Parse query parameters
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const search = url.searchParams.get('search') || '';

    // Build query
    let query = supabase
      .from('customers')
      .select('*, roles(name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,customer_code.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return errorResponse(`Database error: ${error.message}`, 500);
    }

    return jsonResponse({
      data,
      count,
      limit,
      offset
    }, 200, {
      'Cache-Control': 's-maxage=10, stale-while-revalidate=59'
    });

  } catch (error) {
    console.error('List customers error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
