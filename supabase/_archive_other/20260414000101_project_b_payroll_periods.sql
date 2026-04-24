-- Project B (Vault)
-- Migration: Create Payroll Periods Table
-- Created: 2026-04-14

CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculating', 'calculated', 'approved', 'paid')),
    
    calculated_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    approved_by UUID, -- Refers to Project A employees.id
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID, -- Refers to Project A employees.id
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE (year, month),
    CONSTRAINT valid_period_dates CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON public.payroll_periods(status);

ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

-- Note: In Project B, we assume is_admin_class() function exists or we use raw role checks
-- For simplicity, if accessed via supabaseAdminB, RLS is bypassed.
-- But we add policies for completeness.
CREATE POLICY "Allow read for authenticated" ON public.payroll_periods FOR SELECT USING (true);
