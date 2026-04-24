import { describe, it, expect } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as payrollRepo from '../../repositories/payroll.repository.js';

describe('PayrollRepository', () => {
  it('should call findPeriodById correctly', async () => {
    const db = createMockDbClient();
    await payrollRepo.findPeriodById(db, 'p1');

    expect(db.from).toHaveBeenCalledWith('payroll_periods');
    expect(db._builder.select).toHaveBeenCalledWith('*');
    expect(db._builder.eq).toHaveBeenCalledWith('id', 'p1');
    expect(db._builder.maybeSingle).toHaveBeenCalled();
  });

  it('should call updatePeriod correctly', async () => {
    const db = createMockDbClient();
    await payrollRepo.updatePeriod(db, 'p1', { status: 'calculated' });

    expect(db.from).toHaveBeenCalledWith('payroll_periods');
    expect(db._builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'calculated' }));
    expect(db._builder.eq).toHaveBeenCalledWith('id', 'p1');
  });

  it('should call findSalaryConfigsForEmployees correctly', async () => {
    const db = createMockDbClient();
    await payrollRepo.findSalaryConfigsForEmployees(db, ['e1', 'e2']);

    expect(db.from).toHaveBeenCalledWith('employee_salary_configs');
    expect(db._builder.select).toHaveBeenCalled();
    expect(db._builder.in).toHaveBeenCalledWith('employee_id', ['e1', 'e2']);
  });

  it('should call findOvertimeData correctly', async () => {
    const db = createMockDbClient();
    await payrollRepo.findOvertimeData(db, 'e1', '2026-04-01', '2026-04-30');

    expect(db.from).toHaveBeenCalledWith('overtime_assignments');
    expect(db._builder.select).toHaveBeenCalledWith('amount_earned, overtime_records(overtime_date)');
    expect(db._builder.eq).toHaveBeenCalledWith('employee_id', 'e1');
    expect(db._builder.gte).toHaveBeenCalledWith('overtime_records.overtime_date', '2026-04-01');
    expect(db._builder.lte).toHaveBeenCalledWith('overtime_records.overtime_date', '2026-04-30');
  });

  it('should call findAttendanceData correctly', async () => {
    const db = createMockDbClient();
    await payrollRepo.findAttendanceData(db, 'e1', '2026-04-01', '2026-04-30');

    expect(db.from).toHaveBeenCalledWith('attendance_records');
    expect(db._builder.select).toHaveBeenCalledWith('deduction_amount, is_absent, late_minutes');
    expect(db._builder.eq).toHaveBeenCalledWith('employee_id', 'e1');
    expect(db._builder.gte).toHaveBeenCalledWith('attendance_date', '2026-04-01');
    expect(db._builder.lte).toHaveBeenCalledWith('attendance_date', '2026-04-30');
  });

  it('should call calculatePointDeductionRpc correctly', async () => {
    const db = createMockDbClient();
    await payrollRepo.calculatePointDeductionRpc(db, 'e1', 2026, 4);

    expect(db.rpc).toHaveBeenCalledWith('calculate_point_deduction', {
      p_employee_id: 'e1',
      p_year: 2026,
      p_month: 4
    });
  });

  it('should call upsertSummaries correctly', async () => {
    const db = createMockDbClient();
    const summaries = [{ employee_id: 'e1' }];
    await payrollRepo.upsertSummaries(db, summaries);

    expect(db.from).toHaveBeenCalledWith('payroll_summaries');
    expect(db._builder.upsert).toHaveBeenCalledWith(summaries, { onConflict: 'payroll_period_id,employee_id' });
  });
});
