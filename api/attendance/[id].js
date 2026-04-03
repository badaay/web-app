/**
 * API: Attendance Records - Update & Delete
 * Task 3.2: PATCH update, DELETE remove
 * Ref: pre-planning/03-data-model-proposal.md#22-attendance-records
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
        // TODO: Task 3.2 - PATCH update attendance record
        // Body: { check_in_time?, is_absent?, notes? }
        // - Recalculate deduction if check_in_time or is_absent changed
        // - Return updated record
        
        const body = await request.json();
        
        return jsonResponse({ 
            message: 'TODO: Implement PATCH attendance',
            recordId,
            body 
        });
    }

    if (request.method === 'DELETE') {
        // TODO: Task 3.2 - DELETE remove attendance record
        // - Delete record by id
        // - Return success
        
        return jsonResponse({ 
            message: 'TODO: Implement DELETE attendance',
            recordId 
        });
    }

    return errorResponse('Method not allowed', 405);
});
