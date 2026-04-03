-- Migration: 020_employee_salary_columns.sql
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS base_salary             INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_bpjs_enrolled        BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_monthly_points   INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_name               TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number     TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name       TEXT;
