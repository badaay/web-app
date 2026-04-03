-- Migration: 011_work_order_assignments.sql
-- Description: Replace work_orders.claimed_by FK with a dedicated assignments table.
--              This fixes the PostgREST "more than one relationship" ambiguity between
--              work_orders and employees (employee_id + claimed_by both pointed to employees).
--              The new table also supports team members and per-person point tracking.
-- Date: 2026-03-19
-- Run in: Supabase SQL Editor (as postgres / service role)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Drop the FK constraint causing PostgREST ambiguity
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.work_orders
  DROP CONSTRAINT IF EXISTS work_orders_claimed_by_fkey;

-- claimed_by column is kept as a plain UUID for quick "is this WO claimed?" checks
-- without needing a join. It is no longer enforced as a FK.

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create the work_order_assignments table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_assignments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id  UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    employee_id    UUID NOT NULL REFERENCES public.employees(id),
    assignment_role TEXT NOT NULL DEFAULT 'member', -- 'lead' | 'member'
    assigned_at    TIMESTAMPTZ DEFAULT now(),
    points_earned  INTEGER DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE (work_order_id, employee_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Migrate existing claimed_by data → assignments table (role = 'lead')
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.work_order_assignments (work_order_id, employee_id, assignment_role, assigned_at)
SELECT
    wo.id,
    wo.claimed_by,
    'lead',
    COALESCE(wo.claimed_at, wo.created_at)
FROM public.work_orders wo
WHERE wo.claimed_by IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.employees e WHERE e.id = wo.claimed_by)
ON CONFLICT (work_order_id, employee_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Enable RLS + policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.work_order_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_select" ON public.work_order_assignments
  FOR SELECT USING (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH', 'TREASURER'])
    OR employee_id = auth.uid()
  );

CREATE POLICY "assignments_insert" ON public.work_order_assignments
  FOR INSERT WITH CHECK (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH'])
    OR employee_id = auth.uid()
  );

CREATE POLICY "assignments_update" ON public.work_order_assignments
  FOR UPDATE USING (is_admin_class() OR employee_id = auth.uid())
  WITH CHECK (is_admin_class() OR employee_id = auth.uid());

CREATE POLICY "assignments_delete" ON public.work_order_assignments
  FOR DELETE USING (has_any_role(ARRAY['S_ADM', 'OWNER']));

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wo_assignments_work_order_id ON public.work_order_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_employee_id   ON public.work_order_assignments(employee_id);
