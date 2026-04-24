/**
 * Employee Service — Unit Tests
 * TDD Phase: RED
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/employee.repository.js');

import * as employeeRepo from '../../repositories/employee.repository.js';
import { 
  listEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  getSalaryConfigs,
  upsertSalaryConfig
} from '../../services/employee.service.js';

describe('EmployeeService', () => {
  const mockDb = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── listEmployees ─────────────────────────────────────────────────────────

  describe('listEmployees', () => {
    it('should return paginated employees with role joins', async () => {
      const employees = [
        { id: '1', name: 'Budi', employee_id: 'EMP001', roles: { name: 'Teknisi' } },
      ];
      employeeRepo.findAll.mockResolvedValue({ data: employees, error: null, count: 1 });

      const result = await listEmployees(mockDb, { limit: 50, offset: 0 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: employees, count: 1, limit: 50, offset: 0 });
    });

    it('should pass search param to repository', async () => {
      employeeRepo.findAll.mockResolvedValue({ data: [], error: null, count: 0 });

      await listEmployees(mockDb, { limit: 50, offset: 0, search: 'budi' });

      expect(employeeRepo.findAll).toHaveBeenCalledWith(mockDb, {
        limit: 50, offset: 0, search: 'budi',
      });
    });

    it('should return server_error on db failure', async () => {
      employeeRepo.findAll.mockResolvedValue({ data: null, error: { message: 'fail' } });

      const result = await listEmployees(mockDb, { limit: 50, offset: 0 });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('server_error');
    });
  });

  // ── createEmployee ────────────────────────────────────────────────────────

  describe('createEmployee', () => {
    it('should reject if name is missing', async () => {
      const result = await createEmployee(mockDb, { employee_id: 'E01', position: 'Tech' });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should reject if employee_id is missing', async () => {
      const result = await createEmployee(mockDb, { name: 'Budi', position: 'Tech' });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should reject if position is missing', async () => {
      const result = await createEmployee(mockDb, { name: 'Budi', employee_id: 'E01' });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should create employee with valid data', async () => {
      const emp = { id: '1', name: 'Budi', employee_id: 'E01', position: 'Teknisi' };
      employeeRepo.create.mockResolvedValue({ data: emp, error: null });

      const result = await createEmployee(mockDb, {
        name: 'Budi', employee_id: 'E01', position: 'Teknisi', email: 'budi@test.com',
      });

      expect(result.success).toBe(true);
      expect(result.statusHint).toBe('created');
      expect(result.data).toEqual(emp);
    });
  });

  // ── updateEmployee ────────────────────────────────────────────────────────

  describe('updateEmployee', () => {
    it('should reject empty updates', async () => {
      const result = await updateEmployee(mockDb, 'uuid-1', { hacked: 'yes' });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should update successfully', async () => {
      const updated = { id: 'uuid-1', name: 'Updated Budi' };
      employeeRepo.updateById.mockResolvedValue({ data: updated, error: null });

      const result = await updateEmployee(mockDb, 'uuid-1', { name: 'Updated Budi' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
    });
  });

  // ── deleteEmployee ────────────────────────────────────────────────────────

  describe('deleteEmployee', () => {
    it('should verify employee exists before deleting', async () => {
      employeeRepo.findById.mockResolvedValue({ data: null });

      const result = await deleteEmployee(mockDb, 'ghost');

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('not_found');
    });

    it('should delete successfully', async () => {
      employeeRepo.findById.mockResolvedValue({ data: { id: 'uuid-1', name: 'Budi' } });
      employeeRepo.deleteById.mockResolvedValue({ error: null });

      const result = await deleteEmployee(mockDb, 'uuid-1');

      expect(result.success).toBe(true);
      expect(result.data.message).toContain('Budi');
    });
  });

  // ── Salary Config (Wave 2.2) ────────────────────────────────────────────────

  describe('getSalaryConfigs', () => {
    it('should fetch configs for an employee', async () => {
      const configs = [{ id: '1', employee_id: 'uuid-1', position_allowance: 1000 }];
      employeeRepo.findSalaryConfigs.mockResolvedValue({ data: configs, error: null });

      const result = await getSalaryConfigs(mockDb, 'uuid-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(configs);
    });

    it('should return server_error on failure', async () => {
      employeeRepo.findSalaryConfigs.mockResolvedValue({ error: { message: 'fail' } });
      const result = await getSalaryConfigs(mockDb, 'uuid-1');
      expect(result.statusHint).toBe('server_error');
    });
  });

  describe('upsertSalaryConfig', () => {
    it('should reject if employee_id is missing', async () => {
      const result = await upsertSalaryConfig(mockDb, null, { allowance: 100 });
      expect(result.statusHint).toBe('bad_request');
    });

    it('should reject if effective_from is missing', async () => {
      const result = await upsertSalaryConfig(mockDb, 'uuid-1', { allowance: 100 });
      expect(result.statusHint).toBe('bad_request');
    });

    it('should upsert successfully', async () => {
      const payload = { 
        employee_id: 'uuid-1', 
        effective_from: '2024-01-01',
        position_allowance: 500000 
      };
      employeeRepo.upsertSalaryConfig.mockResolvedValue({ data: payload, error: null });

      const result = await upsertSalaryConfig(mockDb, 'uuid-1', payload);

      expect(result.success).toBe(true);
      expect(employeeRepo.upsertSalaryConfig).toHaveBeenCalled();
    });
  });
});
