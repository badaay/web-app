/**
 * Finance Repository — Data Access Layer
 * Handles queries for financial_transactions and ledger tables.
 */

export async function findAllTransactions(dbClient, { limit = 50, offset = 0, search = '' } = {}) {
  let query = dbClient
    .from('financial_transactions')
    .select('*', { count: 'exact' })
    .order('transaction_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`description.ilike.%${search}%,reference_no.ilike.%${search}%`);
  }

  return query;
}

export async function createTransaction(dbClient, payload) {
  return dbClient
    .from('financial_transactions')
    .insert(payload)
    .select()
    .single();
}

export async function findSummary(dbClient, { startDate, endDate } = {}) {
  let query = dbClient
    .from('financial_transactions')
    .select('transaction_type, amount');

  if (startDate) query = query.gte('transaction_date', startDate);
  if (endDate) query = query.lte('transaction_date', endDate);

  return query;
}

export async function findBankAccounts(dbClient) {
  return dbClient
    .from('bank_accounts')
    .select('*')
    .order('account_name');
}
