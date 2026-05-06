/**
 * Package Service — Unit Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { setupServiceTest } from './setup.js';

vi.mock('../../repositories/package.repository.js');

import * as packageRepo from '../../repositories/package.repository.js';
import {
  listPackages,
  createPackage,
  updatePackage,
  deletePackage
} from '../../services/package.service.js';

describe('PackageService', () => {
  const { mockDb } = setupServiceTest();

  describe('listPackages', () => {
    it('should return packages', async () => {
      const items = [{ id: '1', name: 'Home 10M' }];
      packageRepo.findAll.mockResolvedValue({ data: items, error: null });

      const result = await listPackages(mockDb);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(items);
    });

    it('should return server_error on db failure', async () => {
      packageRepo.findAll.mockResolvedValue({ error: { message: 'DB down' } });
      const result = await listPackages(mockDb);
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('server_error');
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

    it('should return server_error on create failure', async () => {
      packageRepo.create.mockResolvedValue({ error: { message: 'Insert failed' } });
      const result = await createPackage(mockDb, { name: 'P1', price: 100 });
      expect(result.statusHint).toBe('server_error');
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

    it('should return not_found if package does not exist', async () => {
      packageRepo.updateById.mockResolvedValue({ data: null, error: null });
      const result = await updatePackage(mockDb, '1', { name: 'P1 New' });
      expect(result.statusHint).toBe('not_found');
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
