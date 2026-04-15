-- Project B (Vault)
-- Migration: Create Payroll Summaries Table
-- Created: 2026-04-14

CREATE TABLE IF NOT EXISTS public.payroll_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL, -- Refers to Project A employees.id
    
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
    
    UNIQUE (payroll_period_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_summary_period ON public.payroll_summaries(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_summary_employee ON public.payroll_summaries(employee_id);

ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated" ON public.payroll_summaries FOR SELECT USING (true);
