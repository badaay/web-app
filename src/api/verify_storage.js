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

async function verifyStorage() {
  console.log('--- Verifying Storage Buckets ---');

  console.log('Project A Buckets:');
  const { data: bucketsA, error: errA } = await supabaseA.storage.listBuckets();
  if (errA) console.error('Error A:', errA.message);
  else console.log(bucketsA.map(b => b.name));

  console.log('Project B Buckets:');
  const { data: bucketsB, error: errB } = await supabaseB.storage.listBuckets();
  if (errB) console.error('Error B:', errB.message);
  else console.log(bucketsB.map(b => b.name));
}

verifyStorage();
