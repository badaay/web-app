import { supabaseAdmin, supabaseAdminB, verifyAuth, isFinance, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { markBillAsPaid } from '../../src/core/services/bill.service.js';


export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    if (req.method !== 'PATCH') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        const { user, error: authError } = await verifyAuth(req);
        if (authError) return errorResponse(authError, 401);
        if (!(await isFinance(user.id))) return errorResponse('Forbidden: Akses ditolak.', 403);

        const paymentData = await req.json();
        const { bill_id } = paymentData;

        const { success, data, error, statusHint } = await markBillAsPaid(
            supabaseAdmin, 
            supabaseAdminB, 
            bill_id, 
            paymentData, 
            user
        );

        if (!success) {
            const status = statusHint === 'not_found' ? 404 : (statusHint === 'bad_request' ? 400 : 500);
            return errorResponse(error || statusHint, status);
        }

        return jsonResponse({ success: true, message: 'Tagihan berhasil ditandai lunas.' });


    } catch (err) {
        console.error('[Bills Mark Paid Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
