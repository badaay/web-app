/**
 * Finance Service — Unit Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { setupServiceTest } from './setup.js';

vi.mock('../../repositories/finance.repository.js');

import * as financeRepo from '../../repositories/finance.repository.js';
import {
  listTransactions,
  createTransaction,
  getFinancialSummary,
  listPayrollPeriods,
  getPayrollRekap,
  markPayrollPaid
} from '../../services/finance.service.js';

describe('FinanceService', () => {
  const { mockDb } = setupServiceTest();


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
        { type: 'income', amount: 1000 },
        { type: 'expense', amount: 400 }
      ];
      financeRepo.findSummary.mockResolvedValue({ data, error: null });

      const result = await getFinancialSummary(mockDb, { month: 4, year: 2026 });

      expect(result.success).toBe(true);
      expect(result.data.total_income).toBe(1000);
      expect(result.data.total_expense).toBe(400);
    });

  });

  // ── Payroll Rekap (Story 2.4) ────────────────────────────────────────────

  describe('listPayrollPeriods', () => {
    it('should return payroll periods', async () => {
      financeRepo.findAllPayrollPeriods.mockResolvedValue({
        data: [{ id: 'p1', year: 2026, month: 4, status: 'calculated' }],
        count: 1,
        error: null
      });

      const result = await listPayrollPeriods(mockDb, {});
      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
    });

    it('should handle database error', async () => {
      financeRepo.findAllPayrollPeriods.mockResolvedValue({
        data: null, count: 0, error: { message: 'DB error' }
      });

      const result = await listPayrollPeriods(mockDb, {});
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('server_error');
    });
  });

  describe('getPayrollRekap', () => {
    it('should reject missing period_id', async () => {
      const result = await getPayrollRekap(mockDb, null);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should reject if period not found', async () => {
      financeRepo.findPayrollPeriodById.mockResolvedValue({
        data: null, error: { message: 'Not found' }
      });

      const result = await getPayrollRekap(mockDb, 'nonexistent');
      expect(result.statusHint).toBe('not_found');
    });

    it('should return rekap with totals', async () => {
      financeRepo.findPayrollPeriodById.mockResolvedValue({
        data: { id: 'p1', year: 2026, month: 4, status: 'calculated' },
        error: null
      });
      financeRepo.findPayrollSummariesForPeriod.mockResolvedValue({
        data: [
          { employee_name: 'Andi', gross_earnings: 5000000, total_deductions: 500000, take_home_pay: 4500000, actual_points: 100, target_points: 80 },
          { employee_name: 'Budi', gross_earnings: 4000000, total_deductions: 400000, take_home_pay: 3600000, actual_points: 60, target_points: 80 }
        ],
        count: 2,
        error: null
      });

      const result = await getPayrollRekap(mockDb, 'p1');
      expect(result.success).toBe(true);
      expect(result.data.summaries).toHaveLength(2);
      expect(result.data.totals.gross_earnings).toBe(9000000);
      expect(result.data.totals.total_deductions).toBe(900000);
      expect(result.data.totals.take_home_pay).toBe(8100000);
      expect(result.data.totals.employee_count).toBe(2);
    });
  });

  describe('markPayrollPaid', () => {
    it('should reject missing period_id', async () => {
      const result = await markPayrollPaid(mockDb, null, 'user1');
      expect(result.statusHint).toBe('bad_request');
    });

    it('should reject if period not found', async () => {
      financeRepo.findPayrollPeriodById.mockResolvedValue({
        data: null, error: { message: 'Not found' }
      });

      const result = await markPayrollPaid(mockDb, 'nonexistent', 'user1');
      expect(result.statusHint).toBe('not_found');
    });

    it('should reject if period status is not approved', async () => {
      financeRepo.findPayrollPeriodById.mockResolvedValue({
        data: { id: 'p1', month: 4, year: 2026, status: 'calculated' },
        error: null
      });

      const result = await markPayrollPaid(mockDb, 'p1', 'user1');
      expect(result.statusHint).toBe('conflict');
    });

    it('should mark as paid successfully', async () => {
      financeRepo.findPayrollPeriodById.mockResolvedValue({
        data: { id: 'p1', month: 4, year: 2026, status: 'approved' },
        error: null
      });
      financeRepo.markPeriodAsPaid.mockResolvedValue({
        data: { id: 'p1' }, error: null
      });

      const result = await markPayrollPaid(mockDb, 'p1', 'user1');
      expect(result.success).toBe(true);
      expect(result.data.period_id).toBe('p1');
    });
  });
});
