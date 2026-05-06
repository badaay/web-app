/**
 * seed_enhanced.js — Enhanced Data Seeder
 * ============================================================
 * Seeds realistic transactional data including Work Orders, 
 * Assignments, and many Customers.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedEnhancedInventory() {
    console.log('Seeding Enhanced Inventory (with standard categories)...');
    const items = [
        { name: 'Modem ONT Huawei HG8310M', stock: 30, unit: 'Unit', category: 'Modem', purchase_price: 165000, unit_price: 275000 },
        { name: 'Kabel UTP Cat6', stock: 1000, unit: 'Meter', category: 'Cable', purchase_price: 2500, unit_price: 5000 },
        { name: 'Splitter 1:4', stock: 80, unit: 'Buah', category: 'Accessories', purchase_price: 35000, unit_price: 60000 },
        { name: 'Closure Aerial 2 Port', stock: 25, unit: 'Buah', category: 'Accessories', purchase_price: 120000, unit_price: 180000 }
    ];

    const { error } = await supabase.from('inventory_items').upsert(items, { onConflict: 'name' });
    if (error) console.error('  ❌ Error inventory:', error.message);
    else console.log('  ✅ Inventory enhanced.');
}

async function seedWorkOrders() {
    console.log('Seeding Realistic Work Orders...');
    
    // 1. Fetch required references
    const { data: customers } = await supabase.from('customers').select('id, name').limit(10);
    const { data: employees } = await supabase.from('employees').select('id, name').neq('employee_id', 'SA001').limit(5);
    const { data: types } = await supabase.from('master_queue_types').select('id, name, short_code');

    if (!customers?.length || !types?.length) {
        console.error('  ❌ Missing Customers or Queue Types. Run seed_data first.');
        return;
    }

    const typePSB = types.find(t => t.name === 'PSB')?.id;
    const typeRepair = types.find(t => t.name === 'Repair')?.id;
    const typeUpgrade = types.find(t => t.name === 'Upgrade')?.id;

    const workOrders = [
        { 
            customer_id: customers[0].id, 
            type_id: typePSB, 
            title: `Pemasangan Baru: ${customers[0].name}`, 
            status: 'waiting', 
            ket: 'Pemasangan paket 20Mbps',
            registration_date: new Date().toISOString().split('T')[0]
        },
        { 
            customer_id: customers[1].id, 
            type_id: typeRepair, 
            title: `Perbaikan: ${customers[1].name}`, 
            status: 'confirmed', 
            ket: 'LOS Merah / Kabel Putus',
            registration_date: new Date().toISOString().split('T')[0]
        },
        { 
            customer_id: customers[2].id, 
            type_id: typeUpgrade, 
            title: `Upgrade: ${customers[2].name}`, 
            status: 'open', 
            ket: 'Upgrade ke 50Mbps',
            registration_date: new Date().toISOString().split('T')[0]
        }
    ];

    // Note: Triggers will generate item_code automatically on insert
    const { data: createdWOs, error: woError } = await supabase.from('work_orders').insert(workOrders).select();
    
    if (woError) {
        console.error('  ❌ Error work orders:', woError.message);
        return;
    }
    console.log(`  ✅ ${createdWOs.length} Work Orders seeded with automatic item_codes.`);

    // 2. Add Assignments for 'open' or 'confirmed' orders
    if (employees?.length > 0) {
        const assignments = [];
        const openWO = createdWOs.find(wo => wo.status === 'open');
        const confirmedWO = createdWOs.find(wo => wo.status === 'confirmed');

        if (openWO) {
            assignments.push({ work_order_id: openWO.id, employee_id: employees[0].id, assignment_role: 'lead' });
        }
        if (confirmedWO) {
            assignments.push({ work_order_id: confirmedWO.id, employee_id: employees[1].id, assignment_role: 'lead' });
        }

        if (assignments.length > 0) {
            const { error: asgnError } = await supabase.from('work_order_assignments').insert(assignments);
            if (asgnError) console.error('  ❌ Error assignments:', asgnError.message);
            else console.log('  ✅ Assignments linked.');
        }
    }
}

async function main() {
    console.log('--- ENHANCED SEEDING START ---');
    await seedEnhancedInventory();
    await seedWorkOrders();
    console.log('--- ENHANCED SEEDING COMPLETE ---');
}

if (require.main === module) {
    main();
}

module.exports = { main };
