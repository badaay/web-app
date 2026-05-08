const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL_A || process.env.VITE_SUPABASE_URL_A || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY_A || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: SUPABASE_URL_A and SUPABASE_SERVICE_ROLE_KEY_A must be set in .env');
    process.exit(1);
}

// Use Service Role Key for seeding to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedPointRules() {
    const rules = [
        { rule_name: 'Potongan Terlambat', rule_type: 'deduction', trigger_metric: 'minutes_late', trigger_unit: 15, amount_per_unit: 5000, is_multiplier: true },
        { rule_name: 'Bonus Prestasi Poin', rule_type: 'addition', trigger_metric: 'points_earned', trigger_unit: 100, amount_per_unit: 10000, is_multiplier: true },
        { rule_name: 'Potongan Under Target', rule_type: 'deduction', trigger_metric: 'points_shortage', trigger_unit: 1, amount_per_unit: 11600, is_multiplier: true }
    ];
    console.log('Seeding Point Conversion Rules...');
    const { error } = await supabase.from('point_conversion_rules').upsert(rules, { onConflict: 'rule_name' });
    if (error) console.error('Error seeding point rules:', error.message);
    else console.log('Point rules seeded successfully.');
}

async function updateEmployeeTargets() {
    console.log('Updating Employee target_monthly_points...');
    // We'll give technicians some target points
    const { data: employees, error } = await supabase
        .from('employees')
        .select('id, name, position')
        .or('position.ilike.%Teknisi%,position.ilike.%Technician%');

    if (error) {
        console.error('Error fetching employees:', error.message);
        return [];
    }

    const updates = employees.map(emp => ({
        id: emp.id,
        target_monthly_points: emp.position.includes('Senior') ? 800 : 500
    }));

    for (const update of updates) {
        const { error: upError } = await supabase
            .from('employees')
            .update({ target_monthly_points: update.target_monthly_points })
            .eq('id', update.id);
        if (upError) console.error(`Error updating target for ${update.id}:`, upError.message);
    }
    console.log(`Updated targets for ${employees.length} employees.`);
    return employees;
}

async function seedSalaryConfigs(employees) {
    console.log('Seeding Employee Salary Configurations...');
    const configs = employees.map(emp => ({
        employee_id: emp.id,
        position_allowance: emp.position.includes('Senior') ? 500000 : 200000,
        additional_allowance: 100000,
        quota_allowance: 50000,
        education_allowance: 0,
        transport_meal_allowance: 300000,
        field_allowance: emp.position.includes('Senior') ? 250000 : 150000,
        communication_allowance: 50000,
        effective_from: '2024-01-01'
    }));

    const { error } = await supabase.from('employee_salary_configs').upsert(configs, { onConflict: 'employee_id,effective_from' });
    if (error) console.error('Error seeding salary configs:', error.message);
    else console.log('Salary configurations seeded successfully.');
}

async function seedAttendance(employees) {
    console.log('Seeding Attendance Records for May 2026...');
    const attendance = [];
    const year = 2026;
    const month = 5; // May

    for (const emp of employees) {
        // Seed first 5 days of May
        for (let day = 1; day <= 5; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Randomize lateness
            let lateMinutes = 0;
            let checkIn = '08:00:00';
            const rand = Math.random();
            if (rand > 0.7) {
                lateMinutes = Math.floor(Math.random() * 60) + 1; // 1-60 mins late
                const mins = lateMinutes % 60;
                checkIn = `08:${String(mins).padStart(2, '0')}:00`;
            }

            attendance.push({
                employee_id: emp.id,
                attendance_date: dateStr,
                check_in: `${dateStr} ${checkIn}`,
                check_out: `${dateStr} 17:00:00`,
                late_minutes: lateMinutes,
                is_absent: false
            });
        }
    }

    const { error } = await supabase.from('attendance_records').upsert(attendance, { onConflict: 'employee_id,attendance_date' });
    if (error) console.error('Error seeding attendance:', error.message);
    else console.log('Attendance records seeded successfully.');
}

async function seedWorkOrders(employees) {
    console.log('Seeding Work Orders and Assignments...');
    
    // Create 2 sample work orders
    const workOrders = [
        { 
            title: 'Pemasangan PSB Area Bangkalan', 
            status: 'closed', 
            created_at: '2026-05-01 10:00:00', 
            closed_at: '2026-05-01 14:00:00' 
        },
        { 
            title: 'Perbaikan Gangguan Signal Low', 
            status: 'closed', 
            created_at: '2026-05-02 09:00:00', 
            closed_at: '2026-05-02 11:00:00' 
        }
    ];

    const { data: insertedWOs, error: woError } = await supabase.from('work_orders').insert(workOrders).select();
    if (woError) {
        console.error('Error seeding work orders:', woError.message);
        return;
    }

    const assignments = [];
    if (insertedWOs && insertedWOs.length > 0 && employees.length > 0) {
        // Assignment for first WO
        assignments.push({
            work_order_id: insertedWOs[0].id,
            employee_id: employees[0].id,
            assignment_role: 'lead',
            points_earned: 100,
            bonus_points: 0,
            deduction_points: 0
        });

        if (employees.length > 1) {
            assignments.push({
                work_order_id: insertedWOs[0].id,
                employee_id: employees[1].id,
                assignment_role: 'member',
                points_earned: 50,
                bonus_points: 0,
                deduction_points: 0
            });
        }

        // Assignment for second WO
        if (insertedWOs.length > 1) {
            assignments.push({
                work_order_id: insertedWOs[1].id,
                employee_id: employees[0].id,
                assignment_role: 'lead',
                points_earned: 150,
                bonus_points: 50,
                deduction_points: 0
            });
        }
    }

    const { error: asError } = await supabase.from('work_order_assignments').insert(assignments);
    if (asError) console.error('Error seeding assignments:', asError.message);
    else console.log('Work orders and assignments seeded successfully.');
}

async function main() {
    console.log('--- STARTING POINT SYSTEM DATA SEED (JS) ---');
    await seedPointRules();
    const technicians = await updateEmployeeTargets();
    
    if (technicians.length > 0) {
        await seedSalaryConfigs(technicians);
        await seedAttendance(technicians);
        await seedWorkOrders(technicians);
    } else {
        console.warn('No technicians found to seed salary/attendance/work orders.');
    }
    
    console.log('--- POINT SYSTEM DATA SEED COMPLETED ---');
}

main();
