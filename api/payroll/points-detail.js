import { verifyAuth, isAdmin, jsonResponse, errorResponse, withCors, supabaseAdmin, supabaseAdminB } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
    const { user, error: authErr } = await verifyAuth(req);
    if (authErr) return errorResponse(authErr, 401);

    if (!supabaseAdminB) return errorResponse('Project B (Vault) is not configured', 500);

    const url = new URL(req.url);
    const employee_id = url.searchParams.get('employee_id');
    const period_id = url.searchParams.get('period_id');

    if (!employee_id || !period_id) {
        return errorResponse('Missing employee_id or period_id', 400);
    }

    // Check permissions: Admin/Treasurer see all (Project A profiles); Technician see own
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck && user.id !== employee_id) {
        const { data: roleCode } = await supabaseAdmin.rpc('get_my_role');
        if (!['S_ADM', 'OWNER', 'ADM', 'TREASURER'].includes(roleCode)) {
            return errorResponse('Forbidden: You can only view your own points detail', 403);
        }
    }

    try {
        // 1. Get period dates from Project B
        const { data: period, error: pErr } = await supabaseAdminB
            .from('payroll_periods')
            .select('*')
            .eq('id', period_id)
            .single();

        if (pErr || !period) return errorResponse('Period not found in Vault (Project B)', 404);

        // 2. Fetch work order assignments from Project A
        const { data, error } = await supabaseAdmin
            .from('work_order_assignments')
            .select(`
                id,
                assigned_at,
                points_earned,
                assignment_role,
                work_orders (
                    id,
                    title,
                    status,
                    completed_at,
                    type:master_queue_types(name, icon, color),
                    customer:customers(name, customer_code)
                )
            `)
            .eq('employee_id', employee_id)
            .gte('work_orders.completed_at', period.period_start)
            .lte('work_orders.completed_at', period.period_end)
            .eq('work_orders.status', 'closed')
            .order('assigned_at', { ascending: false });

        if (error) return errorResponse(error.message, 500);

        return jsonResponse({
            employee_id,
            period_name: `${period.month}/${period.year}`,
            period_range: `${period.period_start} to ${period.period_end}`,
            total_points: data.reduce((sum, item) => sum + (item.points_earned || 0), 0),
            items: data
        });

    } catch (err) {
        return errorResponse(err.message, 500);
    }
});
