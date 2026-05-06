import { describe, it, expect, vi } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as roleRepo from '../../repositories/role.repository.js';

describe('RoleRepository', () => {
  it('should call findAll correctly', async () => {
    const db = createMockDbClient();
    await roleRepo.findAll(db);

    expect(db.from).toHaveBeenCalledWith('roles');
    expect(db._builder.select).toHaveBeenCalledWith('*');
    expect(db._builder.order).toHaveBeenCalledWith('name');
  });

  it('should call create correctly', async () => {
    const db = createMockDbClient();
    const payload = { name: 'Admin', code: 'ADM' };
    await roleRepo.create(db, payload);

    expect(db.from).toHaveBeenCalledWith('roles');
    expect(db._builder.insert).toHaveBeenCalledWith(payload);
    expect(db._builder.single).toHaveBeenCalled();
  });
});
