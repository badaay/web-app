/**
 * POST /api/bills/resend-wa
 * 
 * Resend a WhatsApp notification for an existing bill.
 * Requires Admin or Treasurer role.
 * 
 * Body:
 * {
 *   "bill_id": "uuid"
 * }
 */

import { supabaseAdmin, verifyAuth, isFinance, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { enqueueNotification, getTokenConfig } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        const { user, error: authError } = await verifyAuth(req);
        if (authError) return errorResponse(authError, 401);
        if (!(await isFinance(user.id))) return errorResponse('Forbidden: Akses ditolak.', 403);

        const { bill_id } = await req.json();
        if (!bill_id) return errorResponse('Bill ID is required.', 400);

        // 1. Fetch bill and customer details
        const { data: bill, error: fetchError } = await supabaseAdmin
            .from('customer_bills')
            .select('*, customers(id, name, phone)')
            .eq('id', bill_id)
            .single();

        if (fetchError || !bill) return errorResponse('Tagihan tidak ditemukan.', 404);

        // 2. Prepare Notification
        const cfg = await getTokenConfig();
        if (!cfg || !bill.customers?.phone) {
            return errorResponse('Gagal konfigurasi WhatsApp atau nomor HP tidak ada.', 400);
        }

        // Determine Base URL for invoice link
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
            invoice_link: invoiceLink,
            due_date: bill.due_date ? new Date(bill.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
        };

        // Determine template based on status and due date
        let template = 'payment_received';
        if (bill.status === 'unpaid') {
            const today = new Date().toISOString().split('T')[0];
            const isOverdue = bill.due_date && today >= bill.due_date;
            template = isOverdue ? 'payment_overdue' : 'payment_due_soon';
        }

        await enqueueNotification({
            recipient: bill.customers.phone,
            messageType: template,
            payload: variables,
            priority: 1,
            refId: `resend-${bill.id}-${Date.now()}`,
            sourceId: bill.customer_id,
            routingMap: cfg.routing
        });

        return jsonResponse({ success: true, message: 'Notifikasi berhasil dikirim ulang ke antrian.' });

    } catch (err) {
        console.error('[Bills Resend WA Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
