import { supabase } from '../src/api/supabase.js';

async function diagnose() {
    const itemCode = 'REP2605002';
    console.log(`Diagnosing WO: ${itemCode}`);

    const { data: wo, error: woError } = await supabase
        .from('work_orders')
        .select(`
            id, item_code, status, employee_id, claimed_by,
            work_order_assignments(id, employee_id, assignment_role, employees(name))
        `)
        .eq('item_code', itemCode)
        .single();

    if (woError) {
        console.error('Error fetching WO:', woError);
        return;
    }

    console.log('Work Order Data:', JSON.stringify(wo, null, 2));
}

diagnose();
