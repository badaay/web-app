/**
 * POST /api/bills/generate
 * 
 * Bulk generate monthly bills for all active customers.
 * Requires Admin or Treasurer role.
 * 
 * Body:
 * {
 *   "period_month": number,
 *   "period_year": number,
 *   "overwrite": boolean (default true)
 * }
 */

import { supabaseAdmin, supabaseAdminB, verifyAuth, isFinance, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { generateMonthlyBills } from '../../src/core/services/bill.service.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        const { user, error: authError } = await verifyAuth(req);
        if (authError || !user) return errorResponse(authError || 'Unauthorized', 401);
        if (!(await isFinance(user.id))) return errorResponse('Forbidden: Akses ditolak.', 403);

        const { period_month, period_year, overwrite = true } = await req.json();


        const { success, data, error, statusHint } = await generateMonthlyBills(
            supabaseAdmin, 
            supabaseAdminB, 
            period_month, 
            period_year, 
            overwrite
        );

        if (!success) {
            return errorResponse(error || statusHint, statusHint === 'bad_request' ? 400 : 500);
        }

        return jsonResponse({ 
            success: true, 
            message: data.message,
            count: data.count
        });


    } catch (err) {
        console.error('[Bills Generate Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
