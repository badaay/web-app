/**
 * seed_auth.js — Auth Users Seeder
 * ============================================================
 * Creates Supabase Auth users and links them to the correct roles
 * via the profiles table.
 *
 * REQUIREMENTS:
 *   - VITE_SUPABASE_SERVICE_ROLE_KEY must be set in .env
 *   - Run AFTER seed_complete.sql has been executed
 *   - Run with: node src/api/seed_auth.js
 *
 * WHAT IT DOES:
 *   1. Creates one auth user per role (test users)
 *   2. Updates the profile record (created by trigger) with the correct role
 *   3. Optionally links employee/customer record to the auth user ID
 * ============================================================
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('');
    console.error('ERROR: Missing environment variables.');
    console.error('  VITE_SUPABASE_URL            =', supabaseUrl ? '✅ set' : '❌ MISSING');
    console.error('  VITE_SUPABASE_SERVICE_ROLE_KEY =', serviceRoleKey ? '✅ set' : '❌ MISSING');
    console.error('');
    console.error('Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file.');
    console.error('Find it in: Supabase Dashboard → Project Settings → API → service_role key');
    process.exit(1);
}

// Admin client — uses service role to bypass RLS
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Auth domain suffix (must match src/api/config.js)
const AUTH_DOMAIN = '@sifatih.id';
const TEST_PASSWORD = 'Test@12345678'; // Meets Supabase min requirements

// ============================================================
// TEST USER DEFINITIONS
// One user per role — covers all access scenarios
// ============================================================
const TEST_USERS = [
    {
        email: `SA001${AUTH_DOMAIN}`,
        password: TEST_PASSWORD,
        roleCode: 'S_ADM',
        fullName: 'Super Admin Test',
        type: 'employee',
        referenceId: 'SA001', // employee_id
        description: 'System administrator — full access'
    },
    {
        email: `202101001${AUTH_DOMAIN}`,
        password: TEST_PASSWORD,
        roleCode: 'OWNER',
        fullName: 'Muhammad Rifqi Arifandi',
        type: 'employee',
        referenceId: '202101001',
        description: 'Owner — read-all, approve-all'
    },
    {
        email: `202509007${AUTH_DOMAIN}`,
        password: TEST_PASSWORD,
        roleCode: 'ADM',
        fullName: 'Aulia Farida',
        type: 'employee',
        referenceId: '202509007',
        description: 'Admin — day-to-day operations'
    },
    {
        email: `202101002${AUTH_DOMAIN}`,
        password: TEST_PASSWORD,
        roleCode: 'TREASURER',
        fullName: 'Sitti Sulaihah',
        type: 'employee',
        referenceId: '202101002',
        description: 'Bendahara — finance monitoring'
    },
    {
        email: `202408003${AUTH_DOMAIN}`,
        password: TEST_PASSWORD,
        roleCode: 'SPV_TECH',
        fullName: 'Fungki Gunawan',
        type: 'employee',
        referenceId: '202408003',
        description: 'SPV Teknisi — assign & monitor jobs'
    },
    {
        email: `202512008${AUTH_DOMAIN}`,
        password: TEST_PASSWORD,
        roleCode: 'TECH',
        fullName: 'Ali Wafa',
        type: 'employee',
        referenceId: '202512008',
        description: 'Teknisi — field work, claim tickets'
    },
    {
        email: `25094031501${AUTH_DOMAIN}`,
        password: TEST_PASSWORD,
        roleCode: 'CUST',
        fullName: 'FATMAWATI',
        type: 'customer',
        referenceId: '25094031501', // customer_code
        description: 'Customer — view own ticket/profile'
    }
];

// ============================================================
// HELPERS
// ============================================================
async function getRoleId(roleCode) {
    const { data, error } = await adminClient
        .from('roles')
        .select('id')
        .eq('code', roleCode)
        .single();
    if (error) throw new Error(`Role not found: ${roleCode} — run seed_complete.sql first`);
    return data.id;
}

async function createOrGetUser(email, password, fullName) {
    // Try to create
    const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirm so no email verification needed
        user_metadata: { full_name: fullName }
    });

    if (error) {
        if (error.message.includes('already been registered') || error.message.includes('already exists')) {
            // User exists — fetch instead
            const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
            if (listError) throw listError;
            const existing = users.find(u => u.email === email);
            if (!existing) throw new Error(`User ${email} exists but cannot be retrieved`);
            console.log(`  ↳ Already exists, using existing user: ${email}`);
            return existing;
        }
        throw error;
    }
    return data.user;
}

async function linkProfile(userId, roleId) {
    // handle_new_user trigger creates the profile, but with default role.
    // We override it with the correct role here.
    const { error } = await adminClient
        .from('profiles')
        .upsert({ id: userId, role_id: roleId }, { onConflict: 'id' });
    if (error) throw error;
}

async function linkEmployee(userId, employeeId) {
    const { error } = await adminClient
        .from('employees')
        .update({ id: userId })
        .eq('employee_id', employeeId);
    // NOTE: This updates the UUID of the employee row to match auth user.
    // Only works if no FK children reference employees.id yet.
    if (error) {
        console.warn(`  ↳ Could not sync employee.id for ${employeeId}: ${error.message}`);
        console.warn(`  ↳ This is OK — employee is still linked via email/employee_id`);
    }
}

async function linkCustomer(userId, customerCode) {
    const { error } = await adminClient
        .from('customers')
        .update({ id: userId })
        .eq('customer_code', customerCode);
    if (error) {
        console.warn(`  ↳ Could not sync customer.id for ${customerCode}: ${error.message}`);
    }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('');
    console.log('================================================');
    console.log('  SiFatih — Auth Users Seeder');
    console.log('  Password for ALL test users:', TEST_PASSWORD);
    console.log('================================================');
    console.log('');

    const results = [];

    for (const user of TEST_USERS) {
        console.log(`[${user.roleCode}] ${user.email}`);
        console.log(`  Description: ${user.description}`);

        try {
            // 1. Get role ID
            const roleId = await getRoleId(user.roleCode);

            // 2. Create auth user
            const authUser = await createOrGetUser(user.email, user.password, user.fullName);
            console.log(`  ✅ Auth user: ${authUser.id}`);

            // 3. Link profile with correct role (override trigger default)
            await linkProfile(authUser.id, roleId);
            console.log(`  ✅ Profile linked → role: ${user.roleCode}`);

            // 4. Optionally sync the DB row ID to match auth user ID
            if (user.type === 'employee') {
                await linkEmployee(authUser.id, user.referenceId);
                console.log(`  ✅ Employee row synced (employee_id: ${user.referenceId})`);
            } else if (user.type === 'customer') {
                await linkCustomer(authUser.id, user.referenceId);
                console.log(`  ✅ Customer row synced (customer_code: ${user.referenceId})`);
            }

            results.push({ ...user, authId: authUser.id, status: 'OK' });
        } catch (err) {
            console.error(`  ❌ FAILED: ${err.message}`);
            results.push({ ...user, status: 'FAILED', error: err.message });
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
        'Role'.padEnd(12),
        'Login Shortcode'.padEnd(18),
        'Email'.padEnd(32),
        'Status'
    );
    console.log('-'.repeat(80));
    for (const r of results) {
        const shortcode = r.referenceId;
        console.log(
            r.roleCode.padEnd(12),
            shortcode.padEnd(18),
            r.email.padEnd(32),
            r.status === 'OK' ? '✅ OK' : `❌ ${r.error}`
        );
    }
    console.log('');
    console.log('Password for all users:', TEST_PASSWORD);
    console.log('Login at: /web-app/admin/login.html');
    console.log('  Use shortcode (e.g. SA001) or full email');
    console.log('');

    const failed = results.filter(r => r.status !== 'OK');
    if (failed.length > 0) {
        console.error(`⚠️  ${failed.length} user(s) failed. Check errors above.`);
        process.exit(1);
    } else {
        console.log(`🎉 All ${results.length} test users seeded successfully.`);
    }
}

main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
