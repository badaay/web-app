-- Seeder for Point System & Payroll Test Data
-- This script populates employees, salary configs, rules, and sample activity

-- 1. Ensure Roles exist (just in case)
INSERT INTO public.roles (name, code)
VALUES 
    ('Super Admin', 'S_ADM'),
    ('Owner', 'OWNER'),
    ('Bendahara', 'TREASURER'),
    ('Supervisor Teknisi', 'SPV_TECH'),
    ('Teknisi', 'TECH')
ON CONFLICT (code) DO NOTHING;

-- 2. Seed Employees (Technicians)
-- Using hardcoded IDs for consistency in this seed script
INSERT INTO public.employees (id, employee_id, name, position, status, join_date, target_monthly_points)
VALUES 
    ('e1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'TECH001', 'Budi Teknisi', 'Teknisi Junior', 'Aktif', '2024-01-01', 500),
    ('e2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'TECH002', 'Ani Teknisi', 'Teknisi Senior', 'Aktif', '2024-01-01', 800),
    ('e3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'TECH003', 'Catur Teknisi', 'Teknisi Junior', 'Aktif', '2024-02-01', 500)
ON CONFLICT (employee_id) DO UPDATE SET
    target_monthly_points = EXCLUDED.target_monthly_points;

-- 3. Seed Point Conversion Rules
INSERT INTO public.point_conversion_rules (rule_name, rule_type, trigger_metric, trigger_unit, amount_per_unit, is_multiplier)
VALUES
    ('Potongan Terlambat (15m)', 'deduction', 'minutes_late', 15, 25000, true),
    ('Penalti Kurang Poin', 'deduction', 'points_shortage', 1, 1000, true),
    ('Bonus Prestasi (Kelipatan 100)', 'addition', 'points_earned', 100, 50000, true)
ON CONFLICT DO NOTHING;

-- 4. Seed Employee Salary Configurations
INSERT INTO public.employee_salary_configs (
    employee_id, 
    position_allowance, 
    additional_allowance, 
    quota_allowance, 
    education_allowance, 
    transport_meal_allowance,
    field_allowance,
    communication_allowance
)
VALUES
    ('e1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 200000, 100000, 50000, 0, 300000, 150000, 50000),
    ('e2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 500000, 200000, 100000, 100000, 300000, 250000, 100000),
    ('e3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 200000, 50000, 50000, 0, 300000, 150000, 50000)
ON CONFLICT (employee_id) DO UPDATE SET
    field_allowance = EXCLUDED.field_allowance,
    communication_allowance = EXCLUDED.communication_allowance;

-- 5. Seed Sample Attendance Records (Current Month)
-- Assuming we are in May 2026 for testing purposes
INSERT INTO public.attendance_records (employee_id, attendance_date, clock_in, clock_out, late_minutes, is_absent)
VALUES
    ('e1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2026-05-01', '08:45:00', '17:00:00', 45, false), -- Late 45m (3 units of 15m)
    ('e1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2026-05-02', '08:10:00', '17:00:00', 10, false), -- Late 10m (0 units of 15m)
    ('e2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2026-05-01', '08:00:00', '17:00:00', 0, false),
    ('e2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2026-05-02', '08:05:00', '17:00:00', 5, false)
ON CONFLICT DO NOTHING;

-- 6. Seed Sample Work Orders & Assignments for Point Calculation
-- Create a few closed work orders to see points in payroll
INSERT INTO public.work_orders (id, title, status, created_at, closed_at)
VALUES
    ('w1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Pemasangan PSB Budi', 'closed', '2026-05-01 10:00:00', '2026-05-01 14:00:00'),
    ('w2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Perbaikan Gangguan Ani', 'closed', '2026-05-02 09:00:00', '2026-05-02 11:00:00')
ON CONFLICT DO NOTHING;

INSERT INTO public.work_order_assignments (work_order_id, employee_id, assignment_role, points_earned, bonus_points, deduction_points)
VALUES
    ('w1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'e1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'lead', 100, 0, 0),
    ('w1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'e3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'member', 100, 0, 0),
    ('w2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'e2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'lead', 150, 50, 0)
ON CONFLICT DO NOTHING;
