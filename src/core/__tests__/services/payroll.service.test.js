/**
 * Payroll Service — Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/payroll.repository.js');

// Mock dependencies
vi.mock('../../../../api/_lib/supabase.js', () => ({
  supabaseAdmin: {},
  withCors: vi.fn(fn => fn),
  jsonResponse: vi.fn(),
  errorResponse: vi.fn()
}));

import * as payrollRepo from '../../repositories/payroll.repository.js';
import { calculatePayroll } from '../../services/payroll.service.js';

describe('PayrollService', () => {
  const mockDb = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculatePayroll', () => {
    it('should reject missing periodId', async () => {
      const result = await calculatePayroll(mockDb, null, 'u1');
      expect(result.statusHint).toBe('bad_request');
    });

    it('should reject if period not found', async () => {
      payrollRepo.findPeriodById.mockResolvedValue({ data: null });
      const result = await calculatePayroll(mockDb, 'p1', 'u1');
      expect(result.statusHint).toBe('not_found');
    });

    it('should run full calculation pipeline', async () => {
      const period = { id: 'p1', status: 'draft', period_start: '2026-04-01', period_end: '2026-04-30', year: 2026, month: 4 };
      payrollRepo.findPeriodById.mockResolvedValue({ data: period });
      payrollRepo.updatePeriod.mockResolvedValue({ error: null });
      payrollRepo.findAppSettings.mockResolvedValue({ data: [{ setting_key: 'bpjs_fixed_amount', setting_value: '100' }] });
      payrollRepo.findActiveEmployees.mockResolvedValue({ data: [{ id: 'e1', name: 'Emp 1', base_salary: 1000 }] });
      payrollRepo.findSalaryConfigsForEmployees.mockResolvedValue({ data: [] });
      payrollRepo.findOvertimeData.mockResolvedValue({ data: [] });
      payrollRepo.findAttendanceData.mockResolvedValue({ data: [] });
      payrollRepo.calculatePointDeductionRpc.mockResolvedValue({ data: [{ deduction_amount: 0 }] });
      payrollRepo.findAdjustments.mockResolvedValue({ data: [] });
      payrollRepo.deleteLineItems.mockResolvedValue({ error: null });
      payrollRepo.insertLineItems.mockResolvedValue({ error: null });
      payrollRepo.upsertSummaries.mockResolvedValue({ error: null });

      const result = await calculatePayroll(mockDb, 'p1', 'u1');

      expect(result.success).toBe(true);
      expect(payrollRepo.insertLineItems).toHaveBeenCalled();
      expect(payrollRepo.upsertSummaries).toHaveBeenCalled();
      expect(payrollRepo.updatePeriod).toHaveBeenCalledWith(mockDb, 'p1', expect.objectContaining({ status: 'calculated' }));
    });
  });
});
