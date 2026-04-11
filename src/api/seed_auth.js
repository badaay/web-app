/**
 * seed_auth.js — Auth Users Seeder (Dynamic DB-Driven)
 * ============================================================
 * Creates Supabase Auth users for all employees found in the 
 * database and links them to the correct roles via the profiles table.
 *
 * REQUIREMENTS:
 *   - SUPABASE_SERVICE_ROLE_KEY_A must be set in .env
 *   - Run AFTER project_a_core_schema.sql has been executed
 *   - Run with: node src/api/seed_auth.js
 *
 * WHAT IT DOES:
 *   1. Fetches all employees from public.employees (excluding SA001)
 *   2. Creates one auth user per employee
 *   3. Synchronizes public.profiles with the correct role_id
 * ============================================================
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Project A (Core) Configuration
const supabaseUrl = process.env.SUPABASE_URL_A || process.env.VITE_SUPABASE_URL_A;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY_A;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('');
    console.error('ERROR: Missing environment variables for Project A.');
    console.error('  SUPABASE_URL_A              =', supabaseUrl ? '✅ set' : '❌ MISSING');
    console.error('  SUPABASE_SERVICE_ROLE_KEY_A =', serviceRoleKey ? '✅ set' : '❌ MISSING');
    console.error('');
    console.error('Check your .env file.');
    process.exit(1);
}

// Admin client — uses service role to bypass RLS
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Configuration
const AUTH_DOMAIN = '@sifatih.id';
const DEFAULT_PASSWORD = 'Sifatih2026!'; 
const EXCLUDE_EMPLOYEE_ID = 'SA001'; // Protect the superadmin
const SUPERADMIN_ID = 'SA001';
const SUPERADMIN_NAME = 'Super Administrator';

// ============================================================
// HELPERS
// ============================================================

async function createOrGetUser(email, password, fullName, metadata = {}) {
    // Try to create
    const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { ...metadata, full_name: fullName }
    });

    if (error) {
        if (error.message.includes('already been registered') || error.message.includes('already exists')) {
            // User exists — fetch instead
            const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
            if (listError) throw listError;
            const existing = users.find(u => u.email === email);
            if (!existing) throw new Error(`User ${email} exists but cannot be retrieved`);
            
            // Update metadata/password just in case
            await adminClient.auth.admin.updateUserById(existing.id, {
                password: password,
                user_metadata: { ...existing.user_metadata, ...metadata, full_name: fullName }
            });

            console.log(`  ↳ Already exists, updated existing user: ${email}`);
            return existing;
        }
        throw error;
    }
    return data.user;
}

async function linkProfile(userId, roleId) {
    const { error } = await adminClient
        .from('profiles')
        .upsert({ id: userId, role_id: roleId }, { onConflict: 'id' });
    if (error) throw error;
}

// ============================================================
// SPECIAL: SUPERADMIN SEEDER
// ============================================================

async function seedSuperAdmin() {
    console.log(`[SYS] Seeding Superadmin: ${SUPERADMIN_ID}...`);

    const email = `${SUPERADMIN_ID}${AUTH_DOMAIN}`;

    // 1. Get OWNER role_id
    const { data: role, error: roleError } = await adminClient
        .from('roles')
        .select('id, name')
        .eq('code', 'OWNER')
        .single();

    if (roleError) {
        console.error('  ❌ Failed to fetch OWNER role. Make sure schema is applied.');
        throw roleError;
    }

    // 2. Create/Update auth user
    const authUser = await createOrGetUser(email, DEFAULT_PASSWORD, SUPERADMIN_NAME, {
        employee_id: SUPERADMIN_ID,
        role: 'OWNER'
    });
    console.log(`  ✅ Auth user: ${authUser.id}`);

    // 3. Link profile directly
    await linkProfile(authUser.id, role.id);
    console.log(`  ✅ Profile linked → role: Owner (Superadmin)`);
    
    return { 
        name: SUPERADMIN_NAME, 
        id: SUPERADMIN_ID, 
        email, 
        role: 'Owner (Superadmin)', 
        status: 'OK' 
    };
}

/**
 * seedFinanceAdmin()
 * Special admin with finance access
 */
async function seedFinanceAdmin() {
    console.log(`[SYS] Seeding Finance Admin: ADM001...`);

    const email = `ADM001${AUTH_DOMAIN}`;
    
    // 1. Get ADM role_id
    const { data: role } = await adminClient.from('roles').select('id').eq('code', 'ADM').single();

    const authUser = await createOrGetUser(email, DEFAULT_PASSWORD, 'Admin Finance', {
        employee_id: 'ADM001',
        role: 'ADM'
    });
    console.log(`  ✅ Auth user: ${authUser.id}`);

    await linkProfile(authUser.id, role.id);
    console.log(`  ✅ Profile linked → role: Admin (Finance)`);

    return { 
        name: 'Admin Finance', 
        id: 'ADM001', 
        email, 
        role: 'Admin (Finance)', 
        status: 'OK' 
    };
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('');
    console.log('================================================');
    console.log('  SiFatih — Dynamic Auth Seeder');
    console.log('  Mode: Production/Testing (Excluding Superadmin)');
    console.log('================================================');
    console.log('');

    try {
        // 0. Seed Special Accounts (Auth only)
        const saResult = await seedSuperAdmin();
        const admResult = await seedFinanceAdmin();
        const results = [saResult, admResult];
        console.log('');

        // 1. Fetch employees to seed
        console.log(`Fetching employees from ${supabaseUrl}...`);
        const { data: employees, error: empError } = await adminClient
            .from('employees')
            .select('*, roles(code, name)')
            .neq('employee_id', EXCLUDE_EMPLOYEE_ID);

        if (empError) throw empError;
        if (!employees || employees.length === 0) {
            console.log('No employees found to seed (or all excluded).');
            return;
        }

        console.log(`Found ${employees.length} employees to process.`);
        console.log('');

        for (const emp of employees) {
            const email = emp.email || `${emp.employee_id}${AUTH_DOMAIN}`;
            const roleCode = emp.roles?.code || 'TECH';
            const roleName = emp.roles?.name || 'Teknisi';

            console.log(`[${roleCode}] ${emp.name} <${email}>`);

            try {
                // 2. Create/Update auth user
                const authUser = await createOrGetUser(email, DEFAULT_PASSWORD, emp.name, {
                    employee_id: emp.employee_id,
                    role: roleCode
                });
                console.log(`  ✅ Auth user: ${authUser.id}`);

                // 3. Link profile with correct role_id from employee table
                if (emp.role_id) {
                    await linkProfile(authUser.id, emp.role_id);
                    console.log(`  ✅ Profile linked → role: ${roleName}`);
                } else {
                    console.warn(`  ⚠️  Warning: Employee missing role_id. Skipping profile sync.`);
                }

                results.push({ 
                    name: emp.name, 
                    id: emp.employee_id, 
                    email, 
                    role: roleName, 
                    status: 'OK' 
                });
            } catch (err) {
                console.error(`  ❌ FAILED: ${err.message}`);
                results.push({ 
                    name: emp.name, 
                    id: emp.employee_id, 
                    email, 
                    role: roleName, 
                    status: 'FAILED', 
                    error: err.message 
                });
            }
            console.log('');
        }

        // ============================================================
        // SUMMARY TABLE
        // ============================================================
        console.log('================================================');
        console.log('  SEED SUMMARY');
        console.log('================================================');
        console.log('');
        console.log(
            'Name'.padEnd(25),
            'ID'.padEnd(12),
            'Role'.padEnd(15),
            'Status'
        );
        console.log('-'.repeat(70));
        for (const r of results) {
            console.log(
                r.name.substring(0, 24).padEnd(25),
                r.id.padEnd(12),
                r.role.padEnd(15),
                r.status === 'OK' ? '✅ OK' : `❌ ${r.error}`
            );
        }
        console.log('');
        console.log('Default Password:', DEFAULT_PASSWORD);
        console.log('Login at: /admin/login');
        console.log('');

        const failed = results.filter(r => r.status !== 'OK');
        if (failed.length > 0) {
            console.error(`⚠️  ${failed.length} user(s) failed. Check details above.`);
            process.exit(1);
        } else {
            console.log(`🎉 All ${results.length} employee accounts seeded successfully.`);
        }

    } catch (err) {
        console.error('Fatal error:', err.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
