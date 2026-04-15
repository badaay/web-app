/**
 * GET  /api/overtime   — list overtime records with assignments
 * POST /api/overtime   — create overtime event + auto-assign amounts
 */
import { verifyAuth, hasRole, jsonResponse, errorResponse, withCors, supabaseAdmin, supabaseAdminB } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
    const { user, error: authErr } = await verifyAuth(req);
    if (authErr) return errorResponse(authErr, 401);

    // ──────────── GET ────────────
    if (req.method === 'GET') {
        const url     = new URL(req.url);
        const dateFrom = url.searchParams.get('date_from');
        const dateTo   = url.searchParams.get('date_to');
        const limit    = parseInt(url.searchParams.get('limit')  || '50');
        const offset   = parseInt(url.searchParams.get('offset') || '0');

        const now = new Date();
        const from = dateFrom || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
        const to   = dateTo   || new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];

        let query = supabaseAdminB
            .from('overtime_records')
            .select(`
                *,
                overtime_assignments(
                    id, amount_earned,
                    employees!employee_id(id, name, employee_id)
                )
            `, { count: 'exact' })
            .gte('overtime_date', from)
            .lte('overtime_date', to)
            .order('overtime_date', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ data, count, limit, offset });
    }

    // ──────────── POST ────────────
    if (req.method === 'POST') {
        const canManage = await hasRole(user.id, ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH']);
        if (!canManage) return errorResponse('Forbidden', 403);

        const {
            overtime_date, start_time, end_time,
            description, overtime_type,
            technician_ids = [],
            work_order_id = null
        } = await req.json();

        if (!overtime_date || !start_time || !end_time || !description || technician_ids.length === 0) {
            return errorResponse('overtime_date, start_time, end_time, description, and at least one technician are required', 400);
        }

        // Get hourly rate from settings
        const { data: rateSetting } = await supabaseAdmin
            .from('app_settings')
            .select('setting_value')
            .eq('setting_key', 'overtime_rate_per_hour')
            .single();
        const hourlyRate = parseInt(rateSetting?.setting_value || '10000');

        // Calculate total hours
        const [sh, sm] = start_time.split(':').map(Number);
        const [eh, em] = end_time.split(':').map(Number);
        let totalMins = (eh * 60 + em) - (sh * 60 + sm);
        if (totalMins < 0) totalMins += 24 * 60; // overnight
        const totalHours = parseFloat((totalMins / 60).toFixed(2));
        const totalAmount = Math.round(totalHours * hourlyRate);
        const perPersonAmount = Math.round(totalAmount / technician_ids.length);

        // Insert overtime record
        const { data: ot, error: otErr } = await supabaseAdminB
            .from('overtime_records')
            .insert({
                overtime_date, start_time, end_time,
                description, overtime_type,
                total_hours: totalHours,
                hourly_rate: hourlyRate,
                total_amount: totalAmount,
                work_order_id,
                created_by: user.id
            })
            .select()
            .single();
        if (otErr) return errorResponse(otErr.message, 500);

        // Insert assignments (split evenly)
        const assignments = technician_ids.map(emp_id => ({
            overtime_id: ot.id,
            employee_id: emp_id,
            amount_earned: perPersonAmount
        }));
        const { error: assignErr } = await supabaseAdminB
            .from('overtime_assignments')
            .insert(assignments);
        if (assignErr) return errorResponse(assignErr.message, 500);

        return jsonResponse({ success: true, data: { ...ot, assignments } }, 201);
    }

    // ──────────── DELETE ────────────
    if (req.method === 'DELETE') {
        const canManage = await hasRole(user.id, ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH']);
        if (!canManage) return errorResponse('Forbidden', 403);

        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();
        if (!id || id === 'overtime') return errorResponse('ID required', 400);

        const { error } = await supabaseAdminB.from('overtime_records').delete().eq('id', id);
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ success: true });
    }

    return errorResponse('Method not allowed', 405);
});
