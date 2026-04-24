-- Project B (Vault)
-- Migration: Create Payroll Line Items Table
-- Created: 2026-04-14

CREATE TABLE IF NOT EXISTS public.payroll_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL, -- Refers to Project A employees.id
    
    component_type TEXT NOT NULL CHECK (component_type IN ('earning', 'deduction')),
    component_code TEXT NOT NULL,
    component_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    
    calculation_details JSONB,
    is_manual_override BOOLEAN DEFAULT false,
    override_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID, -- Refers to Project A employees.id
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE (payroll_period_id, employee_id, component_code)
);

CREATE INDEX IF NOT EXISTS idx_payroll_items_period ON public.payroll_line_items(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON public.payroll_line_items(employee_id);

ALTER TABLE public.payroll_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated" ON public.payroll_line_items FOR SELECT USING (true);
