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

export async function getFinancialSummary(dbClient, { startDate, endDate } = {}) {
  const { data, error } = await financeRepo.findSummary(dbClient, { startDate, endDate });
  if (error) return serverError(`Database error: ${error.message}`);

  const income = data.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = data.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0);

  return ok({
    income,
    expense,
    balance: income - expense,
    count: data.length
  });
}
