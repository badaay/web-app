-- =============================================================
-- PHASE 2: Payment & Payroll Schema Migration
-- Covers migrations 020 through 026
-- Run in Supabase SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────
-- MIGRATION 020: Employee Table Extensions
-- ─────────────────────────────────────────────
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS base_salary INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_bpjs_enrolled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_monthly_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- ─────────────────────────────────────────────
-- MIGRATION 021: App Settings — Salary Config
-- ─────────────────────────────────────────────
INSERT INTO public.app_settings (setting_key, setting_value, setting_group, description) VALUES
('work_start_time',        '08:00',   'payroll', 'Daily work start time for attendance tracking'),
('late_rate_per_hour',     '20000',   'payroll', 'Deduction rate per hour of lateness (IDR)'),
('late_max_daily',         '20000',   'payroll', 'Maximum daily late deduction (IDR)'),
('overtime_start_time',    '16:30',   'payroll', 'Overtime starts after this time'),
('overtime_rate_per_hour', '10000',   'payroll', 'Overtime pay rate per hour (IDR)'),
('point_deduction_rate',   '11600',   'payroll', 'Deduction per point below monthly target (IDR)'),
('bpjs_fixed_amount',      '194040',  'payroll', 'Fixed BPJS Ketenagakerjaan deduction amount (IDR)')
ON CONFLICT (setting_key) DO NOTHING;

-- ─────────────────────────────────────────────
-- MIGRATION 022: Employee Salary Configs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_salary_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,

    -- Fixed monthly allowances
    position_allowance       INTEGER DEFAULT 0,
    additional_allowance     INTEGER DEFAULT 0,
    quota_allowance          INTEGER DEFAULT 0,
    education_allowance      INTEGER DEFAULT 0,
    transport_meal_allowance INTEGER DEFAULT 0,
    bpjs_company_contribution INTEGER DEFAULT 0,

    -- Effective period
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to   DATE,   -- NULL = currently active

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT valid_effective_period CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_employee_salary_configs_employee  ON public.employee_salary_configs(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salary_configs_effective ON public.employee_salary_configs(effective_from, effective_to);

ALTER TABLE public.employee_salary_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage salary configs" ON public.employee_salary_configs
    FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

CREATE POLICY "Employees can view own salary config" ON public.employee_salary_configs
    FOR SELECT USING (employee_id = auth.uid());

-- ─────────────────────────────────────────────
-- MIGRATION 023: Attendance Records
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,

    attendance_date DATE NOT NULL,
    check_in_time   TIME,
    check_out_time  TIME,

    -- Lateness
    late_minutes     INTEGER DEFAULT 0,
    is_absent        BOOLEAN DEFAULT false,
    deduction_amount INTEGER DEFAULT 0,

    -- Source
    source      TEXT DEFAULT 'manual',   -- 'manual' | 'imported' | 'fingerprint'
    external_id TEXT,
    notes       TEXT,

    -- Audit
    created_at  TIMESTAMPTZ DEFAULT now(),
    created_by  UUID REFERENCES public.employees(id),
    updated_at  TIMESTAMPTZ DEFAULT now(),

    UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date     ON public.attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_month    ON public.attendance_records(employee_id, DATE_TRUNC('month', attendance_date));

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attendance" ON public.attendance_records
    FOR ALL USING (
        public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH'])
    ) WITH CHECK (
        public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH'])
    );

CREATE POLICY "Employees can view own attendance" ON public.attendance_records
    FOR SELECT USING (employee_id = auth.uid());

-- ─────────────────────────────────────────────
-- MIGRATION 024: Overtime Records + Assignments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.overtime_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    overtime_date DATE NOT NULL,
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,

    description   TEXT NOT NULL,
    overtime_type TEXT,   -- 'psb' | 'backbone' | 'repair' | 'cable_pull' | 'other'

    total_hours  DECIMAL(5,2) NOT NULL,
    hourly_rate  INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,

    work_order_id UUID REFERENCES public.work_orders(id),

    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_overtime_date       ON public.overtime_records(overtime_date);
CREATE INDEX IF NOT EXISTS idx_overtime_work_order ON public.overtime_records(work_order_id);

ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view overtime" ON public.overtime_records
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage overtime" ON public.overtime_records
    FOR ALL USING (
        public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH'])
    ) WITH CHECK (
        public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH'])
    );

-- Per-technician overtime assignments
CREATE TABLE IF NOT EXISTS public.overtime_assignments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overtime_id  UUID NOT NULL REFERENCES public.overtime_records(id) ON DELETE CASCADE,
    employee_id  UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,

    amount_earned INTEGER NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE (overtime_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_overtime_assignments_employee ON public.overtime_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_assignments_overtime ON public.overtime_assignments(overtime_id);

ALTER TABLE public.overtime_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own overtime assignments" ON public.overtime_assignments
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage overtime assignments" ON public.overtime_assignments
    FOR ALL USING (
        public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH'])
    ) WITH CHECK (
        public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH'])
    );

-- ─────────────────────────────────────────────
-- MIGRATION 025: Payroll Tables
-- ─────────────────────────────────────────────

-- Payroll Periods (monthly scope)
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    year  INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    period_start DATE NOT NULL,
    period_end   DATE NOT NULL,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','calculating','calculated','approved','paid')),

    calculated_at TIMESTAMPTZ,
    approved_at   TIMESTAMPTZ,
    paid_at       TIMESTAMPTZ,
    approved_by   UUID REFERENCES public.employees(id),

    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE (year, month),
    CONSTRAINT valid_period_dates CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON public.payroll_periods(status);

ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view payroll periods" ON public.payroll_periods
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage payroll periods" ON public.payroll_periods
    FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- Payroll Line Items (itemized components)
CREATE TABLE IF NOT EXISTS public.payroll_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id       UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,

    component_type TEXT NOT NULL CHECK (component_type IN ('earning','deduction')),
    component_code TEXT NOT NULL,
    component_name TEXT NOT NULL,
    amount         INTEGER NOT NULL,

    calculation_details JSONB,
    is_manual_override  BOOLEAN DEFAULT false,
    override_reason     TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE (payroll_period_id, employee_id, component_code)
);

CREATE INDEX IF NOT EXISTS idx_payroll_items_period    ON public.payroll_line_items(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee  ON public.payroll_line_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_component ON public.payroll_line_items(component_code);

ALTER TABLE public.payroll_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own payroll items" ON public.payroll_line_items
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage payroll items" ON public.payroll_line_items
    FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- Payroll Summaries (pre-calculated totals per employee/period)
CREATE TABLE IF NOT EXISTS public.payroll_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id       UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,

    -- Totals
    gross_earnings   INTEGER NOT NULL DEFAULT 0,
    total_deductions INTEGER NOT NULL DEFAULT 0,
    take_home_pay    INTEGER NOT NULL DEFAULT 0,

    -- Points
    target_points INTEGER DEFAULT 0,
    actual_points INTEGER DEFAULT 0,
    point_shortage INTEGER DEFAULT 0,

    -- Attendance
    days_present INTEGER DEFAULT 0,
    days_late    INTEGER DEFAULT 0,
    days_absent  INTEGER DEFAULT 0,

    -- Overtime
    overtime_hours  DECIMAL(5,2) DEFAULT 0,
    overtime_amount INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE (payroll_period_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_summary_period   ON public.payroll_summaries(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_summary_employee ON public.payroll_summaries(employee_id);

ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own payroll summary" ON public.payroll_summaries
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage payroll summaries" ON public.payroll_summaries
    FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- Payroll Adjustments (manual bonuses/deductions)
CREATE TABLE IF NOT EXISTS public.payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id       UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,

    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('bonus','deduction')),
    amount          INTEGER NOT NULL CHECK (amount > 0),
    reason          TEXT NOT NULL,

    requested_by UUID REFERENCES public.employees(id),
    approved_by  UUID REFERENCES public.employees(id),
    approved_at  TIMESTAMPTZ,
    status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),

    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adjustments_period   ON public.payroll_adjustments(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_employee ON public.payroll_adjustments(employee_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_status   ON public.payroll_adjustments(status);

ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own adjustments" ON public.payroll_adjustments
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage adjustments" ON public.payroll_adjustments
    FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- ─────────────────────────────────────────────
-- MIGRATION 026: Salary Calculation Functions
-- ─────────────────────────────────────────────

-- 1. Calculate Late Deduction
CREATE OR REPLACE FUNCTION public.calculate_late_deduction(
    p_check_in_time TIME,
    p_is_absent BOOLEAN DEFAULT false
) RETURNS INTEGER AS $$
DECLARE
    v_work_start     TIME;
    v_rate_per_hour  INTEGER;
    v_max_daily      INTEGER;
    v_late_minutes   INTEGER;
    v_deduction      INTEGER;
BEGIN
    SELECT setting_value::TIME    INTO v_work_start    FROM public.app_settings WHERE setting_key = 'work_start_time';
    SELECT setting_value::INTEGER INTO v_rate_per_hour FROM public.app_settings WHERE setting_key = 'late_rate_per_hour';
    SELECT setting_value::INTEGER INTO v_max_daily     FROM public.app_settings WHERE setting_key = 'late_max_daily';

    v_work_start    := COALESCE(v_work_start, '08:00'::TIME);
    v_rate_per_hour := COALESCE(v_rate_per_hour, 20000);
    v_max_daily     := COALESCE(v_max_daily, 20000);

    IF p_is_absent OR p_check_in_time IS NULL THEN
        RETURN v_max_daily;
    END IF;

    IF p_check_in_time <= v_work_start THEN
        RETURN 0;
    END IF;

    v_late_minutes := EXTRACT(EPOCH FROM (p_check_in_time - v_work_start)) / 60;
    v_deduction := FLOOR((v_late_minutes::DECIMAL / 60) * v_rate_per_hour);

    RETURN LEAST(v_deduction, v_max_daily);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Active Salary Config for Employee
CREATE OR REPLACE FUNCTION public.get_active_salary_config(
    p_employee_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE
) RETURNS public.employee_salary_configs AS $$
    SELECT *
    FROM public.employee_salary_configs
    WHERE employee_id = p_employee_id
      AND effective_from <= p_as_of_date
      AND (effective_to IS NULL OR effective_to >= p_as_of_date)
    ORDER BY effective_from DESC
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Calculate Point Deduction for a period
CREATE OR REPLACE FUNCTION public.calculate_point_deduction(
    p_employee_id UUID,
    p_year INTEGER,
    p_month INTEGER
) RETURNS TABLE (
    target_points    INTEGER,
    actual_points    INTEGER,
    point_shortage   INTEGER,
    deduction_amount INTEGER
) AS $$
DECLARE
    v_target INTEGER;
    v_actual INTEGER;
    v_rate   INTEGER;
BEGIN
    SELECT e.target_monthly_points INTO v_target
    FROM public.employees e WHERE e.id = p_employee_id;
    v_target := COALESCE(v_target, 0);

    SELECT COALESCE(SUM(woa.points_earned), 0) INTO v_actual
    FROM public.work_order_assignments woa
    JOIN public.work_orders wo ON wo.id = woa.work_order_id
    WHERE woa.employee_id = p_employee_id
      AND EXTRACT(YEAR  FROM wo.completed_at) = p_year
      AND EXTRACT(MONTH FROM wo.completed_at) = p_month
      AND wo.status = 'closed';

    SELECT setting_value::INTEGER INTO v_rate
    FROM public.app_settings WHERE setting_key = 'point_deduction_rate';
    v_rate := COALESCE(v_rate, 11600);

    RETURN QUERY SELECT
        v_target,
        v_actual,
        CASE WHEN v_actual < v_target THEN v_target - v_actual ELSE 0 END,
        CASE WHEN v_actual < v_target THEN (v_target - v_actual) * v_rate ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
