-- SiFatih Project B: Add missing columns to payroll & attendance tables
-- Description: payroll/calculate.js expects columns not in original vault schema.
-- Date: 2026-04-11
-- Target: Run on Project B (Vault)

-- 1. Extend payroll_summaries
ALTER TABLE public.payroll_summaries
  ADD COLUMN IF NOT EXISTS target_points    INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_points    INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS point_shortage   INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_present     INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_late        INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_absent      INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_hours   DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_amount  INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS calculated_at    TIMESTAMPTZ;

-- Unique constraint required for upsert in calculate.js (onConflict: 'payroll_period_id,employee_id')
ALTER TABLE public.payroll_summaries
  DROP CONSTRAINT IF EXISTS payroll_summaries_period_emp_unique;
ALTER TABLE public.payroll_summaries
  ADD CONSTRAINT payroll_summaries_period_emp_unique
  UNIQUE (payroll_period_id, employee_id);

-- 2. Extend attendance_records
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS attendance_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS is_absent        BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS late_minutes     INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deduction_amount INTEGER     DEFAULT 0;

-- 3. Extend overtime_records  
ALTER TABLE public.overtime_records
  ADD COLUMN IF NOT EXISTS overtime_date    DATE,
  ADD COLUMN IF NOT EXISTS amount_earned    INTEGER     DEFAULT 0;

-- 4. Add payroll_periods columns referenced in calculate.js
ALTER TABLE public.payroll_periods
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS calculated_at    TIMESTAMPTZ;
