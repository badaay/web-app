const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const urlA = process.env.SUPABASE_URL_A;
const keyA = process.env.SUPABASE_SERVICE_ROLE_KEY_A;
const urlB = process.env.SUPABASE_URL_B;
const keyB = process.env.SUPABASE_SERVICE_ROLE_KEY_B;

if (!urlA || !keyA || !urlB || !keyB) {
  console.error('Error: Project A and B URLs and Service Role Keys must be set in .env');
  process.exit(1);
}

const supabaseA = createClient(urlA, keyA);
const supabaseB = createClient(urlB, keyB);

async function seedTable(tableName, data, conflictColumn = 'id') {
  console.log(`Seeding Vault Table: ${tableName}...`);
  const { error } = await supabaseB.from(tableName).upsert(data, { onConflict: conflictColumn });
  if (error) {
    console.error(`Error seeding ${tableName}:`, error.message);
    return false;
  }
  console.log(`${tableName} success.`);
  return true;
}

async function main() {
  console.log('Fetching IDs from Project A...');
  const { data: employees } = await supabaseA.from('employees').select('id, name');
  const { data: customers } = await supabaseA.from('customers').select('id, name');
  const { data: workOrders } = await supabaseA.from('work_orders').select('id, title');

  if (!employees || !customers || !workOrders) {
    console.error('Error fetching data from Project A. Ensure Project A is seeded first.');
    return;
  }

  const getEmpId = (name) => employees.find(e => e.name === name)?.id;
  const getCustId = (name) => customers.find(c => c.name === name)?.id;
  const getWoId = (title) => workOrders.find(w => w.title === title)?.id;

  // 1. NOTIFICATION QUEUE (Insert)
  const notifications = [
    { recipient: '82333015005', message_type: 'welcome_installed', payload: { name: 'FATMAWATI' }, status: 'sent', sent_at: new Date().toISOString() },
    { recipient: '81111111101', message_type: 'wo_created', payload: { name: 'BUDI SANTOSO' }, status: 'pending' }
  ];
  console.log('Seeding notification_queue (Insert)...');
  const { error: notifError } = await supabaseB.from('notification_queue').insert(notifications);
  if (notifError) console.error('Error seeding notifications:', notifError.message);

  // 2. TECHNICIAN POINTS LEDGER (Insert)
  const points = [];
  if (getEmpId('Ali Wafa') && getWoId('PSB - FATMAWATI')) {
    points.push({
      employee_id: getEmpId('Ali Wafa'),
      work_order_id: getWoId('PSB - FATMAWATI'),
      points: 100,
      description: 'PSB FATMAWATI Installation'
    });
  }
  if (points.length > 0) {
    console.log('Seeding points_ledger (Insert)...');
    const { error: pError } = await supabaseB.from('technician_points_ledger').insert(points);
    if (pError) console.error('Error seeding points:', pError.message);
  }

  // 3. CUSTOMER BILLS (Upsert with composite key)
  const bills = [];
  if (getCustId('FATMAWATI')) {
    bills.push({
      customer_id: getCustId('FATMAWATI'),
      period_date: '2026-04-01',
      amount: 175000,
      status: 'unpaid'
    });
  }
  if (bills.length > 0) {
    await seedTable('customer_bills', bills, 'customer_id,period_date');
  }

  // 4. FINANCIAL TRANSACTIONS (Insert)
  const finances = [
    { description: 'Voucher Internet March', type: 'income', category: 'Internet', amount: 5000000 },
    { description: 'Office Rent March', type: 'expense', category: 'Rent', amount: 1200000 }
  ];
  console.log('Seeding finances (Insert)...');
  const { error: fError } = await supabaseB.from('financial_transactions').insert(finances);
  if (fError) console.error('Error seeding finances:', fError.message);

  console.log('Project B Seeding Completed.');
}

main().catch(console.error);
