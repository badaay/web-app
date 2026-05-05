const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL_A;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY_A;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: SUPABASE_URL_A and SUPABASE_SERVICE_ROLE_KEY_A must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedAdjustments() {
    console.log('Seeding Point Adjustments...');

    // 1. Get a technician and a customer
    const { data: employees } = await supabase.from('employees').select('id, name').eq('position', 'Teknisi').limit(1);
    const { data: customers } = await supabase.from('customers').select('id, name').limit(1);
    const { data: queueTypes } = await supabase.from('master_queue_types').select('id, base_point').eq('name', 'PSB').limit(1);

    if (!employees?.length || !customers?.length || !queueTypes?.length) {
        console.error('Dependencies not found. Run npm run seed:data first.');
        return;
    }

    const techId = employees[0].id;
    const techName = employees[0].name;
    const custId = customers[0].id;
    const custName = customers[0].name;
    const typeId = queueTypes[0].id;
    const basePoint = queueTypes[0].base_point;

    console.log(`Using Tech: ${techName}, Customer: ${custName}`);

    // 2. Create/Update a demo work order
    let { data: existingWo } = await supabase.from('work_orders').select('id').eq('title', 'DEMO - Point Adjustment').maybeSingle();
    let wo;
    
    if (existingWo) {
        const { data: updatedWo, error: updateError } = await supabase.from('work_orders').update({
            status: 'closed',
            points: basePoint + 25 - 10,
            completed_at: new Date().toISOString()
        }).eq('id', existingWo.id).select().single();
        if (updateError) { console.error('Error updating WO:', updateError.message); return; }
        wo = updatedWo;
    } else {
        const { data: insertedWo, error: insertError } = await supabase.from('work_orders').insert({
            customer_id: custId,
            type_id: typeId,
            title: 'DEMO - Point Adjustment',
            status: 'closed',
            points: basePoint + 25 - 10,
            completed_at: new Date().toISOString()
        }).select().single();
        if (insertError) { console.error('Error creating WO:', insertError.message); return; }
        wo = insertedWo;
    }

    console.log('Demo Work Order Ready:', wo.id);

    // 3. Create assignment with adjustments
    const { error: asError } = await supabase.from('work_order_assignments').upsert({
        work_order_id: wo.id,
        employee_id: techId,
        assignment_role: 'lead',
        bonus_points: 25,
        deduction_points: 10,
        adjustment_reason: 'Demo Adjustment: Bonus High Performance (+25), Late Arrival Deduction (-10)',
        points_earned: basePoint + 25 - 10
    }, { onConflict: 'work_order_id,employee_id' });

    if (asError) {
        console.error('Error creating assignment:', asError.message);
    } else {
        console.log('Successfully seeded point adjustments for Work Order:', wo.id);
        console.log('Points: Base(100) + Bonus(25) - Deduction(10) = 115');
    }
}

seedAdjustments();
