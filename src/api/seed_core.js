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
  // 1. ROLES
  const roles = [
    { name: 'Superadmin', code: 'S_ADM', description: 'Full system-level access' },
    { name: 'Owner', code: 'OWNER', description: 'Business owner' },
    { name: 'Admin', code: 'ADM', description: 'Day-to-day operations admin' },
    { name: 'Bendahara', code: 'TREASURER', description: 'Finance monitoring' },
    { name: 'SPV Teknisi', code: 'SPV_TECH', description: 'Supervisor' },
    { name: 'Teknisi', code: 'TECH', description: 'Field technician' },
    { name: 'Customer', code: 'CUST', description: 'Customer portal' }
  ];
  await seedTable('roles', roles, 'code');

  const { data: roleData } = await supabase.from('roles').select('id, code');
  const getRoleId = (code) => roleData.find(r => r.code === code)?.id;

  // 2. QUEUE TYPES
  const queueTypes = [
    { name: 'PSB', base_point: 100, color: '#22c55e', icon: 'bi-house-add-fill' },
    { name: 'Repair', base_point: 50, color: '#ef4444', icon: 'bi-tools' },
    { name: 'Relocation', base_point: 75, color: '#f59e0b', icon: 'bi-arrow-left-right' },
    { name: 'Upgrade', base_point: 50, color: '#3b82f6', icon: 'bi-arrow-up-circle-fill' },
    { name: 'Cancel', base_point: 0, color: '#6b7280', icon: 'bi-x-circle-fill' }
  ];
  await seedTable('master_queue_types', queueTypes, 'name');

  // 3. PACKAGES
  const packages = [
    { name: 'Paket Hemat 15Mbps', price: 166000, speed: '15Mbps', description: 'Paket entry level' },
    { name: 'Paket Rumahan 20Mbps', price: 175000, speed: '20Mbps', description: 'Paket standar' },
    { name: 'Paket Plus 25Mbps', price: 200000, speed: '25Mbps', description: 'Paket menengah' },
    { name: 'Paket Prima 35Mbps', price: 250000, speed: '35Mbps', description: 'Paket kerja dari rumah' },
    { name: 'Paket Unggulan 50Mbps', price: 350000, speed: '50Mbps', description: 'Paket premium' }
  ];
  await seedTable('internet_packages', packages, 'name');

  // 4. INVENTORY
  const inventory = [
    { name: 'Kabel FO Drop 1 Core', stock: 2000, unit: 'Meter', category: 'Kabel' },
    { name: 'Modem ONT ZTE F601', stock: 50, unit: 'Unit', category: 'Perangkat' },
    { name: 'Splitter 1:8', stock: 40, unit: 'Buah', category: 'Aksesoris' }
  ];
  await seedTable('inventory_items', inventory, 'name');

  // 5. APP SETTINGS
  const settings = [
    { setting_key: 'company_name', setting_value: 'SiFatih Net', setting_group: 'general' },
    { setting_key: 'company_phone', setting_value: '081234567890', setting_group: 'general' }
  ];
  await seedTable('app_settings', settings, 'setting_key');

  // 6. EMPLOYEES
  const employees = [
    { name: 'Muhammad Rifqi Arifandi', employee_id: '202101001', email: '202101001@sifatih.id', position: 'Owner', status: 'Non-Aktif', role_id: getRoleId('OWNER') },
    { name: 'Fungki Gunawan', employee_id: '202408003', email: '202408003@sifatih.id', position: 'SPV Teknisi', status: 'Aktif', role_id: getRoleId('SPV_TECH') },
    { name: 'Ali Wafa', employee_id: '202512008', email: '202512008@sifatih.id', position: 'Teknisi', status: 'Aktif', role_id: getRoleId('TECH') },
    { name: 'Abdul Wahid Hasyim', employee_id: '202602009', email: '202602009@sifatih.id', position: 'Teknisi', status: 'Aktif', role_id: getRoleId('TECH') }
  ];
  await seedTable('employees', employees, 'employee_id');

  // 7. CUSTOMERS
  const customers = [
    { name: 'FATMAWATI', customer_code: '25094031501', phone: '82333015005', email: '25094031501@sifatih.id', address: 'Mrecah, Bangkalan', role_id: getRoleId('CUST') },
    { name: 'BUDI SANTOSO', customer_code: '26030000101', phone: '81111111101', email: '26030000101@sifatih.id', address: 'Jl. Raya Bangkalan No. 1', role_id: getRoleId('CUST') }
  ];
  await seedTable('customers', customers, 'customer_code');

  // 8. WORK ORDERS
  const { data: custData } = await supabase.from('customers').select('id, name');
  const { data: empData } = await supabase.from('employees').select('id, name');
  const { data: typeData } = await supabase.from('master_queue_types').select('id, name');

  const getCustId = (name) => custData.find(c => c.name === name)?.id;
  const getEmpId = (name) => empData.find(e => e.name === name)?.id;
  const getTypeId = (name) => typeData.find(t => t.name === name)?.id;

  const workOrders = [
    { customer_id: getCustId('FATMAWATI'), employee_id: getEmpId('Ali Wafa'), type_id: getTypeId('PSB'), title: 'PSB - FATMAWATI', status: 'confirmed' },
    { customer_id: getCustId('BUDI SANTOSO'), employee_id: getEmpId('Abdul Wahid Hasyim'), type_id: getTypeId('PSB'), title: 'PSB - BUDI SANTOSO', status: 'waiting' }
  ];
  
  console.log('Seeding work_orders (Insert)...');
  const { data: insertedWas, error: woError } = await supabase.from('work_orders').insert(workOrders).select();
  if (woError) {
    console.error('Error seeding work_orders:', woError.message);
  } else {
    console.log('work_orders success.');
    
    // 9. WORK ORDER ASSIGNMENTS
    const assignments = [
      { 
        work_order_id: insertedWas.find(w => w.title === 'PSB - FATMAWATI')?.id, 
        employee_id: getEmpId('Ali Wafa'), 
        assignment_role: 'lead' 
      },
      { 
        work_order_id: insertedWas.find(w => w.title === 'PSB - BUDI SANTOSO')?.id, 
        employee_id: getEmpId('Abdul Wahid Hasyim'), 
        assignment_role: 'lead' 
      }
    ].filter(a => a.work_order_id && a.employee_id);

    if (assignments.length > 0) {
      console.log('Seeding work_order_assignments (Insert)...');
      const { error: asError } = await supabase.from('work_order_assignments').insert(assignments);
      if (asError) console.error('Error seeding assignments:', asError.message);
      else console.log('work_order_assignments success.');
    }
  }

  console.log('Project A Seeding Completed.');
}

main().catch(console.error);
