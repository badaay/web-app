/**
 * API: Attendance Records - List & Create
 * Task 3.1: GET list with filters, POST create with auto-deduction
 * Ref: pre-planning/03-data-model-proposal.md#22-attendance-records
 */

import { verifyAuth, isAdmin, jsonResponse, errorResponse, withCors, supabaseAdmin } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (request) => {
    const user = await verifyAuth(request);
    if (!user) return errorResponse('Unauthorized', 401);

    if (request.method === 'GET') {
        // TODO: Task 3.1 - GET attendance list with filters
        // Query params: employee_id, date_from, date_to, limit, offset
        // - Join with employees for name
        // - Default to current month
        // - Return paginated results
        
        const url = new URL(request.url);
        const employeeId = url.searchParams.get('employee_id');
        const dateFrom = url.searchParams.get('date_from');
        const dateTo = url.searchParams.get('date_to');
        
        return jsonResponse({ 
            message: 'TODO: Implement GET attendance list',
            filters: { employeeId, dateFrom, dateTo }
        });
    }

    if (request.method === 'POST') {
        const admin = await isAdmin(user.id);
        if (!admin) return errorResponse('Forbidden', 403);

        // TODO: Task 3.1 - POST create attendance record
        // Body: { employee_id, attendance_date, check_in_time, is_absent, notes }
        // - Auto-calculate late_minutes if check_in_time provided
        // - Auto-calculate deduction_amount using calculate_late_deduction()
        // - Handle is_absent = true → max deduction
        // - Return created record
        
        const body = await request.json();
        
        return jsonResponse({ 
            message: 'TODO: Implement POST attendance',
            body 
        });
    }

    return errorResponse('Method not allowed', 405);
});
