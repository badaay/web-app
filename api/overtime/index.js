/**
 * API: Overtime Records - List & Create
 * Task 4.1: GET list, POST create with multi-technician assignments
 * Ref: pre-planning/03-data-model-proposal.md#23-overtime-records
 */

import { verifyAuth, isAdmin, jsonResponse, errorResponse, withCors, supabaseAdmin } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (request) => {
    const user = await verifyAuth(request);
    if (!user) return errorResponse('Unauthorized', 401);

    if (request.method === 'GET') {
        // TODO: Task 4.1 - GET overtime list with filters
        // Query params: date_from, date_to, limit, offset
        // - Join with overtime_assignments for technician names
        // - Return paginated results with assignment details
        
        const url = new URL(request.url);
        const dateFrom = url.searchParams.get('date_from');
        const dateTo = url.searchParams.get('date_to');
        
        return jsonResponse({ 
            message: 'TODO: Implement GET overtime list',
            filters: { dateFrom, dateTo }
        });
    }

    if (request.method === 'POST') {
        const admin = await isAdmin(user.id);
        if (!admin) return errorResponse('Forbidden', 403);

        // TODO: Task 4.1 - POST create overtime with assignments
        // Body: { 
        //   overtime_date, start_time, end_time, description, overtime_type,
        //   technician_ids: [uuid, uuid, ...]
        // }
        // - Calculate total_hours from start/end time
        // - Get hourly_rate from app_settings
        // - Calculate total_amount = hours * rate
        // - Create overtime_record
        // - Create overtime_assignments for each technician (amount = total / count)
        // - Return created record with assignments
        
        const body = await request.json();
        
        return jsonResponse({ 
            message: 'TODO: Implement POST overtime',
            body 
        });
    }

    return errorResponse('Method not allowed', 405);
});
