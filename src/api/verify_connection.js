const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const urlA = process.env.SUPABASE_URL_A;
const keyA = process.env.SUPABASE_SERVICE_ROLE_KEY_A;

if (!urlA || !keyA) {
  console.error('Error: Project A URL and Service Role Key must be set in .env');
  process.exit(1);
}

// Create client with remote_vault as the primary schema for this test
const supabaseA = createClient(urlA, keyA, {
  db: { schema: 'remote_vault' }
});

async function verifyConnection() {
  console.log('Testing FDW Connection (Project A -> Project B) via schema "remote_vault"...');
  
  // Directly query the table name now that schema is set in the client
  const { data, error } = await supabaseA
    .from('notification_queue')
    .select('id')
    .limit(1);

  if (error) {
    console.error('FDW Connection Failed:', error.message);
    console.log('Suggestion: Run "SELECT * FROM remote_vault.notification_queue" in Supabase SQL Editor to verify.');
  } else {
    console.log('✅ FDW Connection Successful! Project A can read from Project B.');
    console.log('Found record:', data);
  }
}

verifyConnection();
