/**
 * GET /api/bills
 * 
 * List billing records with optional filtering.
 * Requires Admin or Treasurer role.
 * 
 * Query Params:
 * - status: 'unpaid', 'paid', 'cancelled'
 * - customer_id: uuid
 * - limit: number (default 50)
 * - offset: number (default 0)
 * - period_year: number
 * - period_month: number
 */

import { supabaseAdmin, verifyAuth, isFinance, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    if (req.method !== 'GET') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        const { user, error: authError } = await verifyAuth(req);
        if (authError) return errorResponse(authError, 401);
        if (!(await isFinance(user.id))) return errorResponse('Forbidden: Akses ditolak.', 403);

        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const customerId = url.searchParams.get('customer_id');
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        const offset = parseInt(url.searchParams.get('offset')) || 0;
        const periodYear = url.searchParams.get('period_year');
        const periodMonth = url.searchParams.get('period_month');

        let query = supabaseAdmin
            .from('customer_bills')
            .select(`
                *,
                customers (
                    id,
                    name,
                    customer_code,
                    phone,
                    packet
                )
            `, { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customer_id', customerId);
        
        if (periodYear && periodMonth) {
            const startDate = `${periodYear}-${periodMonth.padStart(2, '0')}-01`;
            // Simplified: we just match the exact period_date if we store it as 1st of month
            query = query.eq('period_date', startDate);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return jsonResponse({ data, count, limit, offset });

    } catch (err) {
        console.error('[Bills Index Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
