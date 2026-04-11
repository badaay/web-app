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

async function testTrigger() {
  console.log('--- Testing Cross-Project Point Trigger ---');

  // 1. Check current points in Project B
  console.log('Current points in Project B:');
  const { data: beforePoints } = await supabaseB.from('technician_points_ledger').select('count');
  console.log('Count:', beforePoints?.[0]?.count || 0);

  // 2. Find a "waiting" Work Order in A
  console.log('Finding a "waiting" Work Order in Project A...');
  const { data: wo, error: woError } = await supabaseA
    .from('work_orders')
    .select('id, title, status')
    .eq('status', 'waiting')
    .limit(1)
    .single();

  if (woError || !wo) {
    console.error('No "waiting" Work Order found. Ensure seed:core was run.');
    return;
  }
  console.log(`Found: ${wo.title} (${wo.id})`);

  // 3. Close the Work Order
  console.log('Closing Work Order in Project A...');
  const { error: updateError } = await supabaseA
    .from('work_orders')
    .update({ status: 'closed' })
    .eq('id', wo.id);

  if (updateError) {
    console.error('Failed to close Work Order:', updateError.message);
    return;
  }
  console.log('Success! Work Order is now closed.');

  // 4. Wait for trigger
  console.log('Waiting 3 seconds for cross-project sync...');
  await new Promise(r => setTimeout(r, 3000));

  // 5. Check points in Project B again
  console.log('Checking points in Project B after trigger...');
  const { data: afterPoints } = await supabaseB
    .from('technician_points_ledger')
    .select('*')
    .eq('work_order_id', wo.id);

  if (afterPoints && afterPoints.length > 0) {
    console.log('✅ Success! Points found in Project B:', afterPoints);
  } else {
    console.error('❌ Trigger Failed: No points record found in Project B for this Work Order.');
    console.log('Check Project A database logs for "trg_award_points_to_vault" execution errors.');
  }
}

testTrigger();
