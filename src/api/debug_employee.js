const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const urlA = process.env.SUPABASE_URL_A;
const keyA = process.env.SUPABASE_SERVICE_ROLE_KEY_A; // Using Service Role (Admin)

const supabaseA = createClient(urlA, keyA);

async function debugEmployee(targetId) {
  console.log(`--- Debugging Employee Lookup for ID: [${targetId}] ---`);

  // 1. Test basic connectivity & table existence
  const { data: countData, error: countErr } = await supabaseA
    .from('employees')
    .select('id', { count: 'exact', head: true });

  if (countErr) {
    console.error('❌ Table Access Error:', countErr.message);
    return;
  }
  console.log('✅ Table "employees" is accessible.');

  // 2. Run the specific query with .eq()
  console.log('Running .eq() query...');
  const { data: techEq, error: errEq } = await supabaseA
    .from('employees')
    .select('name, employee_id, id')
    .eq('employee_id', targetId.trim())
    .maybeSingle();

  if (errEq) console.error('❌ .eq() Error:', errEq.message);
  else console.log('.eq() Result:', techEq);

  // 3. Run with .ilike() (Case-Insensitive)
  console.log('Running .ilike() query...');
  const { data: techIlike, error: errIlike } = await supabaseA
    .from('employees')
    .select('name, employee_id, id')
    .ilike('employee_id', targetId.trim())
    .maybeSingle();

  if (errIlike) console.error('❌ .ilike() Error:', errIlike.message);
  else console.log('.ilike() Result:', techIlike);

  // 4. Sanity Check: List first 3 employees to see ID formatting
  console.log('Sample data in DB (First 3):');
  const { data: samples } = await supabaseA
    .from('employees')
    .select('employee_id')
    .limit(3);
  
  console.log(samples ? samples.map(s => `${s.employee_id}`) : 'No rows found');
}

// Replace 'YOUR_ID_HERE' with the actual ID you are testing
const idToTest = '202512008'; 
debugEmployee(idToTest);