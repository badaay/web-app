const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedRoles() {
    const roles = [
        { name: 'Teknisi', code: 'TECH', description: 'Teknisi Lapangan' },
        { name: 'Admin', code: 'ADM', description: 'Administrator Kantor' },
        { name: 'SPV Teknisi', code: 'SPV_TECH', description: 'Supervisor Teknisi' },
        { name: 'Owner', code: 'OWNER', description: 'Pemilik Perusahaan' },
        { name: 'Bendahara', code: 'TREASURER', description: 'Bendahara / Keuangan' },
        { name: 'Superadmin', code: 'S_ADM', description: 'Super Administrator' },
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


async function seedEmployees(roles) {
    const getRoleId = (code) => roles.find(r => r.code === code)?.id;

    const data = [
        { name: 'Muhammad Rifqi Arifandi', employee_id: '202101001', email: '202101001@sifatih.id', status: 'Non-Aktif', birth_place: 'Situbondo', birth_date: '1994-12-24', position: 'Owner', education: 'S1', training: 'Ya', bpjs: 'Ya', address: 'Bangkalan', join_date: '2021-01-01', role_id: getRoleId('OWNER') },
        { name: 'Sitti Sulaihah', employee_id: '202101002', email: '202101002@sifatih.id', status: 'Non-Aktif', birth_place: 'Pamekasan', birth_date: '1995-01-31', position: 'Bendahara', education: 'S2', training: 'Ya', bpjs: 'Ya', address: 'Bangkalan', join_date: '2021-01-01', role_id: getRoleId('TREASURER') },
        { name: 'Fungki Gunawan', employee_id: '202408003', email: '202408003@sifatih.id', status: 'Aktif', birth_place: 'Bangkalan', birth_date: '2006-08-11', position: 'SPV Teknisi', education: 'SMK', training: 'Ya', bpjs: 'Ya', address: 'Bangkalan', join_date: '2024-08-01', role_id: getRoleId('SPV_TECH') },
        { name: 'Aulia Farida', employee_id: '202509007', email: '202509007@sifatih.id', status: 'Aktif', birth_place: 'Bangkalan', birth_date: '2008-01-15', position: 'Admin', education: 'SMA', training: 'Ya', bpjs: 'Ya', address: 'Bangkalan', join_date: '2025-09-01', role_id: getRoleId('ADM') },
        { name: 'Ali Wafa', employee_id: '202512008', email: '202512008@sifatih.id', status: 'Aktif', birth_place: 'Bangkalan', birth_date: '2005-05-26', position: 'Teknisi', education: 'SMA', training: 'Ya', bpjs: 'Ya', address: 'Bangkalan', join_date: '2025-12-01', role_id: getRoleId('TECH') },
        { name: 'Abdul Wahid Hasyim', employee_id: '202602009', email: '202602009@sifatih.id', status: 'Aktif', birth_place: 'Jakarta', birth_date: '1980-03-22', position: 'Teknisi', education: 'SMA', training: 'Ya', bpjs: 'Ya', address: 'Bangkalan', join_date: '2026-02-01', role_id: getRoleId('TECH') },
        { name: 'Super Admin', employee_id: 'SA001', email: 'SA001@sifatih.id', status: 'Aktif', birth_place: 'Jakarta', birth_date: '1990-01-01', position: 'IT Admin', education: 'S1', training: 'Ya', bpjs: 'Ya', address: 'Jakarta', join_date: '2021-01-01', role_id: getRoleId('S_ADM') }
    ];
    console.log('Seeding Employees...');
    const { error } = await supabase.from('employees').upsert(data, { onConflict: 'employee_id' });
    if (error) console.error('Error employees:', error.message);
    else console.log('Employees success.');
}

async function seedQueueTypes() {
    const data = [
        { name: 'PSB', base_point: 100, color: '#22c55e', icon: 'bi-house-add-fill' },
        { name: 'Repair', base_point: 50, color: '#ef4444', icon: 'bi-tools' },
        { name: 'Relocation', base_point: 75, color: '#f59e0b', icon: 'bi-arrow-left-right' },
        { name: 'Upgrade', base_point: 50, color: '#3b82f6', icon: 'bi-arrow-up-circle-fill' },
        { name: 'Cancel', base_point: 0, color: '#6b7280', icon: 'bi-x-circle-fill' }
    ];
    console.log('Seeding Queue Types...');
    const { error } = await supabase.from('master_queue_types').upsert(data, { onConflict: 'name' });
    if (error) console.error('Error queue types:', error.message);
    else console.log('Queue types success.');
}

async function seedPackages() {
    const data = [
        { name: 'Paket Hemat 15Mbps', price: 166000, speed: '15Mbps', description: 'Paket entry level untuk rumahan ringan' },
        { name: 'Paket Rumahan 20Mbps', price: 175000, speed: '20Mbps', description: 'Paket standar untuk keluarga' },
        { name: 'Paket Plus 25Mbps', price: 200000, speed: '25Mbps', description: 'Paket menengah streaming HD' },
        { name: 'Paket Prima 35Mbps', price: 250000, speed: '35Mbps', description: 'Paket kerja dari rumah' },
        { name: 'Paket Unggulan 50Mbps', price: 350000, speed: '50Mbps', description: 'Paket premium gaming dan bisnis' }
    ];
    console.log('Seeding Packages...');
    const { error } = await supabase.from('internet_packages').upsert(data, { onConflict: 'name' });
    if (error) console.error('Error packages:', error.message);
    else console.log('Packages success.');
}

async function seedInventory() {
    const data = [
        { name: 'Kabel FO Drop 1 Core', stock: 2000, unit: 'Meter', category: 'Kabel' },
        { name: 'Kabel FO Drop 2 Core', stock: 500, unit: 'Meter', category: 'Kabel' },
        { name: 'Kabel UTP Cat6', stock: 1000, unit: 'Meter', category: 'Kabel' },
        { name: 'Modem ONT ZTE F601', stock: 50, unit: 'Unit', category: 'Perangkat' },
        { name: 'Modem ONT Huawei HG8310M', stock: 30, unit: 'Unit', category: 'Perangkat' },
        { name: 'Splitter 1:4', stock: 80, unit: 'Buah', category: 'Aksesoris' },
        { name: 'Splitter 1:8', stock: 40, unit: 'Buah', category: 'Aksesoris' },
        { name: 'Closure Aerial 2 Port', stock: 25, unit: 'Buah', category: 'Aksesoris' },
        { name: 'Closure Aerial 4 Port', stock: 15, unit: 'Buah', category: 'Aksesoris' },
        { name: 'Tiang Besi 7m', stock: 20, unit: 'Batang', category: 'Infrastruktur' },
        { name: 'Konektor SC/APC', stock: 200, unit: 'Buah', category: 'Konektor' },
        { name: 'Konektor SC/UPC', stock: 150, unit: 'Buah', category: 'Konektor' },
        { name: 'Power Supply Adaptor 12V', stock: 30, unit: 'Unit', category: 'Perangkat' }
    ];
    console.log('Seeding Inventory...');
    const { error } = await supabase.from('inventory_items').upsert(data, { onConflict: 'name' });
    if (error) console.error('Error inventory:', error.message);
    else console.log('Inventory success.');
}

async function seedAppSettings() {
    const data = [
        { setting_key: 'company_name', setting_value: 'SiFatih Net', setting_group: 'general', description: 'Nama perusahaan' },
        { setting_key: 'company_phone', setting_value: '081234567890', setting_group: 'general', description: 'Nomor telepon kantor' },
        { setting_key: 'company_address', setting_value: 'Bangkalan, Madura', setting_group: 'general', description: 'Alamat kantor' },
        { setting_key: 'company_email', setting_value: 'admin@sifatih.id', setting_group: 'general', description: 'Email perusahaan' },
        { setting_key: 'auth_domain_suffix', setting_value: '@sifatih.id', setting_group: 'auth', description: 'Domain suffix untuk login' },
        { setting_key: 'default_role_code', setting_value: 'CUST', setting_group: 'auth', description: 'Role default untuk user baru' },
        { setting_key: 'maps_default_lat', setting_value: '-7.053', setting_group: 'map', description: 'Latitude pusat peta default' },
        { setting_key: 'maps_default_lng', setting_value: '112.737', setting_group: 'map', description: 'Longitude pusat peta default' },
        { setting_key: 'maps_default_zoom', setting_value: '12', setting_group: 'map', description: 'Zoom level peta default' },
        { setting_key: 'psb_require_ktp', setting_value: 'true', setting_group: 'workflow', description: 'Wajib upload foto KTP saat PSB' },
        { setting_key: 'wo_auto_assign', setting_value: 'false', setting_group: 'workflow', description: 'Auto-assign work order ke teknisi' },
        { setting_key: 'FONNTE_TOKEN', setting_value: '', setting_group: 'whatsapp', description: 'API token from fonnte.com dashboard' },
        { setting_key: 'FONNTE_DAILY_LIMIT', setting_value: '500', setting_group: 'whatsapp', description: 'Max WhatsApp messages allowed per day' },
        { setting_key: 'FONNTE_WARN_THRESHOLD', setting_value: '0.80', setting_group: 'whatsapp', description: 'Fraction of daily limit that triggers warning' },
        { setting_key: 'FONNTE_SENT_TODAY', setting_value: '0', setting_group: 'whatsapp', description: 'Rolling daily message counter' },
        { setting_key: 'FONNTE_LAST_RESET', setting_value: new Date().toISOString(), setting_group: 'whatsapp', description: 'ISO timestamp of last daily counter reset' },
        { setting_key: 'WHATSAPP_ROUTING', setting_value: JSON.stringify({"wo_created":"main","wo_confirmed":"main","wo_open":"main","wo_closed":"main","welcome_installed":"main","payment_due_soon":"main","payment_overdue":"main","direct_admin":"main","_default":"main"}), setting_group: 'whatsapp', description: 'JSON map of message_type to device label' }
    ];
    console.log('Seeding App Settings...');
    const { error } = await supabase.from('app_settings').upsert(data, { onConflict: 'setting_key' });
    if (error) console.error('Error settings:', error.message);
    else console.log('Settings success.');
}

async function seedCustomers(roles) {
    const roleId = roles.find(r => r.code === 'CUST')?.id;
    const data = [
        { name: 'FATMAWATI', customer_code: '25094031501', phone: '82333015005', email: '25094031501@sifatih.id', packet: 'Paket Rumahan 20Mbps', address: 'Mrecah, Bangkalan', install_date: '2025-11-27', mac_address: '08:ED:ED:B1:43:F8', lat: -7.0610, lng: 112.7320, billing_due_day: 10, role_id: roleId },
        { name: 'ISNAWIYAH', customer_code: '25094031601', phone: '85230845589', email: '25094031601@sifatih.id', packet: 'Paket Rumahan 20Mbps', address: 'Mrecah, Bangkalan', install_date: '2025-11-29', mac_address: '48:A9:8A:36:F7:4A', lat: -7.0615, lng: 112.7315, billing_due_day: 10, role_id: roleId },
        { name: 'HASIB', customer_code: '25094031701', phone: '83850126625', email: '25094031701@sifatih.id', packet: 'Paket Rumahan 20Mbps', address: 'Mrecah, Bangkalan', install_date: '2025-11-29', mac_address: '08:ED:ED:B1:43:F9', lat: -7.0620, lng: 112.7310, billing_due_day: 10, role_id: roleId },
        { name: 'BUDI SANTOSO', customer_code: '26030000101', phone: '81111111101', email: '26030000101@sifatih.id', packet: 'Paket Plus 25Mbps', address: 'Jl. Raya Bangkalan No. 1', install_date: '2026-01-10', mac_address: 'AA:BB:CC:DD:EE:01', lat: -7.0530, lng: 112.7380, billing_due_day: 15, role_id: roleId },
        { name: 'SITI RAHAYU', customer_code: '26030000201', phone: '81111111102', email: '26030000201@sifatih.id', packet: 'Paket Prima 35Mbps', address: 'Jl. Raya Bangkalan No. 2', install_date: '2026-01-15', mac_address: 'AA:BB:CC:DD:EE:02', lat: -7.0540, lng: 112.7390, billing_due_day: 15, role_id: roleId },
        { name: 'AHMAD FAUZI', customer_code: '26030000301', phone: '81111111103', email: '26030000301@sifatih.id', packet: 'Paket Hemat 15Mbps', address: 'Jl. Raya Bangkalan No. 3', install_date: '2026-02-01', mac_address: 'AA:BB:CC:DD:EE:03', lat: -7.0550, lng: 112.7400, billing_due_day: 15, role_id: roleId },
        { name: 'DEWI LESTARI', customer_code: '26030000401', phone: '81111111104', email: '26030000401@sifatih.id', packet: 'Paket Unggulan 50Mbps', address: 'Desa Burneh, Bangkalan', install_date: '2026-02-10', mac_address: 'AA:BB:CC:DD:EE:04', lat: -7.0560, lng: 112.7410, billing_due_day: 20, role_id: roleId },
        { name: 'HASAN BASRI', customer_code: '26030000501', phone: '81111111105', email: '26030000501@sifatih.id', packet: 'Paket Rumahan 20Mbps', address: 'Desa Kamal, Bangkalan', install_date: '2026-03-01', mac_address: 'AA:BB:CC:DD:EE:05', lat: -7.0570, lng: 112.7420, billing_due_day: 20, role_id: roleId }
    ];
    console.log('Seeding Customers...');
    const { error } = await supabase.from('customers').upsert(data, { onConflict: 'customer_code' });
    if (error) console.error('Error customers:', error.message);
    else console.log('Customers success.');
}

async function main() {
    const roles = await seedRoles();
    if (!roles) return;

    await seedQueueTypes();
    await seedPackages();
    await seedInventory();
    await seedAppSettings();
    await seedEmployees(roles);
    await seedCustomers(roles);
    console.log('All seeding tasks finished.');
}

main();
