import { supabaseAdmin, supabaseAdminB, verifyAuth, isFinance, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
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

        const { bill_id, payment_method = 'transfer', bank_account_id, payment_date, notes } = await req.json();

        if (!bill_id) return errorResponse('Bill ID is required.', 400);

        // 1. Fetch bill and customer details
        const { data: bill, error: fetchError } = await supabaseAdmin
            .from('customer_bills')
            .select('*, customers(id, name, phone, customer_code)')
            .eq('id', bill_id)
            .single();

        if (fetchError || !bill) return errorResponse('Tagihan tidak ditemukan.', 404);
        if (bill.status === 'paid') return errorResponse('Tagihan sudah lunas.', 400);

        const realPaymentDate = payment_date || new Date().toISOString();

        // 2. Update bill status (Project A)
        const { error: updateError } = await supabaseAdmin
            .from('customer_bills')
            .update({
                status: 'paid',
                payment_method,
                payment_date: realPaymentDate,
                notes: notes || bill.notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', bill_id);

        if (updateError) throw updateError;

        // 3. Create Financial Transaction (Project B)
        if (supabaseAdminB) {
            let finalBankId = bank_account_id;
            
            // If no bank_account_id provided, try to find one based on payment_method name
            if (!finalBankId) {
                const searchName = payment_method === 'cash' ? 'Tunai' : (payment_method === 'transfer' ? 'BCA' : payment_method);
                const { data: bank } = await supabaseAdminB
                    .from('bank_accounts')
                    .select('id')
                    .ilike('name', `%${searchName}%`)
                    .limit(1)
                    .maybeSingle();
                finalBankId = bank?.id;
            }

            const { error: txError } = await supabaseAdminB
                .from('financial_transactions')
                .insert({
                    transaction_date: realPaymentDate.split('T')[0],
                    payment_date: realPaymentDate,
                    type: 'income',
                    category: 'Layanan Internet',
                    description: `Pembayaran internet ${bill.customers?.name} (${bill.customers?.customer_code || ''})`,
                    amount: bill.amount,
                    payment_method: payment_method,
                    bank_account_id: finalBankId,
                    reference_id: bill.id,
                    is_verified: true, // Auto-verified since admin/treasurer is doing it
                    verified_at: new Date().toISOString(),
                    verified_by_profile_id: user.id,
                    created_at: new Date().toISOString()
                });
            
            if (txError) console.error('[Finance Ledger Error]:', txError);

            // Update bank balance
            if (finalBankId) {
                await supabaseAdminB.rpc('increment_bank_balance', { 
                    account_id: finalBankId, 
                    amount: bill.amount 
                });
            }
        }

        // 4. Prepare Notification
        const cfg = await getTokenConfig();
        if (cfg && bill.customers?.phone) {
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
                priority: 1,
                refId: `pay-${bill.id}`,
                sourceId: bill.customers.id,
                routingMap: cfg.routing
            });
        }

        return jsonResponse({ success: true, message: 'Tagihan berhasil ditandai lunas, pencatatan keuangan selesai, dan notifikasi telah dijadwalkan.' });

    } catch (err) {
        console.error('[Bills Mark Paid Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
