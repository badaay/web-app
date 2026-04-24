/**
 * Finance Service — Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/finance.repository.js');

import * as financeRepo from '../../repositories/finance.repository.js';
import {
  listTransactions,
  createTransaction,
  getFinancialSummary
} from '../../services/finance.service.js';

describe('FinanceService', () => {
  const mockDb = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTransactions', () => {
    it('should return transactions', async () => {
      financeRepo.findAllTransactions.mockResolvedValue({ data: [], count: 0 });
      const result = await listTransactions(mockDb, {});
      expect(result.success).toBe(true);
    });
  });

  describe('createTransaction', () => {
    it('should reject missing fields', async () => {
      const result = await createTransaction(mockDb, { amount: 100 }, 'u1');
      expect(result.statusHint).toBe('bad_request');
    });

    it('should create successfully', async () => {
      const tx = { amount: 100, transaction_type: 'income', description: 'Test' };
      financeRepo.createTransaction.mockResolvedValue({ data: { id: '1', ...tx }, error: null });

      const result = await createTransaction(mockDb, tx, 'u1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('1');
    });
  });

  describe('getFinancialSummary', () => {
    it('should calculate totals', async () => {
      const data = [
        { transaction_type: 'income', amount: 1000 },
        { transaction_type: 'expense', amount: 400 }
      ];
      financeRepo.findSummary.mockResolvedValue({ data, error: null });

      const result = await getFinancialSummary(mockDb, {});

      expect(result.success).toBe(true);
      expect(result.data.income).toBe(1000);
      expect(result.data.expense).toBe(400);
      expect(result.data.balance).toBe(600);
    });
  });
});
