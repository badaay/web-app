/**
 * GET /api/bills/public?token=secret_token
 * 
 * Publicly accessible API to fetch a single bill by its secret token.
 * No Authentication needed.
 */

import { supabaseAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    if (req.method !== 'GET') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return errorResponse('Token is required.', 400);
        }

        const { data: bill, error } = await supabaseAdmin
            .from('customer_bills')
            .select(`
                *,
                customers (
                    name,
                    customer_code,
                    phone,
                    address,
                    packet
                )
            `)
            .eq('secret_token', token)
            .single();

        if (error || !bill) {
            return errorResponse('Tagihan tidak ditemukan atau token tidak valid.', 404);
        }

        // Return bill data
        return jsonResponse({
            success: true,
            data: bill
        });

    } catch (err) {
        console.error('[Public Bill Fetch Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
