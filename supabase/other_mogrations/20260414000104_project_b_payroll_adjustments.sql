-- Project B (Vault)
-- Migration: Create Payroll Adjustments Table
-- Created: 2026-04-14

CREATE TABLE IF NOT EXISTS public.payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL, -- Refers to Project A employees.id
    
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('bonus', 'deduction')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    
    requested_by UUID, -- Refers to Project A employees.id
    approved_by UUID, -- Refers to Project A employees.id
    approved_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adjustments_period ON public.payroll_adjustments(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_employee ON public.payroll_adjustments(employee_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_status ON public.payroll_adjustments(status);

ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated" ON public.payroll_adjustments FOR SELECT USING (true);
