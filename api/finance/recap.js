import { supabaseAdminB, verifyAuth, withCors, jsonResponse, errorResponse, isFinance } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);

    if (!(await isFinance(user.id))) {
        return errorResponse('Forbidden: Akses ditolak.', 403);
    }

    if (!supabaseAdminB) return errorResponse('Project B (Vault) not configured', 503);

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'monthly'; // daily, monthly
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (mode === 'daily') {
        // Group by bank name
        const { data, error } = await supabaseAdminB
            .from('v_financial_recap')
            .select('amount, type, bank_account_id, bank_name')
            .eq('transaction_date', date);
        
        if (error) return errorResponse(error.message, 500);

        const recap = {};
        data.forEach(tx => {
            const bankName = tx.bank_name || 'Lainnya';
            if (!recap[bankName]) recap[bankName] = { income: 0, expense: 0 };
            if (tx.type === 'income') recap[bankName].income += parseFloat(tx.amount);
            else recap[bankName].expense += parseFloat(tx.amount);
        });

        return jsonResponse({ date, recap });
    }

    if (mode === 'monthly') {
        const month = searchParams.get('month') || (new Date().getMonth() + 1);
        const year = searchParams.get('year') || new Date().getFullYear();
        
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        // Using direct query instead of RPC if RPC is not in Project B (schema.sql mostly Project A)
        const { data, error } = await supabaseAdminB
            .from('financial_transactions')
            .select('amount, type, category')
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate);
        
        if (error) return errorResponse(error.message, 500);

        const summary = {
            total_income: 0,
            total_expense: 0,
            income_by_category: {},
            expense_by_category: {}
        };

        data.forEach(tx => {
            const amt = parseFloat(tx.amount);
            if (tx.type === 'income') {
                summary.total_income += amt;
                summary.income_by_category[tx.category] = (summary.income_by_category[tx.category] || 0) + amt;
            } else {
                summary.total_expense += amt;
                summary.expense_by_category[tx.category] = (summary.expense_by_category[tx.category] || 0) + amt;
            }
        });

        return jsonResponse(summary);
    }

    return errorResponse('Invalid mode', 400);
});
