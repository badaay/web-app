const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

// Use Service Role Key for seeding to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedRoles() {
    const roles = [
        { name: 'Superadmin', code: 'S_ADM', description: 'Super Administrator - Full Access' },
        { name: 'Owner', code: 'OWNER', description: 'Pemilik Perusahaan' },
        { name: 'Bendahara', code: 'TREASURER', description: 'Bendahara / Keuangan' },
        { name: 'SPV Teknisi', code: 'SPV_TECH', description: 'Supervisor Teknisi' },
        { name: 'Admin', code: 'ADM', description: 'Administrator Kantor' },
        { name: 'Teknisi', code: 'TECH', description: 'Teknisi Lapangan' },
        { name: 'Customer', code: 'CUST', description: 'Pelanggan Internet' }
    ];
    console.log('Seeding Roles...');
    const { data, error } = await supabase.from('roles').upsert(roles, { onConflict: 'code' }).select();
    if (error) {
        console.error('Error seeding roles:', error.message);
        return null;
    }
    console.log('Roles seeded success.');
    return data;
}

async function seedQueueTypes() {
    const data = [
        { name: 'PSB', short_code: 'PSN', base_point: 100, color: '#22c55e', icon: 'bi-house-add-fill' },
        { name: 'Repair', short_code: 'REP', base_point: 50, color: '#ef4444', icon: 'bi-tools' },
        { name: 'Relocation', short_code: 'REL', base_point: 75, color: '#f59e0b', icon: 'bi-arrow-left-right' },
        { name: 'Upgrade', short_code: 'UPG', base_point: 50, color: '#3b82f6', icon: 'bi-arrow-up-circle-fill' },
        { name: 'Cancel', short_code: 'CAN', base_point: 0, color: '#6b7280', icon: 'bi-x-circle-fill' }
    ];
    console.log('Seeding Queue Types (with short_codes)...');
    const { error } = await supabase.from('master_queue_types').upsert(data, { onConflict: 'name' });
    if (error) console.error('Error queue types:', error.message);
    else console.log('Queue types success.');
}

async function seedPackages() {
    const data = [
        { name: 'Paket Hemat 15Mbps', price: 166000, speed: '15Mbps', description: 'Paket entry level' },
        { name: 'Paket Rumahan 20Mbps', price: 175000, speed: '20Mbps', description: 'Paket standar' },
        { name: 'Paket Plus 25Mbps', price: 200000, speed: '25Mbps', description: 'Paket menengah' },
        { name: 'Paket Prima 35Mbps', price: 250000, speed: '35Mbps', description: 'Paket kerja dari rumah' },
        { name: 'Paket Unggulan 50Mbps', price: 350000, speed: '50Mbps', description: 'Paket premium' }
    ];
    console.log('Seeding Packages...');
    const { error } = await supabase.from('internet_packages').upsert(data, { onConflict: 'name' });
    if (error) console.error('Error packages:', error.message);
    else console.log('Packages success.');
}

async function seedInventory() {
    const data = [
        { name: 'Kabel FO Drop 1 Core', stock: 2000, unit: 'Meter', category: 'Cable' },
        { name: 'Modem ONT ZTE F601', stock: 50, unit: 'Unit', category: 'Modem' },
        { name: 'Splitter 1:8', stock: 40, unit: 'Buah', category: 'Accessories' },
        { name: 'Tiang Besi 7m', stock: 20, unit: 'Batang', category: 'Materials' },
        { name: 'Konektor SC/APC', stock: 200, unit: 'Buah', category: 'Connector' }
    ];
    console.log('Seeding Inventory (with English categories)...');
    const { error } = await supabase.from('inventory_items').upsert(data, { onConflict: 'name' });
    if (error) console.error('Error inventory:', error.message);
    else console.log('Inventory success.');
}

async function seedAppSettings() {
    const data = [
        { setting_key: 'company_name', setting_value: 'SiFatih Net', setting_group: 'general', description: 'Nama perusahaan' },
        { setting_key: 'company_phone', setting_value: '081234567890', setting_group: 'general', description: 'Nomor telepon kantor' },
        { setting_key: 'company_address', setting_value: 'Bangkalan, Madura', setting_group: 'general', description: 'Alamat kantor' },
        { setting_key: 'auth_domain_suffix', setting_value: '@sifatih.id', setting_group: 'auth', description: 'Domain suffix untuk login' },
        { setting_key: 'default_role_code', setting_value: 'CUST', setting_group: 'auth', description: 'Role default untuk user baru' },
        { setting_key: 'maps_default_lat', setting_value: '-7.053', setting_group: 'map', description: 'Latitude pusat peta default' },
        { setting_key: 'maps_default_lng', setting_value: '112.737', setting_group: 'map', description: 'Longitude pusat peta default' },
        { setting_key: 'psb_require_ktp', setting_value: 'true', setting_group: 'workflow', description: 'Wajib upload foto KTP saat PSB' }
    ];
    console.log('Seeding App Settings...');
    const { error } = await supabase.from('app_settings').upsert(data, { onConflict: 'setting_key' });
    if (error) console.error('Error settings:', error.message);
    else console.log('Settings success.');
}

async function seedEmployees(roles) {
    const getRoleId = (code) => roles.find(r => r.code === code)?.id;
    const data = [
        { name: 'Muhammad Rifqi Arifandi', employee_id: '202101001', email: '202101001@sifatih.id', status: 'Non-Aktif', position: 'Owner', role_id: getRoleId('OWNER') },
        { name: 'Sitti Sulaihah', employee_id: '202101002', email: '202101002@sifatih.id', status: 'Non-Aktif', position: 'Bendahara', role_id: getRoleId('TREASURER') },
        { name: 'Fungki Gunawan', employee_id: '202408003', email: '202408003@sifatih.id', status: 'Aktif', position: 'SPV Teknisi', role_id: getRoleId('SPV_TECH') },
        { name: 'Aulia Farida', employee_id: '202509007', email: '202509007@sifatih.id', status: 'Aktif', position: 'Admin', role_id: getRoleId('ADM') },
        { name: 'Ali Wafa', employee_id: '202512008', email: '202512008@sifatih.id', status: 'Aktif', position: 'Teknisi', role_id: getRoleId('TECH') },
        { name: 'Abdul Wahid Hasyim', employee_id: '202602009', email: '202602009@sifatih.id', status: 'Aktif', position: 'Teknisi', role_id: getRoleId('TECH') },
        { name: 'Super Admin', employee_id: 'SA001', email: 'SA001@sifatih.id', status: 'Aktif', position: 'IT Admin', role_id: getRoleId('S_ADM') }
    ];
    console.log('Seeding Employees...');
    const { error } = await supabase.from('employees').upsert(data, { onConflict: 'employee_id' });
    if (error) console.error('Error employees:', error.message);
    else console.log('Employees success.');
}

async function seedCustomers(roles) {
    const roleId = roles.find(r => r.code === 'CUST')?.id;
    const data = [
        { name: 'FATMAWATI', customer_code: '25094031501', phone: '82333015005', email: '25094031501@sifatih.id', packet: 'Paket Rumahan 20Mbps', address: 'Mrecah, Bangkalan', role_id: roleId },
        { name: 'BUDI SANTOSO', customer_code: '26030000101', phone: '81111111101', email: '26030000101@sifatih.id', packet: 'Paket Plus 25Mbps', address: 'Jl. Raya Bangkalan No. 1', role_id: roleId }
    ];
    console.log('Seeding Customers...');
    const { error } = await supabase.from('customers').upsert(data, { onConflict: 'customer_code' });
    if (error) console.error('Error customers:', error.message);
    else console.log('Customers success.');
}

async function main() {
    console.log('--- STARTING COMPREHENSIVE DATA SEED ---');
    const roles = await seedRoles();
    if (!roles) return;

    await seedQueueTypes();
    await seedPackages();
    await seedInventory();
    await seedAppSettings();
    await seedEmployees(roles);
    await seedCustomers(roles);
    console.log('--- DATA SEED COMPLETED ---');
}

if (require.main === module) {
    main();
}

module.exports = { main };
