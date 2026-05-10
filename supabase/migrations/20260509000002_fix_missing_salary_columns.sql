-- Migration: 20260509000002_fix_missing_salary_columns.sql
-- Description: Final consolidation of allowance and salary columns across employees and configs.

-- 1. Ensure allowance columns exist in employee_salary_configs
-- These columns are critical for the payroll engine to calculate the correct monthly take-home pay.
ALTER TABLE public.employee_salary_configs 
ADD COLUMN IF NOT EXISTS field_allowance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS communication_allowance INTEGER DEFAULT 0;

-- 2. Ensure base salary and target points exist in employees table
-- target_monthly_points is used to calculate bonuses or deductions based on technician performance.
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS target_monthly_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_salary INTEGER DEFAULT 0;

-- 3. Verify indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_employee_salary_configs_employee_v2 ON public.employee_salary_configs(employee_id);
