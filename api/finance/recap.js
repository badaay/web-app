import { supabaseAdminB, verifyAuth, withCors, jsonResponse, errorResponse, isFinance } from '../_lib/supabase.js';
import { getDailyRecap, getFinancialSummary } from '../../src/core/services/finance.service.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);

    if (!(await isFinance(user.id))) {
        return errorResponse('Forbidden: Akses ditolak.', 403);
    }

    if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'monthly'; // daily, monthly
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (mode === 'daily') {
        const { success, data, error, statusHint } = await getDailyRecap(supabaseAdminB, date);
        if (!success) return errorResponse(error || statusHint, 500);
        return jsonResponse(data);
    }

    if (mode === 'monthly') {
        const month = searchParams.get('month') || (new Date().getMonth() + 1);
        const year = searchParams.get('year') || new Date().getFullYear();
        
        const { success, data, error, statusHint } = await getFinancialSummary(supabaseAdminB, { month, year });
        if (!success) return errorResponse(error || statusHint, 500);
        return jsonResponse(data);
    }


    return errorResponse('Invalid mode', 400);
});
