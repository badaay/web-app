import { supabaseAdmin, supabaseAdminB, verifyAuth, withCors, jsonResponse, errorResponse, hasRole } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);

    const isFinanceUser = await hasRole(user.id, ['S_ADM', 'OWNER', 'TREASURER', 'ADM']);
    if (!isFinanceUser) {
        return errorResponse('Forbidden: Access is restricted to finance roles.', 403);
    }

    if (req.method === 'GET') {
        return handleGet(req, user);
    }

    if (req.method === 'POST') {
        return handlePost(req, user);
    }

    if (req.method === 'PATCH') {
        return handlePatch(req, user);
    }

    return errorResponse('Method not allowed', 405);
});

async function handleGet(req, user) {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const verified = searchParams.get('verified');

    if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);

    let query = supabaseAdminB
        .from('v_financial_recap')
        .select('*')
        .order('payment_date', { ascending: false, nullsFirst: false })
        .order('transaction_date', { ascending: false });

    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    if (type) query = query.eq('type', type);
    if (verified === 'true') query = query.eq('is_verified', true);
    if (verified === 'false') query = query.eq('is_verified', false);

    const { data, error } = await query;

    if (error) return errorResponse(error.message, 500);

    return jsonResponse(data);
}

async function handlePost(req, user) {
    try {
        const body = await req.json();
        const {
            transaction_date,
            payment_date,
            type,
            category,
            description,
            amount,
            payment_method,
            bank_account_id,
            is_verified = false
        } = body;

        if (!type || !category || !description || !amount) {
            return errorResponse('Missing required fields: type, category, description, amount.', 400);
        }

        if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);

        const realTransactionDate = transaction_date || new Date().toISOString().split('T')[0];
        const realPaymentDate = payment_date || new Date().toISOString();

        const { data, error } = await supabaseAdminB
            .from('financial_transactions')
            .insert({
                transaction_date: realTransactionDate,
                payment_date: realPaymentDate,
                type,
                category,
                description,
                amount,
                payment_method,
                bank_account_id,
                is_verified,
                created_by: user.id,
                verified_at: is_verified ? new Date().toISOString() : null,
                verified_by_profile_id: is_verified ? user.id : null
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Update bank balance if bank_account_id is provided
        if (bank_account_id) {
            const balanceChange = type === 'income' ? amount : -amount;
            await supabaseAdminB.rpc('increment_bank_balance', { 
                account_id: bank_account_id, 
                amount: balanceChange
            });
        }

        return jsonResponse(data, 201);

    } catch (err) {
        return errorResponse(err.message, 400);
    }
}

async function handlePatch(req, user) {
    try {
        const { id, is_verified, bank_account_id, payment_date } = await req.json();
        if (!id) return errorResponse('ID is required.', 400);
        if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);

        const updateData = {};
        if (is_verified !== undefined) {
            updateData.is_verified = is_verified;
            if (is_verified) {
                updateData.verified_at = new Date().toISOString();
                updateData.verified_by_profile_id = user.id;
            } else {
                updateData.verified_at = null;
                updateData.verified_by_profile_id = null;
            }
        }
        if (bank_account_id) updateData.bank_account_id = bank_account_id;
        if (payment_date) updateData.payment_date = payment_date;

        const { data: oldTx } = await supabaseAdminB.from('financial_transactions').select('*').eq('id', id).single();

        const { data, error } = await supabaseAdminB
            .from('financial_transactions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Balance adjustment logic if bank_account_id changed or tx was verified/unverified
        // (For simplicity in this version, we assume balance is updated on creation. 
        //  A full ledger system would track this more rigorously).

        return jsonResponse(data);
    } catch (err) {
        return errorResponse(err.message, 400);
    }
}
