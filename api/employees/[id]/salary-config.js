/**
 * API: Employee Salary Config
 * Task 2.1: GET/POST salary configuration for employee
 * Ref: pre-planning/07-integration-points.md
 */

import { verifyAuth, isAdmin, jsonResponse, errorResponse, withCors, supabaseAdmin } from '../../../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (request) => {
    const user = await verifyAuth(request);
    if (!user) return errorResponse('Unauthorized', 401);

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const employeeId = pathParts[pathParts.indexOf('employees') + 1];

    if (request.method === 'GET') {
        // TODO: Task 2.1 - GET active salary config for employee
        // - Query employee_salary_configs where employee_id = employeeId
        // - Filter by effective_from <= today AND (effective_to IS NULL OR effective_to >= today)
        // - Return latest config or empty object
        
        return jsonResponse({ message: 'TODO: Implement GET salary config', employeeId });
    }

    if (request.method === 'POST') {
        const admin = await isAdmin(user.id);
        if (!admin) return errorResponse('Forbidden', 403);

        // TODO: Task 2.1 - POST create new salary config
        // - Close previous config (set effective_to = today - 1)
        // - Insert new config with effective_from = today
        // - Return new config
        
        return jsonResponse({ message: 'TODO: Implement POST salary config', employeeId });
    }

    return errorResponse('Method not allowed', 405);
});
