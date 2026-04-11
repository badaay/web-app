/**
 * API Endpoint: /api/financial-transactions/summary
 *
 * - GET: Provides a summary of income and expenses over a specified period.
 *
 * Accessible only by finance-related roles (S_ADM, OWNER, TREASURER).
 */
import { supabaseAdmin, verifyAuth, withCors, jsonResponse, errorResponse, hasRole } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);

    const isFinanceUser = await hasRole(user.id, ['S_ADM', 'OWNER', 'TREASURER']);
    if (!isFinanceUser) {
        return errorResponse('Forbidden: Access is restricted to finance roles.', 403);
    }

    if (req.method === 'GET') {
        return handleGet(req, user);
    }

    return errorResponse('Method not allowed', 405);
});

async function handleGet(req, user) {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return errorResponse('Both startDate and endDate are required.', 400);
    }

    const { data, error } = await supabaseAdmin.rpc('get_financial_summary', {
        start_date: startDate,
        end_date: endDate
    });

    if (error) {
        return errorResponse(error.message, 500);
    }

    return jsonResponse(data);
}
