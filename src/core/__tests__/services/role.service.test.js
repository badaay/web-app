/**
 * Role Service — Unit Tests
 * TDD Phase: RED
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/role.repository.js');

import * as roleRepo from '../../repositories/role.repository.js';
import { listRoles, createRole } from '../../services/role.service.js';

describe('RoleService', () => {
  const mockDb = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listRoles', () => {
    it('should return all roles', async () => {
      const roles = [
        { id: '1', name: 'Admin', code: 'ADM' },
        { id: '2', name: 'Teknisi', code: 'TECH' },
      ];
      roleRepo.findAll.mockResolvedValue({ data: roles, error: null });

      const result = await listRoles(mockDb);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(roles);
    });

    it('should return server_error on failure', async () => {
      roleRepo.findAll.mockResolvedValue({ data: null, error: { message: 'fail' } });

      const result = await listRoles(mockDb);

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('server_error');
    });
  });

  describe('createRole', () => {
    it('should reject if name or code is missing', async () => {
      const result1 = await createRole(mockDb, { name: 'Test' });
      expect(result1.success).toBe(false);
      expect(result1.statusHint).toBe('bad_request');

      const result2 = await createRole(mockDb, { code: 'TST' });
      expect(result2.success).toBe(false);
      expect(result2.statusHint).toBe('bad_request');
    });

    it('should create role with valid data', async () => {
      const newRole = { id: '3', name: 'Supervisor', code: 'SPV' };
      roleRepo.create.mockResolvedValue({ data: newRole, error: null });

      const result = await createRole(mockDb, { name: 'Supervisor', code: 'SPV', description: 'SPV desc' });

      expect(result.success).toBe(true);
      expect(result.statusHint).toBe('created');
      expect(roleRepo.create).toHaveBeenCalledWith(mockDb, {
        name: 'Supervisor',
        code: 'SPV',
        description: 'SPV desc',
      });
    });

    it('should return server_error on duplicate', async () => {
      roleRepo.create.mockResolvedValue({ data: null, error: { message: 'unique constraint' } });

      const result = await createRole(mockDb, { name: 'Admin', code: 'ADM' });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('server_error');
    });
  });
});
