/**
 * API: Payroll Approve
 * Task 5.3: POST approve payroll period
 * Ref: pre-planning/08-salary-calculation-flow.md#7-status-flow-diagram
 */

import { verifyAuth, isAdmin, jsonResponse, errorResponse, withCors, supabaseAdmin } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (request) => {
    if (request.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    const user = await verifyAuth(request);
    if (!user) return errorResponse('Unauthorized', 401);

    const admin = await isAdmin(user.id);
    if (!admin) return errorResponse('Forbidden', 403);

    // TODO: Task 5.3 - Approve payroll period
    // Body: { period_id }
    //
    // Step 1: Get period, validate status = 'calculated'
    // Step 2: Update status to 'approved'
    // Step 3: Set approved_by = user.id, approved_at = now()
    // Step 4: Return updated period
    
    const body = await request.json();
    const { period_id } = body;
    
    return jsonResponse({ 
        message: 'TODO: Implement payroll approval',
        period_id
    });
});
