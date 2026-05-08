/**
 * Payroll Service — Business Logic Layer
 * Orchestrates the 10-step payroll calculation pipeline.
 */
import * as payrollRepo from '../repositories/payroll.repository.js';
import { ok, badRequest, notFound, conflict, serverError } from '../utils/http-mapper.js';
import { calculateMonthlyAdjustments } from './point.service.js';

export async function calculatePayroll(dbClient, periodId, userId) {
  if (!periodId) return badRequest('period_id is required');

  try {
    // ── Step 1: Validate period ──
    const { data: period, error: periodErr } = await payrollRepo.findPeriodById(dbClient, periodId);
    if (periodErr || !period) return notFound('Payroll period not found');
    if (!['draft', 'calculated'].includes(period.status)) {
      return conflict(`Cannot recalculate: period status is '${period.status}'`);
    }

    // ── Step 2: Mark as calculating ──
    await payrollRepo.updatePeriod(dbClient, periodId, { status: 'calculating' });

    // ── Step 3: Get settings ──
    const { data: settings } = await payrollRepo.findAppSettings(dbClient, ['bpjs_fixed_amount']);
    const settingMap = Object.fromEntries((settings || []).map(s => [s.setting_key, s.setting_value]));
    const bpjsAmount = parseInt(settingMap['bpjs_fixed_amount'] || '194040');

    // ── Step 4: Get employees ──
    const { data: employees, error: empErr } = await payrollRepo.findActiveEmployees(dbClient);
    if (empErr) throw new Error(`Employee fetch error: ${empErr.message}`);
    if (!employees || employees.length === 0) {
      await payrollRepo.updatePeriod(dbClient, periodId, { status: 'draft' });
      return notFound('No active employees found');
    }

    // ── Step 4b: Get salary configs ──
    const employeeIds = employees.map(e => e.id);
    const { data: configs, error: configErr } = await payrollRepo.findSalaryConfigsForEmployees(dbClient, employeeIds);
    if (configErr) throw new Error(`Config fetch error: ${configErr.message}`);

    const lineItems = [];
    const summaries = [];

    for (const emp of employees) {
      const empConfigs = configs?.filter(c => c.employee_id === emp.id) || [];
      const activeConfig = empConfigs.find(c => {
        const start = new Date(c.effective_from);
        const end = c.effective_to ? new Date(c.effective_to) : null;
        const periodStart = new Date(period.period_start);
        return start <= periodStart && (!end || end >= periodStart);
      }) || {};

      const baseSalary = emp.base_salary || 0;
      const posAllow = activeConfig.position_allowance || 0;
      const addAllow = activeConfig.additional_allowance || 0;
      const quotaAllow = activeConfig.quota_allowance || 0;
      const eduAllow = activeConfig.education_allowance || 0;
      const tmAllow = activeConfig.transport_meal_allowance || 0;
      const fieldAllow = activeConfig.field_allowance || 0;
      const commAllow = activeConfig.communication_allowance || 0;

      const addLine = (type, code, name, amount, details = null) => {
        if (amount !== 0) {
          lineItems.push({
            payroll_period_id: periodId,
            employee_id: emp.id,
            component_type: type,
            component_code: code,
            component_name: name,
            amount,
            calculation_details: details,
            created_by: userId
          });
        }
      };

      // Fixed Earnings
      addLine('earning', 'BASE_SALARY', 'Gaji Pokok', baseSalary);
      addLine('earning', 'POSITION_ALLOWANCE', 'Tunjangan Jabatan', posAllow);
      addLine('earning', 'ADDITIONAL_ALLOWANCE', 'Tunjangan Tambahan', addAllow);
      addLine('earning', 'QUOTA_ALLOWANCE', 'Tunjangan Kuota', quotaAllow);
      addLine('earning', 'EDUCATION_ALLOWANCE', 'Tunjangan Pendidikan', eduAllow);
      addLine('earning', 'TRANSPORT_MEAL', 'Transport & Makan', tmAllow);
      addLine('earning', 'FIELD_ALLOWANCE', 'Tunjangan Lapangan', fieldAllow);
      addLine('earning', 'COMM_ALLOWANCE', 'Tunjangan Komunikasi', commAllow);

      // Overtime
      const { data: otData } = await payrollRepo.findOvertimeData(dbClient, emp.id, period.period_start, period.period_end);
      const otTotal = otData?.reduce((sum, ot) => sum + (ot.amount_earned || 0), 0) || 0;
      addLine('earning', 'OVERTIME', 'Lembur', otTotal, { count: otData?.length || 0 });

      // Point System Engine (Late Deductions & Performance Adjustments)
      const { data: adjData } = await calculateMonthlyAdjustments(dbClient, emp.id, period.month, period.year);
      
      let lateDeduction = 0;
      let pointDeduction = 0;
      let targetPoints = 0;
      let actualPoints = 0;
      let pointShortage = 0;

      if (adjData) {
        for (const adj of adjData) {
          if (adj.type === 'late_deduction') {
            lateDeduction = adj.amount;
            addLine('deduction', 'LATE_DEDUCTION', 'Potongan Telat', lateDeduction, { details: adj.details });
          } else if (adj.type === 'performance_deduction') {
            pointDeduction = adj.amount;
            // Extract details if possible (simplified for now as we don't have a complex parser)
            addLine('deduction', 'POINT_SHORTAGE', 'Potongan Kekurangan Poin', pointDeduction, { details: adj.details });
          } else if (adj.type === 'performance_bonus') {
            addLine('earning', 'POINT_BONUS', 'Bonus Prestasi Poin', adj.amount, { details: adj.details });
          }
        }
      }

      // We still need raw performance data for the summary table
      const { data: perf } = await dbClient.from('employees').select('target_monthly_points').eq('id', emp.id).single();
      targetPoints = perf?.target_monthly_points || 0;
      
      // Calculate actual points for the period
      const { data: points } = await dbClient
        .from('work_order_assignments')
        .select('points_earned')
        .eq('employee_id', emp.id)
        .gte('created_at', period.period_start)
        .lte('created_at', period.period_end);
      
      actualPoints = points?.reduce((sum, p) => sum + (p.points_earned || 0), 0) || 0;
      pointShortage = Math.max(0, targetPoints - actualPoints);

      // BPJS
      if (emp.is_bpjs_enrolled) {
        addLine('deduction', 'BPJS', 'BPJS Ketenagakerjaan', bpjsAmount);
      }

      // Adjustments
      const { data: adjs } = await payrollRepo.findAdjustments(dbClient, emp.id, periodId);
      for (const adj of (adjs || [])) {
        addLine(adj.adjustment_type === 'bonus' ? 'earning' : 'deduction', `MANUAL_${adj.id.slice(0, 8).toUpperCase()}`, adj.reason, adj.amount);
      }

      // Summarize
      const empLines = lineItems.filter(l => l.employee_id === emp.id);
      const gross = empLines.filter(l => l.component_type === 'earning').reduce((s, l) => s + l.amount, 0);
      const deds = empLines.filter(l => l.component_type === 'deduction').reduce((s, l) => s + l.amount, 0);
      const thp = Math.max(0, gross - deds);

      summaries.push({
        payroll_period_id: periodId,
        employee_id: emp.id,
        gross_earnings: gross,
        total_deductions: deds,
        take_home_pay: thp,
        target_points: targetPoints,
        actual_points: actualPoints,
        point_shortage: pointShortage,
        days_present: daysPresent,
        days_late: daysLate,
        days_absent: daysAbsent,
        overtime_amount: otTotal,
        updated_at: new Date().toISOString()
      });
    }

    // ── Step 5 & 6: Data sync ──
    await payrollRepo.deleteLineItems(dbClient, periodId);
    if (lineItems.length > 0) {
      const { error: lineErr } = await payrollRepo.insertLineItems(dbClient, lineItems);
      if (lineErr) throw new Error(`Line items insert failed: ${lineErr.message}`);
    }

    const { error: sumErr } = await payrollRepo.upsertSummaries(dbClient, summaries);
    if (sumErr) throw new Error(`Summaries upsert failed: ${sumErr.message}`);

    // ── Step 7: Finalize ──
    await payrollRepo.updatePeriod(dbClient, periodId, {
      status: 'calculated',
      calculated_at: new Date().toISOString()
    });

    return ok({
      message: `Payroll calculated for ${employees.length} employees`,
      employee_count: employees.length,
      period_id: periodId
    });

  } catch (err) {
    await payrollRepo.updatePeriod(dbClient, periodId, { status: 'draft' });
    console.error('[PayrollService] Error:', err);
    return serverError(err.message || 'Payroll calculation failed');
  }
}
