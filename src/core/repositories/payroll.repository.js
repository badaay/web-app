/**
 * Payroll Repository — Data Access Layer
 * Handles queries for payroll-related tables.
 */

export async function findPeriodById(dbClient, id) {
  return dbClient
    .from('payroll_periods')
    .select('*')
    .eq('id', id)
    .maybeSingle();
}

export async function updatePeriod(dbClient, id, updates) {
  return dbClient
    .from('payroll_periods')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function findActiveEmployees(dbClient) {
  return dbClient
    .from('employees')
    .select('id, name, employee_id, base_salary, target_monthly_points, is_bpjs_enrolled')
    .eq('status', 'Aktif');
}

export async function findSalaryConfigsForEmployees(dbClient, employeeIds) {
  return dbClient
    .from('employee_salary_configs')
    .select(`
      employee_id, position_allowance, additional_allowance, quota_allowance,
      education_allowance, transport_meal_allowance, bpjs_company_contribution,
      effective_from, effective_to
    `)
    .in('employee_id', employeeIds);
}

export async function findOvertimeData(dbClient, employeeId, start, end) {
  return dbClient
    .from('overtime_assignments')
    .select('amount_earned, overtime_records(overtime_date)')
    .eq('employee_id', employeeId)
    .gte('overtime_records.overtime_date', start)
    .lte('overtime_records.overtime_date', end);
}

export async function findAttendanceData(dbClient, employeeId, start, end) {
  return dbClient
    .from('attendance_records')
    .select('deduction_amount, is_absent, late_minutes')
    .eq('employee_id', employeeId)
    .gte('attendance_date', start)
    .lte('attendance_date', end);
}

export async function calculatePointDeductionRpc(dbClient, employeeId, year, month) {
  return dbClient.rpc('calculate_point_deduction', {
    p_employee_id: employeeId,
    p_year: year,
    p_month: month
  });
}

export async function findAdjustments(dbClient, employeeId, periodId) {
  return dbClient
    .from('payroll_adjustments')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('payroll_period_id', periodId)
    .eq('status', 'approved');
}

export async function deleteLineItems(dbClient, periodId) {
  return dbClient
    .from('payroll_line_items')
    .delete()
    .eq('payroll_period_id', periodId)
    .eq('is_manual_override', false);
}

export async function insertLineItems(dbClient, items) {
  return dbClient
    .from('payroll_line_items')
    .insert(items);
}

export async function upsertSummaries(dbClient, summaries) {
  return dbClient
    .from('payroll_summaries')
    .upsert(summaries, { onConflict: 'payroll_period_id,employee_id' });
}

export async function findAppSettings(dbClient, keys) {
  return dbClient
    .from('app_settings')
    .select('setting_key, setting_value')
    .in('setting_key', keys);
}
