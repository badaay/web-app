/**
 * seed_vault.js — Vault / Project B Seeder
 * ============================================================
 * Seeds the Financial Vault / Project B with data linked to Project A.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Main Project (A)
const urlMain = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const keyMain = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vault Project (B)
const urlVault = process.env.SUPABASE_VAULT_URL || urlMain; // Default to same if not set
const keyVault = process.env.SUPABASE_VAULT_SERVICE_ROLE_KEY || keyMain;

if (!urlMain || !keyMain) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabaseMain = createClient(urlMain, keyMain);
const supabaseVault = createClient(urlVault, keyVault);

async function main() {
  console.log('--- VAULT SEEDING START ---');
  
  console.log('Fetching references from Main Project...');
  const { data: employees } = await supabaseMain.from('employees').select('id, name, employee_id');
  const { data: customers } = await supabaseMain.from('customers').select('id, name, customer_code');

  if (!employees || !customers) {
    console.error('❌ Failed to fetch reference data. Ensure Main Project is seeded.');
    return;
  }

  // 1. Seed Financial Transactions (Vault)
  const finances = [
    { description: 'Voucher Internet March', type: 'income', category: 'Internet', amount: 5000000, transaction_date: new Date().toISOString() },
    { description: 'Office Rent March', type: 'expense', category: 'Rent', amount: 1200000, transaction_date: new Date().toISOString() }
  ];
  
  console.log('Seeding Vault: Financial Transactions...');
  const { error: fError } = await supabaseVault.from('financial_transactions').insert(finances);
  if (fError) console.error('  ❌ Error finance:', fError.message);
  else console.log('  ✅ Finance transactions seeded.');

  // 2. Seed Customer Bills
  const fatma = customers.find(c => c.name === 'FATMAWATI');
  if (fatma) {
    const bills = [
      { customer_id: fatma.id, period_date: '2026-04-01', amount: 175000, status: 'unpaid' }
    ];
    console.log('Seeding Vault: Customer Bills...');
    const { error: bError } = await supabaseVault.from('customer_bills').upsert(bills, { onConflict: 'customer_id,period_date' });
    if (bError) console.error('  ❌ Error bills:', bError.message);
    else console.log('  ✅ Bills seeded.');
  }

  console.log('--- VAULT SEEDING COMPLETE ---');
}

if (require.main === module) {
    main();
}

module.exports = { main };
