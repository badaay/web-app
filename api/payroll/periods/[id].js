/**
 * API: Payroll Period Detail
 * Task 5.1: GET period detail with employee summaries
 * Ref: pre-planning/03-data-model-proposal.md#27-payroll-summaries
 */

import { verifyAuth, jsonResponse, errorResponse, withCors, supabaseAdmin } from '../../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (request) => {
    const user = await verifyAuth(request);
    if (!user) return errorResponse('Unauthorized', 401);

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const periodId = pathParts[pathParts.length - 1];

    if (request.method === 'GET') {
        // TODO: Task 5.1 - GET payroll period detail
        // - Get period info
        // - Get all payroll_summaries for this period
        // - Join with employees for names
        // - Return period + employee summaries
        
        return jsonResponse({ 
            message: 'TODO: Implement GET payroll period detail',
            periodId
        });
    }

    return errorResponse('Method not allowed', 405);
});
