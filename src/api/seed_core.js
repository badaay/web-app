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

async function seedTable(tableName, data, conflictColumn = 'id') {
  console.log(`Seeding ${tableName}...`);
  const { error } = await supabase.from(tableName).upsert(data, { onConflict: conflictColumn });
  if (error) {
    console.error(`Error seeding ${tableName}:`, error.message);
    return false;
  }
  console.log(`${tableName} success.`);
  return true;
}

async function main() {
  // // 1. ROLES
  // const roles = [
  //   { name: 'Superadmin', code: 'S_ADM', description: 'Full system-level access' },
  //   { name: 'Owner', code: 'OWNER', description: 'Business owner' },
  //   { name: 'Admin', code: 'ADM', description: 'Day-to-day operations admin' },
  //   { name: 'Bendahara', code: 'TREASURER', description: 'Finance monitoring' },
  //   { name: 'SPV Teknisi', code: 'SPV_TECH', description: 'Supervisor' },
  //   { name: 'Teknisi', code: 'TECH', description: 'Field technician' },
  //   { name: 'Customer', code: 'CUST', description: 'Customer portal' }
  // ];
  // await seedTable('roles', roles, 'code');

  // const { data: roleData } = await supabase.from('roles').select('id, code');
  // const getRoleId = (code) => roleData.find(r => r.code === code)?.id;

  // // 2. QUEUE TYPES
  // const queueTypes = [
  //   { name: 'PSB', base_point: 100, color: '#22c55e', icon: 'bi-house-add-fill' },
  //   { name: 'Repair', base_point: 50, color: '#ef4444', icon: 'bi-tools' },
  //   { name: 'Relocation', base_point: 75, color: '#f59e0b', icon: 'bi-arrow-left-right' },
  //   { name: 'Upgrade', base_point: 50, color: '#3b82f6', icon: 'bi-arrow-up-circle-fill' },
  //   { name: 'Cancel', base_point: 0, color: '#6b7280', icon: 'bi-x-circle-fill' }
  // ];
  // await seedTable('master_queue_types', queueTypes, 'name');

  // // 3. PACKAGES
  // const packages = [
  //   { name: 'Paket Hemat 15Mbps', price: 166000, speed: '15Mbps', description: 'Paket entry level' },
  //   { name: 'Paket Rumahan 20Mbps', price: 175000, speed: '20Mbps', description: 'Paket standar' },
  //   { name: 'Paket Plus 25Mbps', price: 200000, speed: '25Mbps', description: 'Paket menengah' },
  //   { name: 'Paket Prima 35Mbps', price: 250000, speed: '35Mbps', description: 'Paket kerja dari rumah' },
  //   { name: 'Paket Unggulan 50Mbps', price: 350000, speed: '50Mbps', description: 'Paket premium' }
  // ];
  // await seedTable('internet_packages', packages, 'name');

  // // 4. INVENTORY
  // const inventory = [
  //   { name: 'Kabel FO Drop 1 Core', stock: 2000, unit: 'Meter', category: 'Kabel' },
  //   { name: 'Modem ONT ZTE F601', stock: 50, unit: 'Unit', category: 'Perangkat' },
  //   { name: 'Splitter 1:8', stock: 40, unit: 'Buah', category: 'Aksesoris' }
  // ];
  // await seedTable('inventory_items', inventory, 'name');

  // 5. APP SETTINGS
  const settings = [
    {
        "id": "3cb51739-30a5-482f-ad1e-be502a20c0d4",
        "setting_key": "auth_domain_suffix",
        "setting_value": "@sifatih.id",
        "setting_group": "auth",
        "description": "Domain suffix untuk login shortcode",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "a0f356e5-1322-4750-9d3c-27c3376e6913",
        "setting_key": "company_address",
        "setting_value": "Bangkalan, Madura",
        "setting_group": "general",
        "description": "Alamat kantor",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "5280514d-923c-4b55-abdd-4eceac6651e5",
        "setting_key": "company_email",
        "setting_value": "admin@sifatih.id",
        "setting_group": "general",
        "description": "Email perusahaan",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "bb562295-e484-458f-848c-0c7498c67c53",
        "setting_key": "company_name",
        "setting_value": "SiFatih Net",
        "setting_group": "general",
        "description": "Nama perusahaan",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "f97ab036-b9c9-4e8a-8e7f-a88513203400",
        "setting_key": "company_phone",
        "setting_value": "081234567890",
        "setting_group": "general",
        "description": "Nomor telepon kantor",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "99ba0598-596f-4f0f-9d46-47537c0a2d5c",
        "setting_key": "default_role_code",
        "setting_value": "CUST",
        "setting_group": "auth",
        "description": "Role default untuk user baru",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "41a65b20-7237-40fd-8c5a-54bb725e16fa",
        "setting_key": "FONNTE_DAILY_LIMIT",
        "setting_value": "500",
        "setting_group": "whatsapp",
        "description": "Max WhatsApp messages allowed per day",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "7d968cc5-a2c3-409a-a5c1-0f8fc3169ce7",
        "setting_key": "FONNTE_LAST_RESET",
        "setting_value": "2026-04-04 18:22:45.849424+00",
        "setting_group": "whatsapp",
        "description": "ISO timestamp of last daily counter reset",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "e526657b-6f1e-4b17-b9a6-e14ea38a21a8",
        "setting_key": "FONNTE_SENT_TODAY",
        "setting_value": "0",
        "setting_group": "whatsapp",
        "description": "Rolling daily message counter, reset each day",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "2c2f345b-4d45-449c-a367-a4d078aab62e",
        "setting_key": "FONNTE_TOKEN",
        "setting_value": "ym2qun7QSnJ7a1nEYRQF",
        "setting_group": "whatsapp",
        "description": "API token from fonnte.com dashboard",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "35c2249f-e9b2-4efb-a4b8-0203890f23b4",
        "setting_key": "FONNTE_WARN_THRESHOLD",
        "setting_value": "0.80",
        "setting_group": "whatsapp",
        "description": "Fraction of daily limit that triggers admin warning",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "743430c0-0738-420b-8fab-42716ceea081",
        "setting_key": "maps_default_lat",
        "setting_value": "-7.053",
        "setting_group": "map",
        "description": "Latitude pusat peta default",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "bf34b76b-03b9-431a-add6-db98dfa581a0",
        "setting_key": "maps_default_lng",
        "setting_value": "112.737",
        "setting_group": "map",
        "description": "Longitude pusat peta default",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "ff65f1ac-8b25-43a6-a572-91d69e90855d",
        "setting_key": "maps_default_zoom",
        "setting_value": "12",
        "setting_group": "map",
        "description": "Zoom level peta default",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "2abd8aac-fe71-452c-9f08-651d1d37c698",
        "setting_key": "psb_require_ktp",
        "setting_value": "true",
        "setting_group": "workflow",
        "description": "Wajib upload foto KTP saat PSB",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "ee31c060-20f5-4be1-a8bf-94df11da650b",
        "setting_key": "WHATSAPP_ROUTING",
        "setting_value": "{\"wo_created\":\"main\",\"wo_confirmed\":\"main\",\"wo_open\":\"main\",\"wo_closed\":\"main\",\"welcome_installed\":\"main\",\"payment_due_soon\":\"main\",\"payment_overdue\":\"main\",\"direct_admin\":\"main\",\"_default\":\"main\"}",
        "setting_group": "whatsapp",
        "description": "JSON map of message_type to device label",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    },
    {
        "id": "ae862dea-dd3e-4b85-9dbd-1b2ff664cc09",
        "setting_key": "wo_auto_assign",
        "setting_value": "false",
        "setting_group": "workflow",
        "description": "Auto-assign work order ke teknisi tersedia",
        "updated_at": "2026-04-04T18:22:45.849424+00:00"
    }
  ];
  await seedTable('app_settings', settings, 'setting_key');

  // // 6. EMPLOYEES
  // const employees = [
  //   { name: 'Muhammad Rifqi Arifandi', employee_id: '202101001', email: '202101001@sifatih.id', position: 'Owner', status: 'Non-Aktif', role_id: getRoleId('OWNER') },
  //   { name: 'Fungki Gunawan', employee_id: '202408003', email: '202408003@sifatih.id', position: 'SPV Teknisi', status: 'Aktif', role_id: getRoleId('SPV_TECH') },
  //   { name: 'Ali Wafa', employee_id: '202512008', email: '202512008@sifatih.id', position: 'Teknisi', status: 'Aktif', role_id: getRoleId('TECH') },
  //   { name: 'Abdul Wahid Hasyim', employee_id: '202602009', email: '202602009@sifatih.id', position: 'Teknisi', status: 'Aktif', role_id: getRoleId('TECH') }
  // ];
  // await seedTable('employees', employees, 'employee_id');

  // // 7. CUSTOMERS
  // const customers = [
  //   { name: 'FATMAWATI', customer_code: '25094031501', phone: '82333015005', email: '25094031501@sifatih.id', address: 'Mrecah, Bangkalan', role_id: getRoleId('CUST') },
  //   { name: 'BUDI SANTOSO', customer_code: '26030000101', phone: '81111111101', email: '26030000101@sifatih.id', address: 'Jl. Raya Bangkalan No. 1', role_id: getRoleId('CUST') }
  // ];
  // await seedTable('customers', customers, 'customer_code');

  // // 8. WORK ORDERS
  // const { data: custData } = await supabase.from('customers').select('id, name');
  // const { data: empData } = await supabase.from('employees').select('id, name');
  // const { data: typeData } = await supabase.from('master_queue_types').select('id, name');

  // const getCustId = (name) => custData.find(c => c.name === name)?.id;
  // const getEmpId = (name) => empData.find(e => e.name === name)?.id;
  // const getTypeId = (name) => typeData.find(t => t.name === name)?.id;

  // const workOrders = [
  //   { customer_id: getCustId('FATMAWATI'), employee_id: getEmpId('Ali Wafa'), type_id: getTypeId('PSB'), title: 'PSB - FATMAWATI', status: 'confirmed' },
  //   { customer_id: getCustId('BUDI SANTOSO'), employee_id: getEmpId('Abdul Wahid Hasyim'), type_id: getTypeId('PSB'), title: 'PSB - BUDI SANTOSO', status: 'waiting' }
  // ];
  
  // console.log('Seeding work_orders (Insert)...');
  // const { data: insertedWas, error: woError } = await supabase.from('work_orders').insert(workOrders).select();
  // if (woError) {
  //   console.error('Error seeding work_orders:', woError.message);
  // } else {
  //   console.log('work_orders success.');
    
  //   // 9. WORK ORDER ASSIGNMENTS
  //   const assignments = [
  //     { 
  //       work_order_id: insertedWas.find(w => w.title === 'PSB - FATMAWATI')?.id, 
  //       employee_id: getEmpId('Ali Wafa'), 
  //       assignment_role: 'lead' 
  //     },
  //     { 
  //       work_order_id: insertedWas.find(w => w.title === 'PSB - BUDI SANTOSO')?.id, 
  //       employee_id: getEmpId('Abdul Wahid Hasyim'), 
  //       assignment_role: 'lead' 
  //     }
  //   ].filter(a => a.work_order_id && a.employee_id);

  //   if (assignments.length > 0) {
  //     console.log('Seeding work_order_assignments (Insert)...');
  //     const { error: asError } = await supabase.from('work_order_assignments').insert(assignments);
  //     if (asError) console.error('Error seeding assignments:', asError.message);
  //     else console.log('work_order_assignments success.');
  //   }
  // }

  console.log('Project A Seeding Completed.');
}

main().catch(console.error);
