const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const urlA = process.env.SUPABASE_URL_A;
const keyA = process.env.SUPABASE_SERVICE_ROLE_KEY_A;

const supabaseA = createClient(urlA, keyA);

async function checkFDW() {
  console.log('--- Checking FDW Foreign Tables Metadata ---');
  
  // Use a query that checks the information_schema for foreign tables
  const { data, error } = await supabaseA
    .rpc('get_foreign_tables_status'); // I might need to create this RPC

  if (error) {
    console.log('RPC get_foreign_tables_status not found. Creating a temporary check via anonymous block...');
    
    // I can't run anonymous blocks via supabase-js unless I have an RPC.
    // I will try to query information_schema.foreign_tables
    const { data: ft, error: fte } = await supabaseA
        .from('information_schema.foreign_tables')
        .select('*');
    
    console.log('Foreign Tables in catalog:', ft);
    if (fte) console.error('Error fetching foreign tables:', fte.message);
  }
}

checkFDW();
