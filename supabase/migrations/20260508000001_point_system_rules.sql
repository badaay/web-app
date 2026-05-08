-- Migration: 028_point_system_rules.sql
-- Description: Add point conversion rules and expand salary configs
-- Mandatory: Integer-based math for all nominal amounts

-- 1. Create Point Conversion Rules Table
CREATE TABLE IF NOT EXISTS public.point_conversion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR NOT NULL, -- e.g., 'Potongan Terlambat', 'Bonus Prestasi'
    rule_type VARCHAR NOT NULL CHECK (rule_type IN ('deduction', 'addition')),
    trigger_metric VARCHAR NOT NULL, -- 'minutes_late', 'points_earned', 'points_shortage'
    trigger_unit INTEGER NOT NULL, -- 15 (minutes) or 100 (points)
    amount_per_unit INTEGER NOT NULL, -- Nominal in IDR
    is_multiplier BOOLEAN DEFAULT true, -- If true, applies for every unit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add Missing Columns to employee_salary_configs
ALTER TABLE public.employee_salary_configs 
ADD COLUMN IF NOT EXISTS field_allowance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS communication_allowance INTEGER DEFAULT 0;

-- 3. Add Target Points to Employees (Master Data)
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS target_monthly_points INTEGER DEFAULT 0;

-- 4. Enable RLS for point_conversion_rules
ALTER TABLE public.point_conversion_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage point rules" ON public.point_conversion_rules;
CREATE POLICY "Admins manage point rules" 
    ON public.point_conversion_rules FOR ALL 
    USING (public.is_admin_class());

DROP POLICY IF EXISTS "Public read point rules" ON public.point_conversion_rules;
CREATE POLICY "Public read point rules" 
    ON public.point_conversion_rules FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 5. Seed Default Rules
INSERT INTO public.point_conversion_rules (rule_name, rule_type, trigger_metric, trigger_unit, amount_per_unit, is_multiplier)
VALUES 
('Potongan Terlambat', 'deduction', 'minutes_late', 15, 5000, true),
('Bonus Prestasi Poin', 'addition', 'points_earned', 100, 10000, true),
('Potongan Under Target', 'deduction', 'points_shortage', 1, 11600, true)
ON CONFLICT DO NOTHING;
