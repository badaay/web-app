import { describe, it, expect, vi } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as inventoryRepo from '../../repositories/inventory.repository.js';

describe('InventoryRepository', () => {
  it('should call findAll correctly', async () => {
    const db = createMockDbClient();
    await inventoryRepo.findAll(db);

    expect(db.from).toHaveBeenCalledWith('inventory_items');
    expect(db._builder.select).toHaveBeenCalledWith('*');
    expect(db._builder.order).toHaveBeenCalledWith('name');
  });

  it('should call create correctly', async () => {
    const db = createMockDbClient();
    const payload = { name: 'ONT', stock: 10 };
    await inventoryRepo.create(db, payload);

    expect(db.from).toHaveBeenCalledWith('inventory_items');
    expect(db._builder.insert).toHaveBeenCalledWith(payload);
    expect(db._builder.single).toHaveBeenCalled();
  });

  it('should call updateById correctly', async () => {
    const db = createMockDbClient();
    const updates = { stock: 20 };
    await inventoryRepo.updateById(db, '1', updates);

    expect(db.from).toHaveBeenCalledWith('inventory_items');
    expect(db._builder.update).toHaveBeenCalledWith(updates);
    expect(db._builder.eq).toHaveBeenCalledWith('id', '1');
    expect(db._builder.single).toHaveBeenCalled();
  });

  it('should call deleteById correctly', async () => {
    const db = createMockDbClient();
    await inventoryRepo.deleteById(db, '1');

    expect(db.from).toHaveBeenCalledWith('inventory_items');
    expect(db._builder.delete).toHaveBeenCalled();
    expect(db._builder.eq).toHaveBeenCalledWith('id', '1');
  });
});
