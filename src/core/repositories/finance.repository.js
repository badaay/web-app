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

export async function findDailyRecap(dbClient, date) {
  return dbClient
    .from('v_financial_recap')
    .select('amount, type, bank_account_id, bank_name')
    .eq('transaction_date', date);
}

// ── Payroll Rekap Queries (Story 2.4) ─────────────────────────────────────

export async function findAllPayrollPeriods(dbClient, { limit = 24, offset = 0 } = {}) {
  return dbClient
    .from('payroll_periods')
    .select('id, year, month, period_start, period_end, status, calculated_at', { count: 'exact' })
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .range(offset, offset + limit - 1);
}

export async function findPayrollPeriodById(dbClient, periodId) {
  return dbClient
    .from('payroll_periods')
    .select('*')
    .eq('id', periodId)
    .single();
}

export async function findPayrollSummariesForPeriod(dbClient, periodId, { limit = 100, offset = 0 } = {}) {
  return dbClient
    .from('v_payroll_summaries')
    .select('*', { count: 'exact' })
    .eq('payroll_period_id', periodId)
    .order('employee_name', { ascending: true })
    .range(offset, offset + limit - 1);
}

export async function markPeriodAsPaid(dbClient, periodId, userId) {
  return dbClient
    .from('payroll_periods')
    .update({
      status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('id', periodId);
}

