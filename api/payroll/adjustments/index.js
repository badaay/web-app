import { verifyAuth, isAdmin, jsonResponse, errorResponse, withCors, supabaseAdmin, supabaseAdminB } from '../../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
    const { user, error: authErr } = await verifyAuth(req);
    if (authErr) return errorResponse(authErr, 401);

    if (!supabaseAdminB) return errorResponse('Project B (Vault) is not configured', 500);

    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) {
        const { data: roleCode } = await supabaseAdmin.rpc('get_my_role');
        if (!['S_ADM', 'OWNER', 'ADM', 'TREASURER'].includes(roleCode)) {
            return errorResponse('Forbidden: Administrative access required', 403);
        }
    }

    if (req.method === 'GET') {
        const url = new URL(req.url);
        const period_id = url.searchParams.get('period_id');
        const employee_id = url.searchParams.get('employee_id');

        let query = supabaseAdminB
            .from('payroll_adjustments')
            .select('*')
            .order('created_at', { ascending: false });

        if (period_id) query = query.eq('payroll_period_id', period_id);
        if (employee_id) query = query.eq('employee_id', employee_id);

        const { data: adjustments, error } = await query;
        if (error) return errorResponse(error.message, 500);

        // Fetch employee names from Project A
        if (adjustments?.length > 0) {
            const empIds = [...new Set(adjustments.map(a => a.employee_id))];
            const { data: employees } = await supabaseAdmin
                .from('employees')
                .select('id, name, employee_id')
                .in('id', empIds);

            const empMap = Object.fromEntries(employees?.map(e => [e.id, e]) || []);
            const result = adjustments.map(a => ({
                ...a,
                employees: empMap[a.employee_id] || { name: 'Unknown' }
            }));
            return jsonResponse(result);
        }

        return jsonResponse(adjustments);
    }

    if (req.method === 'POST') {
        const body = await req.json();
        const { payroll_period_id, employee_id, adjustment_type, amount, reason, status } = body;

        if (!payroll_period_id || !employee_id || !adjustment_type || !amount || !reason) {
            return errorResponse('Missing required fields', 400);
        }

        // Validate period status in Project B
        const { data: period } = await supabaseAdminB
            .from('payroll_periods')
            .select('status')
            .eq('id', payroll_period_id)
            .single();

        if (period && ['approved', 'paid'].includes(period.status)) {
            return errorResponse(`Cannot add adjustments to a ${period.status} period`, 409);
        }

        const { data, error } = await supabaseAdminB
            .from('payroll_adjustments')
            .insert({
                payroll_period_id,
                employee_id,
                adjustment_type,
                amount,
                reason,
                requested_by: user.id,
                approved_by: status === 'approved' ? user.id : null,
                approved_at: status === 'approved' ? new Date().toISOString() : null,
                status: status || 'pending'
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse(data, 201);
    }

    return errorResponse('Method not allowed', 405);
});
