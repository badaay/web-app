-- Migration: 020_employee_salary_columns.sql
-- Task 1.1: Add salary-related columns to employees table
-- Ref: pre-planning/01-entity-definitions.md

-- TODO: Implement
-- ALTER TABLE public.employees
-- ADD COLUMN IF NOT EXISTS base_salary INTEGER DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS target_monthly_points INTEGER DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS is_bpjs_enrolled BOOLEAN DEFAULT false;

-- COMMENT ON COLUMN public.employees.base_salary IS 'Base monthly salary in IDR';
-- COMMENT ON COLUMN public.employees.target_monthly_points IS 'Monthly work order points target';
-- COMMENT ON COLUMN public.employees.is_bpjs_enrolled IS 'BPJS Ketenagakerjaan enrollment status';
