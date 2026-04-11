/**
 * POST /api/bills/generate
 * 
 * Bulk generate monthly bills for all active customers.
 * Requires Admin or Treasurer role.
 * 
 * Body:
 * {
 *   "period_month": number,
 *   "period_year": number,
 *   "overwrite": boolean (default true)
 * }
 */

import { supabaseAdmin, supabaseAdminB, verifyAuth, isFinance, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        const { user, error: authError } = await verifyAuth(req);
        if (authError || !user) return errorResponse(authError || 'Unauthorized', 401);
        if (!(await isFinance(user.id))) return errorResponse('Forbidden: Akses ditolak.', 403);

        const { period_month, period_year, overwrite = true } = await req.json();

        if (!period_month || !period_year) {
            return errorResponse('Bulan dan Tahun harus diisi.', 400);
        }

        const periodDate = `${period_year}-${String(period_month).padStart(2, '0')}-01`;

        // 1. Fetch all packages to map prices
        const { data: packages } = await supabaseAdmin.from('internet_packages').select('name, price');
        const packagePrices = {};
        (packages || []).forEach(p => { packagePrices[p.name] = p.price; });

        // 2. Fetch all customers
        const { data: customers } = await supabaseAdmin.from('customers').select('id, name, packet');
        if (!customers || customers.length === 0) {
            return jsonResponse({ success: true, message: 'Tidak ada pelanggan found.', count: 0 });
        }

        const billsToInsert = [];
        const dueDateObj = new Date(periodDate);
        dueDateObj.setDate(dueDateObj.getDate() + 10); // 10 days after period_date
        const dueDate = dueDateObj.toISOString().split('T')[0];

        for (const customer of customers) {
            const price = packagePrices[customer.packet] || 0;
            if (price <= 0) continue; // skip if no price found or price is 0

            billsToInsert.push({
                customer_id: customer.id,
                period_date: periodDate,
                due_date: dueDate,
                amount: price,
                status: 'unpaid',
                secret_token: crypto.randomUUID().replace(/-/g, '')
            });
        }

        // 3. Upsert bills into Project B (Vault)
        if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);
        const { data, error } = await supabaseAdminB
            .from('customer_bills')
            .upsert(billsToInsert, { 
                onConflict: 'customer_id, period_date',
                ignoreDuplicates: !overwrite 
            })
            .select();

        if (error) throw error;

        return jsonResponse({ 
            success: true, 
            message: `Berhasil membuat ${data.length} tagihan untuk periode ${periodDate}.`,
            count: data.length
        });

    } catch (err) {
        console.error('[Bills Generate Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
