/**
 * API: Overtime Records - Update & Delete
 * Task 4.2: PATCH update, DELETE with cascade
 * Ref: pre-planning/03-data-model-proposal.md#23-overtime-records
 */

import { verifyAuth, isAdmin, jsonResponse, errorResponse, withCors, supabaseAdmin } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (request) => {
    const user = await verifyAuth(request);
    if (!user) return errorResponse('Unauthorized', 401);

    const admin = await isAdmin(user.id);
    if (!admin) return errorResponse('Forbidden', 403);

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const recordId = pathParts[pathParts.length - 1];

    if (request.method === 'PATCH') {
        // TODO: Task 4.2 - PATCH update overtime record
        // Body: { start_time?, end_time?, description?, technician_ids? }
        // - If times changed, recalculate total_hours and total_amount
        // - If technician_ids changed, delete old assignments and create new
        // - Return updated record with assignments
        
        const body = await request.json();
        
        return jsonResponse({ 
            message: 'TODO: Implement PATCH overtime',
            recordId,
            body 
        });
    }

    if (request.method === 'DELETE') {
        // TODO: Task 4.2 - DELETE overtime record
        // - Delete record (CASCADE deletes assignments)
        // - Return success
        
        return jsonResponse({ 
            message: 'TODO: Implement DELETE overtime',
            recordId 
        });
    }

    return errorResponse('Method not allowed', 405);
});
