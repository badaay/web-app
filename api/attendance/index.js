/**
 * GET  /api/attendance        — list with filters
 * POST /api/attendance        — create record (auto-calculates late deduction)
 */
import { verifyAuth, hasRole, jsonResponse, errorResponse, withCors, supabaseAdminB } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
    const { user, error: authErr } = await verifyAuth(req);
    if (authErr) return errorResponse(authErr, 401);

    // ──────────── GET ────────────
    if (req.method === 'GET') {
        const url = new URL(req.url);
        const employee_id = url.searchParams.get('employee_id');
        const date_from   = url.searchParams.get('date_from');
        const date_to     = url.searchParams.get('date_to');
        const limit       = parseInt(url.searchParams.get('limit')  || '50');
        const offset      = parseInt(url.searchParams.get('offset') || '0');

        // Default to current month if no date range
        const now   = new Date();
        const from  = date_from || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
        const to    = date_to   || new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];

        let query = supabaseAdminB
            .from('v_attendance_records')
            .select('*', { count: 'exact' })
            .gte('attendance_date', from)
            .lte('attendance_date', to)
            .order('attendance_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (employee_id) query = query.eq('employee_id', employee_id);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ data, count, limit, offset });
    }

    // ──────────── POST ────────────
    if (req.method === 'POST') {
        const canManage = await hasRole(user.id, ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH']);
        if (!canManage) return errorResponse('Forbidden', 403);

        const { employee_id, attendance_date, check_in_time, check_out_time, is_absent, notes } = await req.json();
        
        if (!employee_id || !attendance_date) {
            return errorResponse('employee_id and attendance_date are required', 400);
        }

        // Calculate deduction using helper
        const { data: deduction } = await supabaseAdminB.rpc('calculate_late_deduction', {
            p_check_in_time: check_in_time,
            p_is_absent: is_absent || false
        });

        const { data, error } = await supabaseAdminB
            .from('attendance_records')
            .upsert({
                employee_id,
                attendance_date,
                check_in_time:   check_in_time  || null,
                check_out_time:  check_out_time || null,
                late_minutes,
                is_absent,
                deduction_amount: deductionResult || 0,
                notes,
                source,
                created_by: user.id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'employee_id,attendance_date' })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ success: true, data }, 201);
    }

    return errorResponse('Method not allowed', 405);
});
