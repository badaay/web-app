/**
 * API: Payroll Periods - List & Create
 * Task 5.1: GET list, POST create period
 * Ref: pre-planning/03-data-model-proposal.md#25-payroll-periods
 */

import { verifyAuth, isAdmin, jsonResponse, errorResponse, withCors, supabaseAdmin } from '../../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (request) => {
    const user = await verifyAuth(request);
    if (!user) return errorResponse('Unauthorized', 401);

    if (request.method === 'GET') {
        // TODO: Task 5.1 - GET payroll periods list
        // - Return all periods ordered by year, month DESC
        // - Include status, calculated_at, approved_at
        
        return jsonResponse({ 
            message: 'TODO: Implement GET payroll periods list'
        });
    }

    if (request.method === 'POST') {
        const admin = await isAdmin(user.id);
        if (!admin) return errorResponse('Forbidden', 403);

        // TODO: Task 5.1 - POST create payroll period
        // Body: { year, month }
        // - Calculate period_start (1st of month) and period_end (last of month)
        // - Create with status = 'draft'
        // - Return created period
        
        const body = await request.json();
        
        return jsonResponse({ 
            message: 'TODO: Implement POST payroll period',
            body 
        });
    }

    return errorResponse('Method not allowed', 405);
});
