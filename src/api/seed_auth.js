/**
 * seed_auth.js — Auth Users Seeder (Dynamic DB-Driven)
 * ============================================================
 * Creates Supabase Auth users for all employees found in the 
 * database and links them to the correct roles via the profiles table.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

// Admin client for bypass RLS
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const AUTH_DOMAIN = '@sifatih.id';
const DEFAULT_PASSWORD = 'Sifatih2026!'; 

async function createOrGetUser(email, password, fullName, metadata = {}) {
    const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { ...metadata, full_name: fullName }
    });

    if (error) {
        if (error.message.includes('already been registered') || error.message.includes('already exists')) {
            const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
            if (listError) throw listError;
            const targetEmail = email.toLowerCase();
            const existing = users.find(u => u.email.toLowerCase() === targetEmail);
            if (!existing) throw new Error(`User ${email} exists but cannot be retrieved`);
            
            await adminClient.auth.admin.updateUserById(existing.id, {
                password: password,
                user_metadata: { ...existing.user_metadata, ...metadata, full_name: fullName }
            });
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

async function main() {
    console.log('--- STARTING AUTH SEED ---');
    
    // 1. Fetch employees with their roles
    const { data: employees, error: empError } = await adminClient
        .from('employees')
        .select('*, roles(code, name)');

    if (empError) {
        console.error('Error fetching employees:', empError.message);
        return;
    }

    console.log(`Processing ${employees.length} employees...`);

    for (const emp of employees) {
        const email = emp.email || `${emp.employee_id}${AUTH_DOMAIN}`;
        const roleCode = emp.roles?.code || 'TECH';
        const roleName = emp.roles?.name || 'Teknisi';

        try {
            console.log(`[${roleCode}] Seeding ${emp.name}...`);
            const authUser = await createOrGetUser(email, DEFAULT_PASSWORD, emp.name, {
                employee_id: emp.employee_id,
                role: roleCode
            });

            if (emp.role_id) {
                await linkProfile(authUser.id, emp.role_id);
                
                // Sync employees.id with Auth UID for consistency
                await adminClient.from('employees').update({ id: authUser.id }).eq('employee_id', emp.employee_id);
                
                console.log(`  ✅ Profile linked & Employee ID synced: ${roleName}`);
            } else {
                console.warn(`  ⚠️  Missing role_id for ${emp.name}`);
            }
        } catch (err) {
            console.error(`  ❌ Failed ${emp.name}:`, err.message);
        }
    }
    
    console.log('--- AUTH SEED COMPLETED ---');
    console.log('Default Password:', DEFAULT_PASSWORD);
}

if (require.main === module) {
    main();
}

module.exports = { main };
