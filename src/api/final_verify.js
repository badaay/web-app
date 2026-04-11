const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const urlA = process.env.SUPABASE_URL_A;
const keyA = process.env.SUPABASE_SERVICE_ROLE_KEY_A;
const urlB = process.env.SUPABASE_URL_B;
const keyB = process.env.SUPABASE_SERVICE_ROLE_KEY_B;

const supabaseA = createClient(urlA, keyA);
const supabaseB = createClient(urlB, keyB);

async function finalVerification() {
  console.log('--- Final OLA Verification (Project A -> B) ---');

  // 1. Get a Technician from A
  const { data: emp } = await supabaseA.from('employees').select('id, name').limit(1).single();
  const { data: type } = await supabaseA.from('master_queue_types').select('id, name').eq('name', 'PSB').single();
  const { data: cust } = await supabaseA.from('customers').select('id, name').limit(1).single();

  if (!emp || !type || !cust) {
    console.error('Core data missing. Run seed:core first.');
    return;
  }

  // 2. Create a FRESH Work Order and Assignment
  const testTitle = 'VERIFY-TICKET-' + Date.now();
  console.log(`Creating test Work Order: ${testTitle}`);
  
  const { data: wo, error: woErr } = await supabaseA.from('work_orders').insert({
    customer_id: cust.id,
    type_id: type.id,
    title: testTitle,
    status: 'waiting'
  }).select().single();

  if (woErr) {
    console.error('Failed to create WO:', woErr.message);
    return;
  }

  console.log('Adding Assignment for', emp.name);
  await supabaseA.from('work_order_assignments').insert({
    work_order_id: wo.id,
    employee_id: emp.id,
    assignment_role: 'lead'
  });

  // 3. Trigger the Logic
  console.log('Status: waiting -> closed...');
  const { error: closeErr } = await supabaseA.from('work_orders')
    .update({ status: 'closed' })
    .eq('id', wo.id);

  if (closeErr) {
    console.error('Close failed:', closeErr.message);
    return;
  }

  // 4. Verification in Project B
  console.log('Verifying result in Project B (Vault)...');
  await new Promise(r => setTimeout(r, 2000)); // Allow time for trigger

  const { data: pointRecord, error: pErr } = await supabaseB
    .from('technician_points_ledger')
    .select('*')
    .eq('work_order_id', wo.id)
    .single();

  if (pointRecord) {
    console.log('✅ TRG_AWARD_POINTS: SUCCESS!');
    console.log('Awarded:', pointRecord.points, 'points to', emp.name);
    console.log('Description:', pointRecord.description);
  } else {
    console.error('❌ TRG_AWARD_POINTS: FAILED. No record in Vault.');
    if (pErr) console.error('B-Query Error:', pErr.message);
  }
}

finalVerification();
