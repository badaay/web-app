import { supabaseAdminB, verifyAuth, withCors, jsonResponse, errorResponse, isFinance } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);

    if (!(await isFinance(user.id))) {
        return errorResponse('Forbidden: Akses ditolak.', 403);
    }

    if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);

    const { method } = req;
    const { searchParams } = new URL(req.url);

    if (method === 'GET') {
        const { data, error } = await supabaseAdminB
            .from('bank_accounts')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) return errorResponse(error.message, 500);
        return jsonResponse(data);
    }

    if (method === 'POST') {
        const body = await req.json();
        const { action, bank_account_id, balance, notes } = body;

        // Action: snapshot
        if (action === 'snapshot') {
            if (!bank_account_id || balance === undefined) {
                return errorResponse('bank_account_id and balance are required for snapshot.', 400);
            }

            const { data, error } = await supabaseAdminB
                .from('bank_balance_snapshots')
                .insert({
                    bank_account_id,
                    balance,
                    notes,
                    created_by: user.id,
                    snapshot_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) return errorResponse(error.message, 500);

            // Update current balance in bank_accounts
            await supabaseAdminB
                .from('bank_accounts')
                .update({ current_balance: balance, created_at: new Date().toISOString() }) // abuse created_at for last updated if needed, but we have snapshot_at
                .eq('id', bank_account_id);

            return jsonResponse(data, 201);
        }

        // Action: CRUD (Create Bank Account)
        const { name, account_number, account_holder, current_balance = 0 } = body;
        const { data, error } = await supabaseAdminB
            .from('bank_accounts')
            .insert({ name, account_number, account_holder, current_balance })
            .select()
            .single();
        
        if (error) return errorResponse(error.message, 500);
        return jsonResponse(data, 201);
    }

    if (method === 'PATCH') {
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return errorResponse('ID is required.', 400);

        const { data, error } = await supabaseAdminB
            .from('bank_accounts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) return errorResponse(error.message, 500);
        return jsonResponse(data);
    }

    return errorResponse('Method not allowed', 405);
});
