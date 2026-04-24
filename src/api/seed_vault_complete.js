/**
 * seed_vault_complete.js — Project B (Vault) Seeder
 * SiFatih — Run AFTER seed_complete.sql has been applied to Project A
 *
 * Usage: node src/api/seed_vault_complete.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const urlA = process.env.SUPABASE_URL_A;
const keyA = process.env.SUPABASE_SERVICE_ROLE_KEY_A;
const urlB = process.env.SUPABASE_URL_B;
const keyB = process.env.SUPABASE_SERVICE_ROLE_KEY_B;

if (!urlA || !keyA || !urlB || !keyB) {
  console.error('❌ Missing env: SUPABASE_URL_A, SUPABASE_SERVICE_ROLE_KEY_A, SUPABASE_URL_B, SUPABASE_SERVICE_ROLE_KEY_B');
  process.exit(1);
}

const supaA = createClient(urlA, keyA);
const supaB = createClient(urlB, keyB);

// ── helpers ──────────────────────────────────────────────────────────────────
function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function err(msg) { console.error(`❌ ${msg}`); }

async function insertB(table, rows, label) {
  if (!rows.length) { log(`⚠️  ${label}: 0 rows, skipping`); return; }
  const { error } = await supaB.from(table).insert(rows);
  if (error) err(`${label}: ${error.message}`);
  else log(`✅ ${label}: ${rows.length} rows inserted into ${table}`);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function addHours(dateStr, h) {
  const d = new Date(dateStr);
  d.setHours(d.getHours() + h);
  return d.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  log('📡 Fetching reference data from Project A...');

  const { data: employees } = await supaA.from('employees').select('id, name, employee_id, position, status');
  const { data: workOrders } = await supaA.from('work_orders').select('id, title, status, claimed_by, points, completed_at, created_at, type_id');
  const { data: assignments } = await supaA.from('work_order_assignments').select('work_order_id, employee_id, points_earned, assignment_role');
  const { data: customers } = await supaA.from('customers').select('id, customer_code, packet, install_date, billing_due_day');

  if (!employees?.length || !workOrders?.length) {
    err('Project A data not found. Run seed_complete.sql first.'); process.exit(1);
  }

  const getEmpId  = (name) => employees.find(e => e.name === name)?.id;
  const getWoId   = (title) => workOrders.find(w => w.title === title)?.id;

  const activeEmps = employees.filter(e => e.status === 'Aktif' && ['TECH','SPV_TECH','ADM','TREASURER'].some(pos => e.position.includes(pos) || ['Teknisi','SPV Teknisi','Admin','Bendahara'].includes(e.position)));
  const techEmps   = employees.filter(e => ['Teknisi','SPV Teknisi'].includes(e.position) && e.status === 'Aktif');
  log(`👷 ${techEmps.length} active tech/SPV employees found`);

  // ────────────────────────────────────────────
  // 1. SALARY CONFIGS (Project B)
  // ────────────────────────────────────────────
  const salaryConfigs = activeEmps.map(emp => ({
    employee_id:            emp.id,
    position_allowance:     emp.position === 'SPV Teknisi' ? 1500000 : emp.position === 'Teknisi' ? 1000000 : emp.position === 'Bendahara' ? 2000000 : 800000,
    additional_allowance:   500000,
    quota_allowance:        emp.position.includes('Teknisi') ? 150000 : 0,
    education_allowance:    200000,
    transport_meal_allowance: emp.position.includes('Teknisi') ? 600000 : 300000,
    bpjs_company_contribution: 250000,
    effective_from:         '2025-10-01',
    effective_to:           null
  }));
  await insertB('employee_salary_configs', salaryConfigs, 'Salary Configs');

  // ────────────────────────────────────────────
  // 2. PAYROLL PERIODS (Oct 2025 – Mar 2026)
  // ────────────────────────────────────────────
  const periods = [
    { year: 2025, month: 10, period_start: '2025-10-01', period_end: '2025-10-31', status: 'finalized' },
    { year: 2025, month: 11, period_start: '2025-11-01', period_end: '2025-11-30', status: 'finalized' },
    { year: 2025, month: 12, period_start: '2025-12-01', period_end: '2025-12-31', status: 'finalized' },
    { year: 2026, month:  1, period_start: '2026-01-01', period_end: '2026-01-31', status: 'finalized' },
    { year: 2026, month:  2, period_start: '2026-02-01', period_end: '2026-02-28', status: 'finalized' },
    { year: 2026, month:  3, period_start: '2026-03-01', period_end: '2026-03-31', status: 'draft'     },
  ];
  const { data: insertedPeriods, error: pe } = await supaB.from('payroll_periods').insert(periods).select();
  if (pe) { err('payroll_periods: ' + pe.message); }
  else log(`✅ payroll_periods: ${insertedPeriods.length} rows inserted`);

  // ────────────────────────────────────────────
  // 3. PAYROLL SUMMARIES + LINE ITEMS
  // ────────────────────────────────────────────
  const summaries = [];
  const lineItems = [];

  if (insertedPeriods) {
    for (const period of insertedPeriods) {
      // points earned by each employee this month
      const monthStr = `${period.year}-${String(period.month).padStart(2,'0')}`;
      const monthWos = workOrders.filter(wo => {
        if (!wo.completed_at) return false;
        return wo.completed_at.startsWith(monthStr);
      });
      const monthAssignments = assignments.filter(a => monthWos.some(wo => wo.id === a.work_order_id));

      for (const emp of activeEmps) {
        const cfg = salaryConfigs.find(c => c.employee_id === emp.id);
        if (!cfg) continue;

        const empPoints = monthAssignments.filter(a => a.employee_id === emp.id).reduce((s, a) => s + (a.points_earned || 0), 0);
        const pointBonus = empPoints * 5000; // 5000 IDR per point

        const baseAllowances = cfg.position_allowance + cfg.additional_allowance + cfg.quota_allowance + cfg.education_allowance + cfg.transport_meal_allowance;
        const bpjsEmployee   = 90000;
        const grossEarnings  = baseAllowances + pointBonus;
        const totalDeductions = bpjsEmployee;
        const takeHomePay    = grossEarnings - totalDeductions;

        summaries.push({
          payroll_period_id: period.id,
          employee_id:       emp.id,
          gross_earnings:    grossEarnings,
          total_deductions:  totalDeductions,
          take_home_pay:     takeHomePay,
        });

        lineItems.push(
          { payroll_period_id: period.id, employee_id: emp.id, item_type: 'allowance', description: 'Tunjangan Jabatan',        amount: cfg.position_allowance },
          { payroll_period_id: period.id, employee_id: emp.id, item_type: 'allowance', description: 'Tunjangan Tambahan',      amount: cfg.additional_allowance },
          { payroll_period_id: period.id, employee_id: emp.id, item_type: 'allowance', description: 'Tunjangan Kuota',         amount: cfg.quota_allowance },
          { payroll_period_id: period.id, employee_id: emp.id, item_type: 'allowance', description: 'Tunjangan Pendidikan',    amount: cfg.education_allowance },
          { payroll_period_id: period.id, employee_id: emp.id, item_type: 'allowance', description: 'Tunjangan Transport/Makan', amount: cfg.transport_meal_allowance },
          ...(pointBonus > 0 ? [{ payroll_period_id: period.id, employee_id: emp.id, item_type: 'bonus', description: `Bonus Poin ${empPoints}pts`, amount: pointBonus }] : []),
          { payroll_period_id: period.id, employee_id: emp.id, item_type: 'deduction', description: 'BPJS Karyawan',          amount: -bpjsEmployee }
        );
      }
    }
    await insertB('payroll_summaries', summaries, 'Payroll Summaries');
    await insertB('payroll_line_items', lineItems, 'Payroll Line Items');
  }

  // ────────────────────────────────────────────
  // 4. ATTENDANCE RECORDS (6 months)
  // ────────────────────────────────────────────
  const attendance = [];
  const monthDefs = [
    { y: 2025, m: 10, days: 31 }, { y: 2025, m: 11, days: 30 }, { y: 2025, m: 12, days: 31 },
    { y: 2026, m:  1, days: 31 }, { y: 2026, m:  2, days: 28 }, { y: 2026, m:  3, days: 31 },
  ];

  for (const { y, m, days } of monthDefs) {
    for (const emp of activeEmps) {
      for (let d = 1; d <= days; d++) {
        const date = new Date(y, m - 1, d);
        if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends
        const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const rand = Math.random();
        const status = rand < 0.03 ? 'absent' : rand < 0.10 ? 'late' : 'present';
        const checkIn  = status === 'absent' ? null : `${dateStr}T${status === 'late' ? '08:30:00' : '07:55:00'}+07:00`;
        const checkOut = status === 'absent' ? null : `${dateStr}T17:05:00+07:00`;
        attendance.push({ employee_id: emp.id, check_in: checkIn, check_out: checkOut, status });
      }
    }
  }
  // Insert in batches of 500 to avoid payload limits
  for (let i = 0; i < attendance.length; i += 500) {
    await insertB('attendance_records', attendance.slice(i, i + 500), `Attendance batch ${i/500+1}`);
  }

  // ────────────────────────────────────────────
  // 5. OVERTIME RECORDS
  // ────────────────────────────────────────────
  const overtimes = [];
  for (const { y, m } of monthDefs) {
    for (const emp of techEmps) {
      // 4 overtime days per tech per month
      for (let week = 1; week <= 4; week++) {
        const day = week * 7 - 1;
        if (day > 28) continue;
        const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        overtimes.push({ employee_id: emp.id, date: dateStr, hours: (2 + Math.random()).toFixed(1), status: 'approved' });
      }
    }
  }
  await insertB('overtime_records', overtimes, 'Overtime Records');

  // ────────────────────────────────────────────
  // 6. TECHNICIAN POINTS LEDGER
  // ────────────────────────────────────────────
  const pointsLedger = assignments
    .filter(a => a.points_earned > 0)
    .map(a => {
      const wo = workOrders.find(w => w.id === a.work_order_id);
      return {
        employee_id:   a.employee_id,
        work_order_id: a.work_order_id,
        points:        a.points_earned,
        description:   wo ? `${a.assignment_role === 'lead' ? 'Lead' : 'Member'}: ${wo.title}` : 'Work order completed',
        created_at:    wo?.completed_at || new Date().toISOString(),
      };
    });
  await insertB('technician_points_ledger', pointsLedger, 'Points Ledger');

  // ────────────────────────────────────────────
  // 7. CUSTOMER BILLS — Project B (6 months)
  // ────────────────────────────────────────────
  const bills = [];
  const installMonths = [
    { date: '2025-10-01' }, { date: '2025-11-01' }, { date: '2025-12-01' },
    { date: '2026-01-01' }, { date: '2026-02-01' }, { date: '2026-03-01' },
  ];
  const priceMap = {
    'Paket Hemat 15Mbps':    166000,
    'Paket Rumahan 20Mbps':  175000,
    'Paket Plus 25Mbps':     200000,
    'Paket Prima 35Mbps':    250000,
    'Paket Unggulan 50Mbps': 350000,
  };

  for (const { date: periodStr } of installMonths) {
    for (const cust of customers) {
      if (new Date(cust.install_date) > new Date(periodStr)) continue;
      const amount = priceMap[cust.packet] || 175000;
      const isPaid = periodStr < '2026-03-01' || Math.random() > 0.3;
      bills.push({
        customer_id:  cust.id,
        period_date:  periodStr,
        amount,
        status:       isPaid ? 'paid' : 'unpaid',
        paid_at:      isPaid ? new Date(new Date(periodStr).setDate(12)).toISOString() : null,
      });
    }
  }
  await insertB('customer_bills', bills, 'Customer Bills (B)');

  // ────────────────────────────────────────────
  // 8. FINANCIAL TRANSACTIONS — Project B (high-volume)
  // ────────────────────────────────────────────
  const finances = [];
  for (const { y, m } of monthDefs) {
    const mStr = `${y}-${String(m).padStart(2,'0')}`;
    const custCount = customers.filter(c => new Date(c.install_date) <= new Date(`${mStr}-28`)).length;
    finances.push(
      { transaction_date: `${mStr}-05`, type: 'income',  category: 'Tagihan Internet',   description: `Penerimaan tagihan internet ${mStr}`, amount: Math.round(custCount * 210000 * 0.85) },
      { transaction_date: `${mStr}-12`, type: 'income',  category: 'Tagihan Internet',   description: `Penerimaan susulan ${mStr}`,           amount: Math.round(custCount * 210000 * 0.10) },
      { transaction_date: `${mStr}-08`, type: 'income',  category: 'Pemasangan Baru',    description: `Biaya PSB ${mStr}`,                   amount: 500000 },
      { transaction_date: `${mStr}-01`, type: 'expense', category: 'Gaji Karyawan',      description: `Gaji karyawan ${mStr}`,               amount: 15000000 },
      { transaction_date: `${mStr}-03`, type: 'expense', category: 'Operasional Kantor', description: `Listrik & internet ${mStr}`,           amount: 1500000 },
      { transaction_date: `${mStr}-07`, type: 'expense', category: 'Pembelian Stok',     description: `Material FO ${mStr}`,                 amount: 3500000 },
      { transaction_date: `${mStr}-10`, type: 'expense', category: 'Transportasi',       description: `Bensin teknisi ${mStr}`,              amount: 800000 },
    );
  }
  await insertB('financial_transactions', finances, 'Financial Transactions (B)');

  // ────────────────────────────────────────────
  // 9. VERIFICATION SUMMARY
  // ────────────────────────────────────────────
  log('\n📊 Project B Verification:');
  const tables = [
    'employee_salary_configs', 'payroll_periods', 'payroll_summaries',
    'payroll_line_items', 'attendance_records', 'overtime_records',
    'technician_points_ledger', 'customer_bills', 'financial_transactions'
  ];
  for (const t of tables) {
    const { count } = await supaB.from(t).select('*', { count: 'exact', head: true });
    log(`  ${t}: ${count} rows`);
  }

  log('\n✅ Project B Seeding Completed.');
}

main().catch(e => { console.error(e); process.exit(1); });
