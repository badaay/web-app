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

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();

    if (req.method === 'DELETE') {
        // Guard: Check if period is locked (Project B)
        const { data: adjustment } = await supabaseAdminB
            .from('payroll_adjustments')
            .select('payroll_period_id')
            .eq('id', id)
            .single();

        if (adjustment) {
            const { data: period } = await supabaseAdminB
                .from('payroll_periods')
                .select('status')
                .eq('id', adjustment.payroll_period_id)
                .single();

            if (period && ['approved', 'paid'].includes(period.status)) {
                return errorResponse(`Cannot delete adjustment in a ${period.status} period`, 409);
            }
        }

        const { error } = await supabaseAdminB
            .from('payroll_adjustments')
            .delete()
            .eq('id', id);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ success: true, message: 'Adjustment deleted' });
    }

    if (req.method === 'PATCH') {
        const body = await req.json();
        const { status, amount, reason } = body;

        const updateData = {};
        if (status) {
            updateData.status = status;
            if (status === 'approved') {
                updateData.approved_by = user.id;
                updateData.approved_at = new Date().toISOString();
            }
        }
        if (amount) updateData.amount = amount;
        if (reason) updateData.reason = reason;

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdminB
            .from('payroll_adjustments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse(data);
    }

    return errorResponse('Method not allowed', 405);
});
