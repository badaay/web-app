-- Project B (Vault)
-- Migration: Create Employee Salary Configs Table
-- Created: 2026-04-14

CREATE TABLE IF NOT EXISTS public.employee_salary_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL, -- Refers to Project A employees.id
    
    -- Fixed monthly allowances
    position_allowance INTEGER DEFAULT 0,
    additional_allowance INTEGER DEFAULT 0,
    quota_allowance INTEGER DEFAULT 0,
    education_allowance INTEGER DEFAULT 0,
    transport_meal_allowance INTEGER DEFAULT 0,
    bpjs_company_contribution INTEGER DEFAULT 0,
    
    -- Effective period
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE, -- NULL = currently active
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID, -- Refers to Project A employees.id
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT valid_effective_period CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_employee_salary_configs_employee ON public.employee_salary_configs(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salary_configs_effective ON public.employee_salary_configs(effective_from, effective_to);

ALTER TABLE public.employee_salary_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated" ON public.employee_salary_configs FOR SELECT USING (true);
