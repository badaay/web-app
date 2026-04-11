/**
 * POST /api/payroll/calculate
 * Runs the full 10-step payroll calculation pipeline for a payroll period.
 *
 * Body: { period_id: "uuid" }
 *
 * Pipeline:
 *  1. Validate period exists + is 'draft' or 'calculated'
 *  2. Mark period as 'calculating'
 *  3. Fetch all active employees + their salary configs
 *  4. For each employee:
 *     a. Fixed earnings  (base_salary + allowances)
 *     b. Overtime bonus  (from overtime_assignments)
 *     c. Attendance deductions (from attendance_records)
 *     d. Point deduction (via calculate_point_deduction RPC)
 *     e. BPJS deduction
 *     f. Manual adjustments (approved bonuses/deductions)
 *  5. Upsert payroll_line_items
 *  6. Upsert payroll_summaries
 *  7. Mark period as 'calculated', set calculated_at
 */
import { verifyAuth, isAdmin, jsonResponse, errorResponse, withCors, supabaseAdmin } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
    if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

    const { user, error: authErr } = await verifyAuth(req);
    if (authErr) return errorResponse(authErr, 401);

    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) return errorResponse('Forbidden: Admin access required', 403);

    const { period_id } = await req.json();
    if (!period_id) return errorResponse('period_id is required', 400);

    try {
        // ── Step 1: Validate period ─────────────────────────────────────────
        const { data: period, error: periodErr } = await supabaseAdmin
            .from('payroll_periods')
            .select('*')
            .eq('id', period_id)
            .single();

        if (periodErr || !period) return errorResponse('Payroll period not found', 404);
        if (!['draft', 'calculated'].includes(period.status)) {
            return errorResponse(`Cannot recalculate: period status is '${period.status}'`, 409);
        }

        // ── Step 2: Mark as calculating ────────────────────────────────────
        await supabaseAdmin
            .from('payroll_periods')
            .update({ status: 'calculating', updated_at: new Date().toISOString() })
            .eq('id', period_id);

        // ── Step 3: Get settings ────────────────────────────────────────────
        const { data: settings } = await supabaseAdmin
            .from('app_settings')
            .select('setting_key, setting_value')
            .in('setting_key', ['bpjs_fixed_amount']);
        const settingMap = Object.fromEntries(settings.map(s => [s.setting_key, s.setting_value]));
        const bpjsAmount = parseInt(settingMap['bpjs_fixed_amount'] || '194040');

        // ── Step 4: Get all active employees with salary config ─────────────
        // ── Step 4: Get all active employees ─────────────────────────────
        const { data: employees, error: empErr } = await supabaseAdmin
            .from('employees')
            .select(`
                id, name, employee_id, base_salary, target_monthly_points, is_bpjs_enrolled
            `)
            .eq('status', 'Aktif');

        if (empErr) {
            console.error('Employee fetch error:', empErr);
            return errorResponse(`Employee fetch error: ${empErr.message}`, 500);
        }

        if (!employees || employees.length === 0) {
            await supabaseAdmin.from('payroll_periods').update({ status: 'draft' }).eq('id', period_id);
            return errorResponse('No active employees found with status "Aktif"', 404);
        }

        // ── Step 4b: Get salary configs for these employees ──────────────
        const employeeIds = employees.map(e => e.id);
        const { data: configs, error: configErr } = await supabaseAdmin
            .from('employee_salary_configs')
            .select(`
                employee_id, position_allowance, additional_allowance, quota_allowance,
                education_allowance, transport_meal_allowance, bpjs_company_contribution,
                effective_from, effective_to
            `)
            .in('employee_id', employeeIds);

        if (configErr) {
            console.error('Config fetch error:', configErr);
            return errorResponse(`Salary config fetch error: ${configErr.message}`, 500);
        }

        // Map configs to employees
        const employeeMap = employees.map(emp => ({
            ...emp,
            configs: configs?.filter(c => c.employee_id === emp.id) || []
        }));

        const lineItems   = [];
        const summaries   = [];

        for (const emp of employeeMap) {
            // Get active salary config
            const activeConfig = emp.configs?.find(c => {
                const start = new Date(c.effective_from);
                const end   = c.effective_to ? new Date(c.effective_to) : null;
                const periodStart = new Date(period.period_start);
                return start <= periodStart && (!end || end >= periodStart);
            }) || {};

            const baseSalary            = emp.base_salary || 0;
            const positionAllowance     = activeConfig.position_allowance     || 0;
            const additionalAllowance   = activeConfig.additional_allowance   || 0;
            const quotaAllowance        = activeConfig.quota_allowance        || 0;
            const educationAllowance    = activeConfig.education_allowance    || 0;
            const transportMealAllow    = activeConfig.transport_meal_allowance || 0;

            // ── 4a. Fixed earnings items ────────────
            const addLine = (type, code, name, amount, details = null) => {
                if (amount !== 0) {
                    lineItems.push({
                        payroll_period_id: period_id,
                        employee_id: emp.id,
                        component_type: type,
                        component_code: code,
                        component_name: name,
                        amount,
                        calculation_details: details,
                        created_by: user.id
                    });
                }
            };

            addLine('earning', 'BASE_SALARY',        'Gaji Pokok',           baseSalary);
            addLine('earning', 'POSITION_ALLOWANCE',  'Tunjangan Jabatan',    positionAllowance);
            addLine('earning', 'ADDITIONAL_ALLOWANCE','Tunjangan Tambahan',   additionalAllowance);
            addLine('earning', 'QUOTA_ALLOWANCE',     'Tunjangan Kuota',      quotaAllowance);
            addLine('earning', 'EDUCATION_ALLOWANCE', 'Tunjangan Pendidikan', educationAllowance);
            addLine('earning', 'TRANSPORT_MEAL',      'Transport & Makan',    transportMealAllow);

            // ── 4b. Overtime bonus ──────────────────
            const { data: overtimeData } = await supabaseAdmin
                .from('overtime_assignments')
                .select('amount_earned, overtime_records(overtime_date)')
                .eq('employee_id', emp.id)
                .gte('overtime_records.overtime_date', period.period_start)
                .lte('overtime_records.overtime_date', period.period_end);

            const overtimeTotal = overtimeData?.reduce((sum, ot) => sum + (ot.amount_earned || 0), 0) || 0;
            const overtimeHours = 0; // summary only
            addLine('earning', 'OVERTIME', 'Lembur', overtimeTotal, { count: overtimeData?.length || 0 });

            // ── 4c. Attendance deductions ───────────
            const { data: attendanceData } = await supabaseAdmin
                .from('attendance_records')
                .select('deduction_amount, is_absent, late_minutes')
                .eq('employee_id', emp.id)
                .gte('attendance_date', period.period_start)
                .lte('attendance_date', period.period_end);

            const attendanceDeduction = attendanceData?.reduce((sum, r) => sum + (r.deduction_amount || 0), 0) || 0;
            const daysPresent = attendanceData?.filter(r => !r.is_absent).length || 0;
            const daysLate    = attendanceData?.filter(r => r.late_minutes > 0).length || 0;
            const daysAbsent  = attendanceData?.filter(r => r.is_absent).length || 0;
            addLine('deduction', 'LATE_ABSENCE', 'Potongan Telat/Absen', attendanceDeduction, { daysPresent, daysLate, daysAbsent });

            // ── 4d. Point deduction ─────────────────
            const { data: pointData } = await supabaseAdmin.rpc('calculate_point_deduction', {
                p_employee_id: emp.id,
                p_year:  period.year,
                p_month: period.month
            });

            const pointDeduction = pointData?.[0]?.deduction_amount || 0;
            const targetPoints   = pointData?.[0]?.target_points    || 0;
            const actualPoints   = pointData?.[0]?.actual_points    || 0;
            const pointShortage  = pointData?.[0]?.point_shortage   || 0;
            addLine('deduction', 'POINT_SHORTAGE', 'Potongan Kekurangan Poin', pointDeduction, { targetPoints, actualPoints, pointShortage });

            // ── 4e. BPJS deduction ──────────────────
            if (emp.is_bpjs_enrolled) {
                addLine('deduction', 'BPJS', 'BPJS Ketenagakerjaan', bpjsAmount);
            }

            // ── 4f. Manual adjustments ──────────────
            const { data: adjustments } = await supabaseAdmin
                .from('payroll_adjustments')
                .select('*')
                .eq('employee_id', emp.id)
                .eq('payroll_period_id', period_id)
                .eq('status', 'approved');

            for (const adj of (adjustments || [])) {
                addLine(
                    adj.adjustment_type === 'bonus' ? 'earning' : 'deduction',
                    `MANUAL_${adj.id.slice(0,8).toUpperCase()}`,
                    adj.reason,
                    adj.amount
                );
            }

            // ── 4g. Compute totals ──────────────────
            const empLines   = lineItems.filter(l => l.employee_id === emp.id);
            const grossEarnings   = empLines.filter(l => l.component_type === 'earning').reduce((s, l) => s + l.amount, 0);
            const totalDeductions = empLines.filter(l => l.component_type === 'deduction').reduce((s, l) => s + l.amount, 0);
            const takeHomePay     = Math.max(0, grossEarnings - totalDeductions);

            summaries.push({
                payroll_period_id: period_id,
                employee_id: emp.id,
                gross_earnings:   grossEarnings,
                total_deductions: totalDeductions,
                take_home_pay:    takeHomePay,
                target_points:    targetPoints,
                actual_points:    actualPoints,
                point_shortage:   pointShortage,
                days_present:     daysPresent,
                days_late:        daysLate,
                days_absent:      daysAbsent,
                overtime_hours:   overtimeHours,
                overtime_amount:  overtimeTotal,
                updated_at: new Date().toISOString()
            });
        }

        // ── Step 5: Upsert line items ───────────────────────────────────────
        // Delete old items first to support recalculation
        await supabaseAdmin.from('payroll_line_items').delete().eq('payroll_period_id', period_id).eq('is_manual_override', false);
        if (lineItems.length > 0) {
            const { error: lineErr } = await supabaseAdmin.from('payroll_line_items').insert(lineItems);
            if (lineErr) throw new Error(`Line items insert failed: ${lineErr.message}`);
        }

        // ── Step 6: Upsert summaries ────────────────────────────────────────
        const { error: sumErr } = await supabaseAdmin
            .from('payroll_summaries')
            .upsert(summaries, { onConflict: 'payroll_period_id,employee_id' });
        if (sumErr) throw new Error(`Summaries upsert failed: ${sumErr.message}`);

        // ── Step 7: Mark period as calculated ──────────────────────────────
        await supabaseAdmin.from('payroll_periods').update({
            status: 'calculated',
            calculated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }).eq('id', period_id);

        return jsonResponse({
            success: true,
            message: `Payroll calculated for ${employees.length} employees`,
            employee_count: employees.length,
            period_id
        });

    } catch (err) {
        // Reset to draft if calculation fails
        await supabaseAdmin.from('payroll_periods')
            .update({ status: 'draft', updated_at: new Date().toISOString() })
            .eq('id', period_id);
        console.error('Payroll calculation error:', err);
        return errorResponse(err.message || 'Payroll calculation failed', 500);
    }
});
