import { describe, it, expect, vi } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as packageRepo from '../../repositories/package.repository.js';

describe('PackageRepository', () => {
  it('should call findAll correctly', async () => {
    const db = createMockDbClient();
    await packageRepo.findAll(db);

    expect(db.from).toHaveBeenCalledWith('internet_packages');
    expect(db._builder.select).toHaveBeenCalledWith('*');
    expect(db._builder.order).toHaveBeenCalledWith('name');
  });

  it('should call create correctly', async () => {
    const db = createMockDbClient();
    const payload = { name: 'P1', price: 100 };
    await packageRepo.create(db, payload);

    expect(db.from).toHaveBeenCalledWith('internet_packages');
    expect(db._builder.insert).toHaveBeenCalledWith(payload);
    expect(db._builder.single).toHaveBeenCalled();
  });

  it('should call updateById correctly', async () => {
    const db = createMockDbClient();
    const updates = { price: 200 };
    await packageRepo.updateById(db, '1', updates);

    expect(db.from).toHaveBeenCalledWith('internet_packages');
    expect(db._builder.update).toHaveBeenCalledWith(updates);
    expect(db._builder.eq).toHaveBeenCalledWith('id', '1');
    expect(db._builder.single).toHaveBeenCalled();
  });

  it('should call deleteById correctly', async () => {
    const db = createMockDbClient();
    await packageRepo.deleteById(db, '1');

    expect(db.from).toHaveBeenCalledWith('internet_packages');
    expect(db._builder.delete).toHaveBeenCalled();
    expect(db._builder.eq).toHaveBeenCalledWith('id', '1');
  });
});
