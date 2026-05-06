-- Migration: 20260505000001_project_a_hr_payroll_schema.sql
-- Purpose: Ensure all HR/Payroll tables have the correct columns,
--          create missing tables, views, and functions.
--
-- STRATEGY: Use ALTER TABLE ADD COLUMN IF NOT EXISTS for tables that
--           may already exist from older vault migrations (20260411, 20260414).
--           Use CREATE TABLE IF NOT EXISTS for genuinely new tables.
--           Use CREATE OR REPLACE VIEW for all views.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. ADD phone COLUMN TO employees
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS phone TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. EMPLOYEE SALARY CONFIGS (new table, does not exist in any prior migration)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.employee_salary_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,

    -- Fixed allowances (monthly, in IDR integer)
    position_allowance INTEGER DEFAULT 0,
    additional_allowance INTEGER DEFAULT 0,
    quota_allowance INTEGER DEFAULT 0,
    education_allowance INTEGER DEFAULT 0,
    transport_meal_allowance INTEGER DEFAULT 0,
    bpjs_company_contribution INTEGER DEFAULT 0,

    -- Effective period
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT valid_effective_period CHECK (effective_to IS NULL OR effective_to >= effective_from),
    UNIQUE (employee_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_employee_salary_configs_employee
    ON public.employee_salary_configs(employee_id);

ALTER TABLE public.employee_salary_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage salary configs" ON public.employee_salary_configs;
CREATE POLICY "Admins manage salary configs"
    ON public.employee_salary_configs FOR ALL
    USING (public.is_admin_class());

DROP POLICY IF EXISTS "Employees view own salary config" ON public.employee_salary_configs;
CREATE POLICY "Employees view own salary config"
    ON public.employee_salary_configs FOR SELECT
    USING (employee_id IN (
        SELECT e.id FROM public.employees e WHERE e.email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    ));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ATTENDANCE RECORDS (may exist from vault schema 20260411 with fewer columns)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns that the code needs but the old vault schema doesn't have
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS attendance_date DATE,
ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_absent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deduction_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Unique constraint for upsert (employee_id, attendance_date)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'attendance_records_employee_id_attendance_date_key'
    ) THEN
        ALTER TABLE public.attendance_records
        ADD CONSTRAINT attendance_records_employee_id_attendance_date_key
        UNIQUE (employee_id, attendance_date);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(attendance_date);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance_records;
CREATE POLICY "Admins manage attendance"
    ON public.attendance_records FOR ALL
    USING (public.is_admin_class());

-- View: v_attendance_records
CREATE OR REPLACE VIEW public.v_attendance_records AS
SELECT
    ar.id,
    ar.employee_id,
    e.name AS employee_name,
    e.employee_id AS employee_code,
    e.position,
    ar.attendance_date,
    ar.check_in,
    ar.check_out,
    ar.late_minutes,
    ar.is_absent,
    ar.deduction_amount,
    ar.created_at
FROM public.attendance_records ar
JOIN public.employees e ON ar.employee_id = e.id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. OVERTIME RECORDS (may exist from vault schema 20260411 with fewer columns)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.overtime_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns the code needs
ALTER TABLE public.overtime_records
ADD COLUMN IF NOT EXISTS overtime_date DATE,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS overtime_type TEXT,
ADD COLUMN IF NOT EXISTS total_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS hourly_rate INTEGER,
ADD COLUMN IF NOT EXISTS total_amount INTEGER,
ADD COLUMN IF NOT EXISTS work_order_id UUID,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_overtime_date ON public.overtime_records(overtime_date);
CREATE INDEX IF NOT EXISTS idx_overtime_employee ON public.overtime_records(employee_id);

ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage overtime" ON public.overtime_records;
CREATE POLICY "Admins manage overtime"
    ON public.overtime_records FOR ALL
    USING (public.is_admin_class());

-- Legacy: overtime_assignments table (new, not in vault)
CREATE TABLE IF NOT EXISTS public.overtime_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overtime_id UUID NOT NULL REFERENCES public.overtime_records(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    amount_earned INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (overtime_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_overtime_assignments_employee ON public.overtime_assignments(employee_id);

ALTER TABLE public.overtime_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage overtime assignments" ON public.overtime_assignments;
CREATE POLICY "Admins manage overtime assignments"
    ON public.overtime_assignments FOR ALL
    USING (public.is_admin_class());

-- View: v_overtime_records_expanded
CREATE OR REPLACE VIEW public.v_overtime_records_expanded AS
SELECT
    otr.id,
    otr.overtime_date,
    otr.start_time,
    otr.end_time,
    otr.description,
    otr.overtime_type,
    otr.total_hours,
    otr.hourly_rate,
    otr.total_amount,
    otr.employee_id,
    e.name AS employee_name,
    e.employee_id AS employee_code,
    e.position AS employee_position,
    otr.work_order_id,
    otr.created_at
FROM public.overtime_records otr
JOIN public.employees e ON otr.employee_id = e.id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. PAYROLL TABLES (may exist from vault schema with fewer columns)
-- ═══════════════════════════════════════════════════════════════════════════════

-- payroll_periods: already created by 20260414000101 with full schema.
-- Just ensure it exists with all columns.
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payroll_periods
ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure UNIQUE constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payroll_periods_year_month_key'
    ) THEN
        ALTER TABLE public.payroll_periods
        ADD CONSTRAINT payroll_periods_year_month_key UNIQUE (year, month);
    END IF;
END $$;

ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage payroll periods" ON public.payroll_periods;
CREATE POLICY "Admins manage payroll periods"
    ON public.payroll_periods FOR ALL
    USING (public.is_admin_class());

-- payroll_line_items (new, not in vault)
CREATE TABLE IF NOT EXISTS public.payroll_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,

    component_type TEXT NOT NULL CHECK (component_type IN ('earning', 'deduction')),
    component_code TEXT NOT NULL,
    component_name TEXT NOT NULL,
    amount INTEGER NOT NULL,

    calculation_details JSONB,
    is_manual_override BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,

    UNIQUE (payroll_period_id, employee_id, component_code)
);

CREATE INDEX IF NOT EXISTS idx_payroll_line_items_period ON public.payroll_line_items(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_line_items_employee ON public.payroll_line_items(employee_id);

ALTER TABLE public.payroll_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage payroll line items" ON public.payroll_line_items;
CREATE POLICY "Admins manage payroll line items"
    ON public.payroll_line_items FOR ALL
    USING (public.is_admin_class());

-- payroll_summaries (exists from vault but with fewer columns)
CREATE TABLE IF NOT EXISTS public.payroll_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    gross_earnings INTEGER NOT NULL DEFAULT 0,
    total_deductions INTEGER NOT NULL DEFAULT 0,
    take_home_pay INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payroll_summaries
ADD COLUMN IF NOT EXISTS target_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS point_shortage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_present INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_late INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_absent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure UNIQUE constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payroll_summaries_payroll_period_id_employee_id_key'
    ) THEN
        ALTER TABLE public.payroll_summaries
        ADD CONSTRAINT payroll_summaries_payroll_period_id_employee_id_key
        UNIQUE (payroll_period_id, employee_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payroll_summaries_period ON public.payroll_summaries(payroll_period_id);

ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage payroll summaries" ON public.payroll_summaries;
CREATE POLICY "Admins manage payroll summaries"
    ON public.payroll_summaries FOR ALL
    USING (public.is_admin_class());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. v_payroll_summaries VIEW
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.v_payroll_summaries AS
SELECT
    ps.id,
    ps.payroll_period_id,
    ps.employee_id,
    e.name AS employee_name,
    e.employee_id AS employee_code,
    e.position AS employee_position,
    e.bank_name,
    e.bank_account_number,
    e.bank_account_name,
    ps.gross_earnings,
    ps.total_deductions,
    ps.take_home_pay,
    ps.target_points,
    ps.actual_points,
    ps.point_shortage,
    ps.days_present,
    ps.days_late,
    ps.days_absent,
    ps.overtime_hours,
    ps.overtime_amount,
    ps.created_at,
    ps.updated_at
FROM public.payroll_summaries ps
JOIN public.employees e ON ps.employee_id = e.id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6.5 FINANCIAL TABLES HARDENING
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    account_number TEXT,
    account_holder TEXT,
    is_active BOOLEAN DEFAULT true,
    current_balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. v_financial_recap VIEW
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.v_financial_recap AS
SELECT
    ft.id,
    ft.transaction_date,
    ft.type,
    ft.category,
    ft.description,
    ft.amount,
    ft.payment_method,
    ft.reference_id,
    ft.bank_account_id,
    ba.name AS bank_name,
    ft.is_verified,
    ft.created_at
FROM public.financial_transactions ft
LEFT JOIN public.bank_accounts ba ON ft.bank_account_id = ba.id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function: Calculate late deduction
CREATE OR REPLACE FUNCTION public.calculate_late_deduction(
    p_check_in_time TIME,
    p_is_absent BOOLEAN DEFAULT false
) RETURNS INTEGER AS $$
DECLARE
    v_work_start TIME;
    v_rate_per_hour INTEGER;
    v_max_daily INTEGER;
    v_late_minutes INTEGER;
    v_deduction INTEGER;
BEGIN
    IF p_is_absent THEN
        SELECT COALESCE(setting_value::INTEGER, 20000)
        INTO v_max_daily
        FROM public.app_settings
        WHERE setting_key = 'late_max_daily';
        RETURN COALESCE(v_max_daily, 20000);
    END IF;

    IF p_check_in_time IS NULL THEN
        RETURN 0;
    END IF;

    SELECT COALESCE(setting_value, '08:00')::TIME
    INTO v_work_start
    FROM public.app_settings
    WHERE setting_key = 'work_start_time';
    v_work_start := COALESCE(v_work_start, '08:00'::TIME);

    SELECT COALESCE(setting_value::INTEGER, 20000)
    INTO v_rate_per_hour
    FROM public.app_settings
    WHERE setting_key = 'late_rate_per_hour';
    v_rate_per_hour := COALESCE(v_rate_per_hour, 20000);

    SELECT COALESCE(setting_value::INTEGER, 20000)
    INTO v_max_daily
    FROM public.app_settings
    WHERE setting_key = 'late_max_daily';
    v_max_daily := COALESCE(v_max_daily, 20000);

    v_late_minutes := EXTRACT(EPOCH FROM (p_check_in_time - v_work_start)) / 60;

    IF v_late_minutes <= 0 THEN
        RETURN 0;
    END IF;

    v_deduction := ROUND(v_rate_per_hour * (v_late_minutes::NUMERIC / 60));
    RETURN LEAST(v_deduction, v_max_daily);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get active salary config
CREATE OR REPLACE FUNCTION public.get_active_salary_config(
    p_employee_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE
) RETURNS SETOF public.employee_salary_configs AS $$
    SELECT *
    FROM public.employee_salary_configs
    WHERE employee_id = p_employee_id
    AND effective_from <= p_as_of_date
    AND (effective_to IS NULL OR effective_to >= p_as_of_date)
    ORDER BY effective_from DESC
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function: Calculate point deduction (CORRECT VERSION for repository)
CREATE OR REPLACE FUNCTION public.calculate_point_deduction(
    p_employee_id UUID,
    p_year INTEGER,
    p_month INTEGER
) RETURNS TABLE (
    target_points INTEGER,
    actual_points INTEGER,
    point_shortage INTEGER,
    deduction_amount INTEGER
) AS $$
DECLARE
    v_target_points INTEGER;
    v_actual_points INTEGER;
    v_rate_per_point INTEGER;
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
BEGIN
    -- 1. Get target points from employee record
    SELECT COALESCE(target_monthly_points, 0)
    INTO v_target_points
    FROM public.employees
    WHERE id = p_employee_id;

    -- 2. Get rate from settings
    SELECT COALESCE(setting_value::INTEGER, 11600)
    INTO v_rate_per_point
    FROM public.app_settings
    WHERE setting_key = 'point_rate_per_unit';

    -- 3. Calculate date range
    v_start_date := make_timestamptz(p_year, p_month, 1, 0, 0, 0);
    v_end_date := (v_start_date + interval '1 month') - interval '1 second';

    -- 4. Sum points from ledger
    SELECT COALESCE(SUM(points), 0)
    INTO v_actual_points
    FROM public.technician_points_ledger
    WHERE employee_id = p_employee_id
    AND created_at BETWEEN v_start_date AND v_end_date;

    -- 5. Return results
    target_points := v_target_points;
    actual_points := v_actual_points;
    point_shortage := CASE WHEN v_actual_points < v_target_points THEN v_target_points - v_actual_points ELSE 0 END;
    deduction_amount := point_shortage * v_rate_per_point;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. SEED PAYROLL SETTINGS
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO public.app_settings (setting_key, setting_value, setting_group, description) VALUES
('work_start_time', '08:00', 'payroll', 'Jam masuk kerja standar'),
('late_rate_per_hour', '20000', 'payroll', 'Potongan telat per jam (IDR)'),
('late_max_daily', '20000', 'payroll', 'Maksimal potongan telat/absen per hari (IDR)'),
('point_rate_per_unit', '11600', 'payroll', 'Nilai rupiah per 1 poin kekurangan (IDR)'),
('bpjs_fixed_amount', '194040', 'payroll', 'Potongan tetap BPJS Ketenagakerjaan (IDR)')
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════════
