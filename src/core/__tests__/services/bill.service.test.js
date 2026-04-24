/**
 * Bill Service — Unit Tests
 * TDD Phase: RED (Fixing Mock Paths)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/bill.repository.js');
vi.mock('../../repositories/customer.repository.js');
vi.mock('../../repositories/package.repository.js');
vi.mock('../../repositories/finance.repository.js');

// Mock dependencies that rely on env vars
vi.mock('../../../../api/_lib/supabase.js', () => ({
  supabase: {},
  supabaseAdmin: {},
  verifyAuth: vi.fn(),
  isAdmin: vi.fn(),
  isFinance: vi.fn(),
  hasRole: vi.fn(),
  withCors: vi.fn(fn => fn),
  jsonResponse: vi.fn(),
  errorResponse: vi.fn()
}));

vi.mock('../../../../api/_lib/fonnte.js', () => ({
  enqueueNotification: vi.fn().mockResolvedValue(),
  getTokenConfig: vi.fn().mockResolvedValue({ routing: {} })
}));

vi.mock('../../../../src/api/config.js', () => ({
  APP_CONFIG: { BASE_URL: 'http://test.com' }
}));

import * as billRepo from '../../repositories/bill.repository.js';
import * as customerRepo from '../../repositories/customer.repository.js';
import * as packageRepo from '../../repositories/package.repository.js';
import * as financeRepo from '../../repositories/finance.repository.js';
import {
  generateMonthlyBills,
  markBillAsPaid
} from '../../services/bill.service.js';

describe('BillService', () => {
  const mockDb = {};
  const mockDbB = {}; // Vault

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMonthlyBills', () => {
    it('should reject invalid period', async () => {
      const result = await generateMonthlyBills(mockDb, mockDbB, null, 2024);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should generate bills for all customers with packages', async () => {
      packageRepo.findAll.mockResolvedValue({ data: [{ name: 'Home 10M', price: 100000 }] });
      customerRepo.findAll.mockResolvedValue({ data: [
        { id: 'c1', name: 'User 1', packet: 'Home 10M' },
        { id: 'c2', name: 'User 2', packet: 'Non-existent' }
      ] });
      billRepo.upsertBills.mockResolvedValue({ data: [{ id: 'b1' }], error: null });

      const result = await generateMonthlyBills(mockDb, mockDbB, 4, 2026);

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(1); 
      expect(billRepo.upsertBills).toHaveBeenCalled();
    });
  });

  describe('markBillAsPaid', () => {
    it('should reject if bill not found', async () => {
      billRepo.findByIdWithCustomer.mockResolvedValue({ data: null });
      const result = await markBillAsPaid(mockDb, mockDbB, 'b1', {}, { id: 'u1' });
      expect(result.statusHint).toBe('not_found');
    });

    it('should mark paid, create ledger entry and notify', async () => {
      const bill = { 
        id: 'b1', 
        status: 'unpaid', 
        amount: 100000, 
        period_date: '2026-04-01',
        customers: { id: 'c1', name: 'Andi', phone: '0812' } 
      };
      billRepo.findByIdWithCustomer.mockResolvedValue({ data: bill });
      billRepo.updateStatus.mockResolvedValue({ error: null });
      financeRepo.createTransaction.mockResolvedValue({ error: null });

      const result = await markBillAsPaid(mockDb, mockDbB, 'b1', { payment_method: 'cash' }, { id: 'u1' });

      expect(result.success).toBe(true);
      expect(billRepo.updateStatus).toHaveBeenCalledWith(mockDb, 'b1', expect.objectContaining({ status: 'paid' }));
    });
  });
});
