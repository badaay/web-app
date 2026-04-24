import { describe, it, expect } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as financeRepo from '../../repositories/finance.repository.js';

describe('FinanceRepository', () => {
  it('should call findAllTransactions correctly', async () => {
    const db = createMockDbClient();
    await financeRepo.findAllTransactions(db, { limit: 10, offset: 0, search: 'Test' });

    expect(db.from).toHaveBeenCalledWith('financial_transactions');
    expect(db._builder.select).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(db._builder.or).toHaveBeenCalledWith('description.ilike.%Test%,reference_no.ilike.%Test%');
    expect(db._builder.order).toHaveBeenCalledWith('transaction_date', { ascending: false });
    expect(db._builder.range).toHaveBeenCalledWith(0, 9);
  });

  it('should call createTransaction correctly', async () => {
    const db = createMockDbClient();
    const payload = { amount: 100 };
    await financeRepo.createTransaction(db, payload);

    expect(db.from).toHaveBeenCalledWith('financial_transactions');
    expect(db._builder.insert).toHaveBeenCalledWith(payload);
    expect(db._builder.select).toHaveBeenCalled();
    expect(db._builder.single).toHaveBeenCalled();
  });

  it('should call findSummary correctly', async () => {
    const db = createMockDbClient();
    await financeRepo.findSummary(db, { startDate: '2026-01-01', endDate: '2026-01-31' });

    expect(db.from).toHaveBeenCalledWith('financial_transactions');
    expect(db._builder.select).toHaveBeenCalledWith('transaction_type, amount');
    expect(db._builder.gte).toHaveBeenCalledWith('transaction_date', '2026-01-01');
    expect(db._builder.lte).toHaveBeenCalledWith('transaction_date', '2026-01-31');
  });

  it('should call findBankAccounts correctly', async () => {
    const db = createMockDbClient();
    await financeRepo.findBankAccounts(db);

    expect(db.from).toHaveBeenCalledWith('bank_accounts');
    expect(db._builder.select).toHaveBeenCalledWith('*');
    expect(db._builder.order).toHaveBeenCalledWith('account_name');
  });
});
