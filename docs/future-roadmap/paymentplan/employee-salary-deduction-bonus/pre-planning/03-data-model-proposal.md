# 03 - Data Model Proposal

> Proposed database schema extensions for the Employee Salary System.

---

## Overview

This document proposes new tables and modifications to existing tables required for implementing the employee salary system. The design prioritizes:

1. **Compatibility** with existing `employees`, `work_orders`, `work_order_assignments` tables
2. **Audit trail** for all financial calculations
3. **Configurability** via `app_settings` table
4. **Immutability** of historical records once approved

---

## 1. Existing Table Modifications

### 1.1 Employees Table Extension

Add salary-related columns to existing `employees` table:

```sql
-- Migration: Add salary columns to employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS base_salary INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_bpjs_enrolled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_monthly_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

COMMENT ON COLUMN public.employees.base_salary IS 'Base monthly salary in IDR';
COMMENT ON COLUMN public.employees.is_bpjs_enrolled IS 'Whether employee is enrolled in BPJS Ketenagakerjaan';
COMMENT ON COLUMN public.employees.target_monthly_points IS 'Monthly work order points target for technicians';
```

### 1.2 App Settings Extensions

Add configurable salary parameters:

```sql
-- Migration: Add salary-related settings
INSERT INTO public.app_settings (setting_key, setting_value, description) VALUES
('work_start_time', '08:00', 'Daily work start time for attendance tracking'),
('late_rate_per_hour', '20000', 'Deduction rate per hour of lateness (IDR)'),
('late_max_daily', '20000', 'Maximum daily late deduction (IDR)'),
('overtime_start_time', '16:30', 'Overtime starts after this time'),
('overtime_rate_per_hour', '10000', 'Overtime pay per hour (IDR)'),
('point_deduction_rate', '11600', 'Deduction per point shortage (IDR)'),
('bpjs_fixed_amount', '194040', 'Fixed BPJS amount if not percentage-based (IDR)')
ON CONFLICT (setting_key) DO NOTHING;
```

---

## 2. New Tables

### 2.1 Employee Salary Config

Per-employee salary component configuration with effective dating.

```sql
CREATE TABLE IF NOT EXISTS public.employee_salary_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Fixed allowances (monthly)
    position_allowance INTEGER DEFAULT 0,
    additional_allowance INTEGER DEFAULT 0,
    quota_allowance INTEGER DEFAULT 0,
    education_allowance INTEGER DEFAULT 0,
    transport_meal_allowance INTEGER DEFAULT 0,
    
    -- BPJS
    bpjs_company_contribution INTEGER DEFAULT 0,
    
    -- Effective period
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,  -- NULL = currently active
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_effective_period CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- Index for efficient lookups
CREATE INDEX idx_employee_salary_configs_employee ON public.employee_salary_configs(employee_id);
CREATE INDEX idx_employee_salary_configs_effective ON public.employee_salary_configs(effective_from, effective_to);

-- RLS
ALTER TABLE public.employee_salary_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage salary configs" ON public.employee_salary_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.roles r ON e.role_id = r.id
            WHERE e.id = auth.uid()
            AND r.code IN ('S_ADM', 'OWNER', 'HR')
        )
    );

CREATE POLICY "Employees can view own salary config" ON public.employee_salary_configs
    FOR SELECT USING (employee_id = auth.uid());
```

### 2.2 Attendance Records

Daily attendance tracking with late deduction calculation.

```sql
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Date and time
    attendance_date DATE NOT NULL,
    check_in_time TIME,  -- NULL = absent
    check_out_time TIME,
    
    -- Lateness calculation
    late_minutes INTEGER DEFAULT 0,
    is_absent BOOLEAN DEFAULT false,
    
    -- Deduction
    deduction_amount INTEGER DEFAULT 0,
    
    -- Source tracking
    source TEXT DEFAULT 'manual',  -- 'manual' | 'imported' | 'fingerprint'
    external_id TEXT,  -- ID from external system (e.g., fingerprint machine)
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    UNIQUE (employee_id, attendance_date)
);

-- Indexes
CREATE INDEX idx_attendance_employee ON public.attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON public.attendance_records(attendance_date);
CREATE INDEX idx_attendance_month ON public.attendance_records(employee_id, DATE_TRUNC('month', attendance_date));

-- RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attendance" ON public.attendance_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.roles r ON e.role_id = r.id
            WHERE e.id = auth.uid()
            AND r.code IN ('S_ADM', 'OWNER', 'HR', 'SPV_TECH')
        )
    );

CREATE POLICY "Employees can view own attendance" ON public.attendance_records
    FOR SELECT USING (employee_id = auth.uid());
```

### 2.3 Overtime Records

Overtime events with multi-technician support.

```sql
CREATE TABLE IF NOT EXISTS public.overtime_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Date and time
    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Description
    description TEXT NOT NULL,
    overtime_type TEXT,  -- 'psb' | 'backbone' | 'repair' | 'cable_pull' | 'other'
    
    -- Calculation
    total_hours DECIMAL(5,2) NOT NULL,
    hourly_rate INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,  -- Shared pool for all technicians
    
    -- Link to work order (optional)
    work_order_id UUID REFERENCES public.work_orders(id),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_overtime_times CHECK (end_time > start_time OR end_time < start_time)  -- Allow overnight
);

-- Index
CREATE INDEX idx_overtime_date ON public.overtime_records(overtime_date);
CREATE INDEX idx_overtime_work_order ON public.overtime_records(work_order_id);

-- RLS
ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view overtime" ON public.overtime_records
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage overtime" ON public.overtime_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.roles r ON e.role_id = r.id
            WHERE e.id = auth.uid()
            AND r.code IN ('S_ADM', 'OWNER', 'HR', 'SPV_TECH')
        )
    );
```

### 2.4 Overtime Assignments

Junction table linking overtime to individual technicians.

```sql
CREATE TABLE IF NOT EXISTS public.overtime_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overtime_id UUID NOT NULL REFERENCES public.overtime_records(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Individual share
    amount_earned INTEGER NOT NULL,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    UNIQUE (overtime_id, employee_id)
);

-- Index
CREATE INDEX idx_overtime_assignments_employee ON public.overtime_assignments(employee_id);
CREATE INDEX idx_overtime_assignments_overtime ON public.overtime_assignments(overtime_id);

-- RLS
ALTER TABLE public.overtime_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own overtime assignments" ON public.overtime_assignments
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage overtime assignments" ON public.overtime_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.roles r ON e.role_id = r.id
            WHERE e.id = auth.uid()
            AND r.code IN ('S_ADM', 'OWNER', 'HR', 'SPV_TECH')
        )
    );
```

### 2.5 Payroll Periods

Monthly payroll calculation scope.

```sql
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Period definition
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Status workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculating', 'calculated', 'approved', 'paid')),
    
    -- Timestamps
    calculated_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Approvers
    approved_by UUID REFERENCES public.employees(id),
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    UNIQUE (year, month),
    CONSTRAINT valid_period_dates CHECK (period_end >= period_start)
);

-- Index
CREATE INDEX idx_payroll_periods_status ON public.payroll_periods(status);

-- RLS
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view payroll periods" ON public.payroll_periods
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage payroll periods" ON public.payroll_periods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.roles r ON e.role_id = r.id
            WHERE e.id = auth.uid()
            AND r.code IN ('S_ADM', 'OWNER', 'HR')
        )
    );
```

### 2.6 Payroll Line Items

Individual salary components per employee per period.

```sql
CREATE TABLE IF NOT EXISTS public.payroll_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Component identification
    component_type TEXT NOT NULL CHECK (component_type IN ('earning', 'deduction')),
    component_code TEXT NOT NULL,
    component_name TEXT NOT NULL,
    
    -- Amount (positive for earnings, positive for deductions - type determines behavior)
    amount INTEGER NOT NULL,
    
    -- Calculation details (JSON for audit)
    calculation_details JSONB,
    
    -- Manual override
    is_manual_override BOOLEAN DEFAULT false,
    override_reason TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    UNIQUE (payroll_period_id, employee_id, component_code)
);

-- Indexes
CREATE INDEX idx_payroll_items_period ON public.payroll_line_items(payroll_period_id);
CREATE INDEX idx_payroll_items_employee ON public.payroll_line_items(employee_id);
CREATE INDEX idx_payroll_items_component ON public.payroll_line_items(component_code);

-- RLS
ALTER TABLE public.payroll_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own payroll items" ON public.payroll_line_items
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage payroll items" ON public.payroll_line_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.roles r ON e.role_id = r.id
            WHERE e.id = auth.uid()
            AND r.code IN ('S_ADM', 'OWNER', 'HR')
        )
    );
```

### 2.7 Payroll Summaries

Pre-calculated totals per employee per period.

```sql
CREATE TABLE IF NOT EXISTS public.payroll_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Totals
    gross_earnings INTEGER NOT NULL DEFAULT 0,
    total_deductions INTEGER NOT NULL DEFAULT 0,
    take_home_pay INTEGER NOT NULL DEFAULT 0,
    
    -- Point tracking
    target_points INTEGER DEFAULT 0,
    actual_points INTEGER DEFAULT 0,
    point_shortage INTEGER DEFAULT 0,
    
    -- Attendance tracking
    days_present INTEGER DEFAULT 0,
    days_late INTEGER DEFAULT 0,
    days_absent INTEGER DEFAULT 0,
    
    -- Overtime tracking
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_amount INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    UNIQUE (payroll_period_id, employee_id)
);

-- Indexes
CREATE INDEX idx_payroll_summary_period ON public.payroll_summaries(payroll_period_id);
CREATE INDEX idx_payroll_summary_employee ON public.payroll_summaries(employee_id);

-- RLS
ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own payroll summary" ON public.payroll_summaries
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage payroll summaries" ON public.payroll_summaries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.roles r ON e.role_id = r.id
            WHERE e.id = auth.uid()
            AND r.code IN ('S_ADM', 'OWNER', 'HR')
        )
    );
```

### 2.8 Manual Adjustments

Ad-hoc bonuses or deductions.

```sql
CREATE TABLE IF NOT EXISTS public.payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Adjustment details
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('bonus', 'deduction')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    
    -- Approval
    requested_by UUID REFERENCES public.employees(id),
    approved_by UUID REFERENCES public.employees(id),
    approved_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_adjustments_period ON public.payroll_adjustments(payroll_period_id);
CREATE INDEX idx_adjustments_employee ON public.payroll_adjustments(employee_id);
CREATE INDEX idx_adjustments_status ON public.payroll_adjustments(status);

-- RLS
ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own adjustments" ON public.payroll_adjustments
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage adjustments" ON public.payroll_adjustments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.roles r ON e.role_id = r.id
            WHERE e.id = auth.uid()
            AND r.code IN ('S_ADM', 'OWNER', 'HR')
        )
    );
```

---

## 3. Database Functions

### 3.1 Calculate Late Deduction

```sql
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
    -- Get settings
    SELECT setting_value::TIME INTO v_work_start
    FROM public.app_settings WHERE setting_key = 'work_start_time';
    v_work_start := COALESCE(v_work_start, '08:00'::TIME);
    
    SELECT setting_value::INTEGER INTO v_rate_per_hour
    FROM public.app_settings WHERE setting_key = 'late_rate_per_hour';
    v_rate_per_hour := COALESCE(v_rate_per_hour, 20000);
    
    SELECT setting_value::INTEGER INTO v_max_daily
    FROM public.app_settings WHERE setting_key = 'late_max_daily';
    v_max_daily := COALESCE(v_max_daily, 20000);
    
    -- Calculate
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
$$ LANGUAGE plpgsql;
```

### 3.2 Calculate Point Deduction

```sql
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
    v_target INTEGER;
    v_actual INTEGER;
    v_rate INTEGER;
BEGIN
    -- Get target from employee config
    SELECT e.target_monthly_points INTO v_target
    FROM public.employees e WHERE e.id = p_employee_id;
    v_target := COALESCE(v_target, 0);
    
    -- Get actual points from work order assignments
    SELECT COALESCE(SUM(woa.points_earned), 0) INTO v_actual
    FROM public.work_order_assignments woa
    JOIN public.work_orders wo ON wo.id = woa.work_order_id
    WHERE woa.employee_id = p_employee_id
    AND EXTRACT(YEAR FROM wo.completed_at) = p_year
    AND EXTRACT(MONTH FROM wo.completed_at) = p_month
    AND wo.status = 'closed';
    
    -- Get rate
    SELECT setting_value::INTEGER INTO v_rate
    FROM public.app_settings WHERE setting_key = 'point_deduction_rate';
    v_rate := COALESCE(v_rate, 11600);
    
    -- Return
    RETURN QUERY SELECT
        v_target,
        v_actual,
        CASE WHEN v_actual < v_target THEN v_actual - v_target ELSE 0 END,
        CASE WHEN v_actual < v_target THEN (v_target - v_actual) * v_rate ELSE 0 END;
END;
$$ LANGUAGE plpgsql;
```

### 3.3 Get Employee Salary Config

```sql
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
$$ LANGUAGE sql STABLE;
```

---

## 4. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXISTING TABLES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────────┐   │
│  │  employees   │────<│   work_orders    │────<│work_order_assignments│ │
│  │  (modified)  │     └──────────────────┘     │  (points_earned)   │   │
│  └──────┬───────┘                              └────────────────────┘   │
│         │                                                                │
├─────────┼───────────────────────────────────────────────────────────────┤
│         │              NEW TABLES                                        │
├─────────┼───────────────────────────────────────────────────────────────┤
│         │                                                                │
│         │     ┌────────────────────────┐                                │
│         ├────<│ employee_salary_configs │                                │
│         │     └────────────────────────┘                                │
│         │                                                                │
│         │     ┌────────────────────────┐                                │
│         ├────<│   attendance_records   │                                │
│         │     └────────────────────────┘                                │
│         │                                                                │
│         │     ┌────────────────────────┐     ┌──────────────────────┐   │
│         ├────<│    overtime_records    │────<│ overtime_assignments │   │
│         │     └────────────────────────┘     └──────────────────────┘   │
│         │                                                                │
│         │     ┌────────────────────────┐                                │
│         │     │    payroll_periods     │                                │
│         │     └───────────┬────────────┘                                │
│         │                 │                                              │
│         │     ┌───────────┼────────────────────────┐                    │
│         │     │           │                        │                    │
│         │     ▼           ▼                        ▼                    │
│         │ ┌───────────┐ ┌──────────────┐ ┌─────────────────┐            │
│         └<│payroll_   │ │payroll_line_ │ │payroll_         │            │
│           │summaries  │ │items         │ │adjustments      │            │
│           └───────────┘ └──────────────┘ └─────────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Migration Order

Execute migrations in this order to respect foreign key dependencies:

1. `001_alter_employees.sql` - Add columns to employees table
2. `002_app_settings_salary.sql` - Add salary-related settings
3. `003_employee_salary_configs.sql` - Create salary config table
4. `004_attendance_records.sql` - Create attendance table
5. `005_overtime_records.sql` - Create overtime tables
6. `006_payroll_periods.sql` - Create payroll period table
7. `007_payroll_line_items.sql` - Create line items table
8. `008_payroll_summaries.sql` - Create summary table
9. `009_payroll_adjustments.sql` - Create adjustments table
10. `010_salary_functions.sql` - Create calculation functions

---

## Next Steps

→ See [04-normalized-attendance.md](./04-normalized-attendance.md) for sample data transformation
→ See [07-integration-points.md](./07-integration-points.md) for existing system integration
