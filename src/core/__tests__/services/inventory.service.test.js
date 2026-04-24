/**
 * Inventory Service — Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/inventory.repository.js');

import * as inventoryRepo from '../../repositories/inventory.repository.js';
import {
  listInventory,
  createItem,
  updateItem,
  deleteItem
} from '../../services/inventory.service.js';

describe('InventoryService', () => {
  const mockDb = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listInventory', () => {
    it('should return inventory items', async () => {
      const items = [{ id: '1', name: 'ONT' }];
      inventoryRepo.findAll.mockResolvedValue({ data: items, error: null });

      const result = await listInventory(mockDb);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(items);
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
  });

  describe('updateItem', () => {
    it('should update successfully', async () => {
      const updated = { id: '1', name: 'ONT New' };
      inventoryRepo.updateById.mockResolvedValue({ data: updated, error: null });

      const result = await updateItem(mockDb, '1', { name: 'ONT New' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
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
