/**
 * API: Payroll Period Detail
 * GET period detail with employee summaries via v_payroll_summaries view
 */

import { verifyAuth, jsonResponse, errorResponse, withCors, supabaseAdminB } from '../../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (request) => {
    const { user, error: authError } = await verifyAuth(request);
    if (authError) return errorResponse('Unauthorized', 401);

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const periodId = pathParts[pathParts.length - 1];

    if (request.method === 'GET') {
        if (!supabaseAdminB) return errorResponse('Project not configured', 503);

        // Get period info
        const { data: period, error: periodErr } = await supabaseAdminB
            .from('payroll_periods')
            .select('*')
            .eq('id', periodId)
            .single();

        if (periodErr) return errorResponse(periodErr.message, 404);

        // Get employee summaries via the view (relationship baked in)
        const { data: summaries, error: sumErr } = await supabaseAdminB
            .from('v_payroll_summaries')
            .select('*')
            .eq('payroll_period_id', periodId)
            .order('employee_name', { ascending: true });

        if (sumErr) return errorResponse(sumErr.message, 500);

        return jsonResponse({ period, summaries });
    }

    return errorResponse('Method not allowed', 405);
});
