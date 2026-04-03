/**
 * PATCH /api/bills/mark-paid
 * 
 * Mark a bill as paid and send a WhatsApp confirmation.
 * Requires Admin or Treasurer role.
 * 
 * Body:
 * {
 *   "bill_id": "uuid",
 *   "payment_method": "transfer" | "cash",
 *   "notes": "optional string"
 * }
 */

import { supabaseAdmin, verifyAuth, isFinance, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { formatMessage, enqueueNotification, getTokenConfig } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    if (req.method !== 'PATCH') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        const { user, error: authError } = await verifyAuth(req);
        if (authError) return errorResponse(authError, 401);
        if (!(await isFinance(user.id))) return errorResponse('Forbidden: Akses ditolak.', 403);

        const { bill_id, payment_method = 'transfer', notes } = await req.json();

        if (!bill_id) return errorResponse('Bill ID is required.', 400);

        // 1. Fetch bill and customer details
        const { data: bill, error: fetchError } = await supabaseAdmin
            .from('customer_bills')
            .select('*, customers(id, name, phone)')
            .eq('id', bill_id)
            .single();

        if (fetchError || !bill) return errorResponse('Tagihan tidak ditemukan.', 404);
        if (bill.status === 'paid') return errorResponse('Tagihan sudah lunas.', 400);

        // 2. Update bill status
        const { error: updateError } = await supabaseAdmin
            .from('customer_bills')
            .update({
                status: 'paid',
                payment_method,
                payment_date: new Date().toISOString(),
                notes: notes || bill.notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', bill_id);

        if (updateError) throw updateError;

        // 3. Prepare Notification
        const cfg = await getTokenConfig();
        if (cfg && bill.customers?.phone) {
            // Determine Base URL for invoice link
            // Try to get from app_settings first
            const { data: appUrlSetting } = await supabaseAdmin
                .from('app_settings')
                .select('setting_value')
                .eq('setting_key', 'APP_URL')
                .maybeSingle();
            
            const origin = new URL(req.url).origin;
            const baseUrl = appUrlSetting?.setting_value || origin;
            const invoiceLink = `${baseUrl}/invoice.html?token=${bill.secret_token}`;

            const periodDate = new Date(bill.period_date);
            const periodStr = periodDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

            const variables = {
                name: bill.customers.name,
                period: periodStr,
                amount: new Intl.NumberFormat('id-ID').format(bill.amount),
                invoice_link: invoiceLink
            };

            await enqueueNotification({
                recipient: bill.customers.phone,
                messageType: 'payment_received',
                payload: variables,
                priority: 1, // High priority
                refId: `pay-${bill.id}`,
                sourceId: bill.customer_id,
                routingMap: cfg.routing
            });
        }

        return jsonResponse({ success: true, message: 'Tagihan berhasil ditandai lunas dan notifikasi telah dijadwalkan.' });

    } catch (err) {
        console.error('[Bills Mark Paid Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
