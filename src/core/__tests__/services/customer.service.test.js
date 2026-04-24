/**
 * Customer Service — Unit Tests
 * TDD Phase: RED
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/customer.repository.js');

import * as customerRepo from '../../repositories/customer.repository.js';
import {
  listCustomers,
  updateCustomer,
  deleteCustomer,
  registerCustomer,
  loginCustomer
} from '../../services/customer.service.js';

describe('CustomerService', () => {
  const mockDb = {};
  const mockAuthClient = {
    auth: { 
      admin: { deleteUser: vi.fn() },
      signInWithPassword: vi.fn()
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── listCustomers ─────────────────────────────────────────────────────────
  describe('listCustomers', () => {
    it('should return paginated customers', async () => {
      const customers = [{ id: '1', name: 'Andi', customer_code: '26040001234' }];
      customerRepo.findAll.mockResolvedValue({ data: customers, error: null, count: 1 });
      const result = await listCustomers(mockDb, { limit: 50, offset: 0 });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: customers, count: 1, limit: 50, offset: 0 });
    });
  });

  // ── updateCustomer ────────────────────────────────────────────────────────
  describe('updateCustomer', () => {
    it('should detect duplicate phone number', async () => {
      customerRepo.findByPhone.mockResolvedValue({ data: { id: 'other-uuid' } });
      const result = await updateCustomer(mockDb, 'uuid-1', { phone: '08121234' });
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('conflict');
    });
  });

  // ── deleteCustomer ────────────────────────────────────────────────────────
  describe('deleteCustomer', () => {
    it('should reject deletion if customer has active work orders', async () => {
      customerRepo.findById.mockResolvedValue({ data: { id: 'uuid-1', name: 'Andi' } });
      customerRepo.countActiveWorkOrders.mockResolvedValue({ count: 2 });
      const result = await deleteCustomer(mockDb, mockAuthClient, 'uuid-1');
      expect(result.statusHint).toBe('conflict');
    });
  });

  // ── Registration & Login (Wave 2.4) ────────────────────────────────────────

  describe('registerCustomer', () => {
    it('should reject if name or phone missing', async () => {
      const result = await registerCustomer(mockDb, { address: 'Street' });
      expect(result.statusHint).toBe('bad_request');
    });

    it('should register successfully', async () => {
      customerRepo.findByPhone.mockResolvedValue({ data: null });
      customerRepo.create.mockResolvedValue({ data: { id: 'uuid-1' }, error: null });
      
      const result = await registerCustomer(mockDb, { 
        name: 'Andi', 
        phone: '0812', 
        address: 'Street' 
      });

      expect(result.success).toBe(true);
      expect(result.statusHint).toBe('created');
    });
  });

  describe('loginCustomer', () => {
    it('should reject invalid credentials', async () => {
      customerRepo.findByPhone.mockResolvedValue({ data: null });
      const result = await loginCustomer(mockDb, mockAuthClient, '0812', 'pass');
      expect(result.statusHint).toBe('unauthorized');
    });

  });
});
