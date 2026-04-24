/**
 * Package Service — Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/package.repository.js');

import * as packageRepo from '../../repositories/package.repository.js';
import {
  listPackages,
  createPackage,
  updatePackage,
  deletePackage
} from '../../services/package.service.js';

describe('PackageService', () => {
  const mockDb = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listPackages', () => {
    it('should return packages', async () => {
      const items = [{ id: '1', name: 'Home 10M' }];
      packageRepo.findAll.mockResolvedValue({ data: items, error: null });

      const result = await listPackages(mockDb);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(items);
    });
  });

  describe('createPackage', () => {
    it('should reject missing name or price', async () => {
      const res1 = await createPackage(mockDb, { price: 100 });
      expect(res1.statusHint).toBe('bad_request');

      const res2 = await createPackage(mockDb, { name: 'P1' });
      expect(res2.statusHint).toBe('bad_request');
    });

    it('should create successfully', async () => {
      const newItem = { id: '1', name: 'P1', price: 100 };
      packageRepo.create.mockResolvedValue({ data: newItem, error: null });

      const result = await createPackage(mockDb, { name: 'P1', price: 100 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newItem);
    });
  });

  describe('updatePackage', () => {
    it('should update successfully', async () => {
      const updated = { id: '1', name: 'P1 New' };
      packageRepo.updateById.mockResolvedValue({ data: updated, error: null });

      const result = await updatePackage(mockDb, '1', { name: 'P1 New' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
    });
  });

  describe('deletePackage', () => {
    it('should delete successfully', async () => {
      packageRepo.deleteById.mockResolvedValue({ error: null });
      const result = await deletePackage(mockDb, '1');
      expect(result.success).toBe(true);
    });
  });
});
