/**
 * API: Mark Payroll Period as Paid
 * POST /api/finance/mark-paid
 * Story 2.4: Bulk approval & disbursement logging
 */

import { supabaseAdminB, verifyAuth, isFinance, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { markPayrollPaid } from '../_core/finance.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
    if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse('Unauthorized', 401);

    if (!(await isFinance(user.id))) {
        return errorResponse('Forbidden: TREASURER, OWNER, or S_ADM access required', 403);
    }

    if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);

    try {
        const { period_id } = await req.json();
        const result = await markPayrollPaid(supabaseAdminB, period_id, user.id);

        if (!result.success) {
            return errorResponse(result.error, mapToHttpStatus(result.statusHint));
        }

        return jsonResponse(result.data);
    } catch (err) {
        console.error('Mark-paid handler error:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
