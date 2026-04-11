/**
 * API Endpoint: /api/financial-transactions
 *
 * - GET: Lists all financial transactions with optional date filtering.
 * - POST: Creates a new financial transaction (income or expense).
 *
 * Accessible only by finance-related roles (S_ADM, OWNER, TREASURER).
 */
import { supabaseAdmin, supabaseAdminB, verifyAuth, withCors, jsonResponse, errorResponse, hasRole } from '../_lib/supabase.js';

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

    if (req.method === 'POST') {
        return handlePost(req, user);
    }

    return errorResponse('Method not allowed', 405);
});

async function handleGet(req, user) {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);

    let query = supabaseAdminB
        .from('financial_transactions')
        .select(`
            *,
            profiles:created_by ( email )
        `)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (startDate) {
        query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
        query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        return errorResponse(error.message, 500);
    }

    return jsonResponse(data);
}

async function handlePost(req, user) {
    try {
        const body = await req.json();
        const {
            transaction_date,
            type,
            category,
            description,
            amount,
            payment_method
        } = body;

        // Basic validation
        if (!type || !category || !description || !amount) {
            return errorResponse('Missing required fields: type, category, description, amount.', 400);
        }
        if (type !== 'income' && type !== 'expense') {
            return errorResponse('Invalid transaction type. Must be "income" or "expense".', 400);
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return errorResponse('Amount must be a positive number.', 400);
        }

        if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);

        const { data, error } = await supabaseAdminB
            .from('financial_transactions')
            .insert({
                transaction_date: transaction_date || new Date().toISOString().split('T')[0],
                type,
                category,
                description,
                amount,
                payment_method,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            return errorResponse(error.message, 500);
        }

        return jsonResponse(data, 201);

    } catch (err) {
        return errorResponse(err.message, 400);
    }
}
