const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const urlA = process.env.SUPABASE_URL_A;
const keyA = process.env.SUPABASE_SERVICE_ROLE_KEY_A;

const supabaseA = createClient(urlA, keyA);

async function debugAssignments() {
  const { data: wo } = await supabaseA
    .from('work_orders')
    .select('id, title, status')
    .eq('title', 'PSB - BUDI SANTOSO')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!wo) {
    console.log('Work Order not found.');
    return;
  }
  console.log('Found Work Order:', wo);

  const { data: assignments } = await supabaseA
    .from('work_order_assignments')
    .select('*')
    .eq('work_order_id', wo.id);

  console.log('Assignments:', assignments);
}

debugAssignments();
