-- Migration: 027_point_engine_bonus_deduction.sql
-- Description: Story 1.2 — Point Engine Bonus & Deduction Logic.
--              Adds bonus_points, deduction_points, and adjustment_reason columns
--              to work_order_assignments so admins can adjust final technician points
--              during the verification step.
--              Also formalises the new 'completed' status value for work_orders
--              (technician marks done → admin verifies → closed).
-- Date: 2026-04-28
-- Run in: Supabase SQL Editor (as postgres / service role)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add adjustment columns to work_order_assignments
--    (idempotent via IF NOT EXISTS / DO NOTHING pattern)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.work_order_assignments
  ADD COLUMN IF NOT EXISTS bonus_points      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deduction_points  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

COMMENT ON COLUMN public.work_order_assignments.bonus_points     IS 'Admin-applied bonus added on top of the base calculated points.';
COMMENT ON COLUMN public.work_order_assignments.deduction_points IS 'Admin-applied deduction subtracted from the base calculated points.';
COMMENT ON COLUMN public.work_order_assignments.adjustment_reason IS 'Mandatory reason text when bonus or deduction is non-zero.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Ensure existing rows have sensible defaults (safe no-op if already 0)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.work_order_assignments
SET
  bonus_points     = COALESCE(bonus_points, 0),
  deduction_points = COALESCE(deduction_points, 0)
WHERE bonus_points IS NULL OR deduction_points IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Update work_orders status comment to document the new 'completed' state
--    Status flow: waiting → confirmed → open → completed → closed
--                                             (tech done)   (admin verified)
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.work_orders.status IS
  'Status flow: waiting | confirmed | open | completed | closed. '
  '"completed" means the technician has finished the job and it is pending admin verification. '
  '"closed" is the final state after admin verifies and awards points.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Add completed_at column to work_orders if it does not already exist
--    (schema.sql has it; guard ensures idempotency for older DB instances)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.work_orders.completed_at IS
  'Timestamp when the technician marked the work order as completed (pending admin verification).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Create a helper view for payroll: final_points per assignment
--    final_points = MAX(0, points_earned + bonus_points - deduction_points)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_assignment_final_points AS
SELECT
  woa.id,
  woa.work_order_id,
  woa.employee_id,
  woa.assignment_role,
  woa.points_earned                                      AS base_points,
  woa.bonus_points,
  woa.deduction_points,
  woa.adjustment_reason,
  GREATEST(0, woa.points_earned + woa.bonus_points - woa.deduction_points) AS final_points,
  wo.status                                              AS work_order_status,
  wo.completed_at,
  e.name                                                 AS employee_name
FROM public.work_order_assignments woa
JOIN public.work_orders wo ON wo.id = woa.work_order_id
JOIN public.employees e    ON e.id  = woa.employee_id;

COMMENT ON VIEW public.v_assignment_final_points IS
  'Computed view: final_points = MAX(0, base + bonus - deduction). Used by payroll.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RLS on the view inherits from underlying tables; no additional policies needed.
--    Verify the columns exist and are correct.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'work_order_assignments'
      AND column_name  = 'bonus_points'
  ), 'MIGRATION 027 FAILED: bonus_points column missing from work_order_assignments';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'work_order_assignments'
      AND column_name  = 'deduction_points'
  ), 'MIGRATION 027 FAILED: deduction_points column missing from work_order_assignments';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'work_order_assignments'
      AND column_name  = 'adjustment_reason'
  ), 'MIGRATION 027 FAILED: adjustment_reason column missing from work_order_assignments';

  RAISE NOTICE 'Migration 027 — Point Engine Bonus & Deduction: OK';
END $$;
