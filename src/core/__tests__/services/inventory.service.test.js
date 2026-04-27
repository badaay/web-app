/**
 * Inventory Service — Unit Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { setupServiceTest } from './setup.js';

vi.mock('../../repositories/inventory.repository.js');

import * as inventoryRepo from '../../repositories/inventory.repository.js';
import {
  listInventory,
  createItem,
  updateItem,
  deleteItem
} from '../../services/inventory.service.js';

describe('InventoryService', () => {
  const { mockDb } = setupServiceTest();

  describe('listInventory', () => {
    it('should return inventory items', async () => {
      const items = [{ id: '1', name: 'ONT' }];
      inventoryRepo.findAll.mockResolvedValue({ data: items, error: null });

      const result = await listInventory(mockDb);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(items);
    });

    it('should return server_error on db failure', async () => {
      inventoryRepo.findAll.mockResolvedValue({ error: { message: 'DB down' } });
      const result = await listInventory(mockDb);
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('server_error');
    });
  });

  describe('createItem', () => {
    it('should reject missing name', async () => {
      const result = await createItem(mockDb, { stock: 10 });
      expect(result.statusHint).toBe('bad_request');
    });

    it('should create item successfully', async () => {
      const newItem = { id: '1', name: 'ONT', stock: 10 };
      inventoryRepo.create.mockResolvedValue({ data: newItem, error: null });

      const result = await createItem(mockDb, { name: 'ONT', stock: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newItem);
    });

    it('should return server_error on create failure', async () => {
      inventoryRepo.create.mockResolvedValue({ error: { message: 'Insert failed' } });
      const result = await createItem(mockDb, { name: 'ONT', stock: 10 });
      expect(result.statusHint).toBe('server_error');
    });
  });

  describe('updateItem', () => {
    it('should update successfully', async () => {
      const updated = { id: '1', name: 'ONT New' };
      inventoryRepo.updateById.mockResolvedValue({ data: updated, error: null });

      const result = await updateItem(mockDb, '1', { name: 'ONT New' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
    });

    it('should return not_found if item does not exist', async () => {
      inventoryRepo.updateById.mockResolvedValue({ data: null, error: null });
      const result = await updateItem(mockDb, '1', { name: 'ONT New' });
      expect(result.statusHint).toBe('not_found');
    });
  });

  describe('deleteItem', () => {
    it('should delete successfully', async () => {
      inventoryRepo.deleteById.mockResolvedValue({ error: null });
      const result = await deleteItem(mockDb, '1');
      expect(result.success).toBe(true);
    });
  });
});
