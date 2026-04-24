/**
 * Finance Service — Business Logic Layer
 * Handles financial transactions and ledger reporting.
 */
import * as financeRepo from '../repositories/finance.repository.js';
import { ok, badRequest, serverError } from '../utils/http-mapper.js';

export async function listTransactions(dbClient, { limit = 50, offset = 0, search = '' } = {}) {
  const { data, error, count } = await financeRepo.findAllTransactions(dbClient, { limit, offset, search });
  if (error) return serverError(`Database error: ${error.message}`);
  return ok({ data, count, limit, offset });
}

export async function createTransaction(dbClient, body, userId) {
  if (!body.amount || !body.transaction_type || !body.description) {
    return badRequest('amount, transaction_type, and description are required');
  }

  const payload = {
    transaction_date: body.transaction_date || new Date().toISOString(),
    transaction_type: body.transaction_type, // 'income' or 'expense'
    category: body.category || 'other',
    amount: body.amount,
    description: body.description,
    reference_no: body.reference_no || null,
    bank_account_id: body.bank_account_id || null,
    created_by: userId
  };

  const { data, error } = await financeRepo.createTransaction(dbClient, payload);
  if (error) return serverError(`Database error: ${error.message}`);
  return ok(data);
}

export async function getFinancialSummary(dbClient, { month, year } = {}) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data, error } = await financeRepo.findSummary(dbClient, { startDate, endDate });
  if (error) return serverError(`Database error: ${error.message}`);

  const summary = {
    total_income: 0,
    total_expense: 0,
    income_by_category: {},
    expense_by_category: {}
  };

  data.forEach(tx => {
    const amt = parseFloat(tx.amount);
    if (tx.transaction_type === 'income') {
      summary.total_income += amt;
      const cat = tx.category || 'other';
      summary.income_by_category[cat] = (summary.income_by_category[cat] || 0) + amt;
    } else {
      summary.total_expense += amt;
      const cat = tx.category || 'other';
      summary.expense_by_category[cat] = (summary.expense_by_category[cat] || 0) + amt;
    }
  });

  return ok(summary);
}

export async function getDailyRecap(dbClient, date) {
  const { data, error } = await financeRepo.findDailyRecap(dbClient, date);
  if (error) return serverError(`Database error: ${error.message}`);

  const recap = {};
  data.forEach(tx => {
    const bankName = tx.bank_name || 'Lainnya';
    if (!recap[bankName]) recap[bankName] = { income: 0, expense: 0 };
    if (tx.type === 'income') recap[bankName].income += parseFloat(tx.amount);
    else recap[bankName].expense += parseFloat(tx.amount);
  });

  return ok({ date, recap });
}

