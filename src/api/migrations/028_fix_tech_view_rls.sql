-- Migration: 028_fix_tech_view_rls.sql
-- Description: Update work_orders RLS selection policy to allow technicians to see 'waiting' tickets
--              and tickets they are assigned to via work_order_assignments.
-- Date: 2026-04-16

-- Drop the old policy
DROP POLICY IF EXISTS "work_orders_select" ON public.work_orders;
DROP POLICY IF EXISTS "wo_tech_view" ON public.work_orders;

-- Recreate consistent policy
CREATE POLICY "work_orders_select_v2" ON public.work_orders
  FOR SELECT USING (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH', 'TREASURER'])
    OR (
      has_any_role(ARRAY['TECH'])
      AND (
        status IN ('waiting', 'confirmed') -- Global pool
        OR claimed_by = auth.uid()
        OR employee_id = auth.uid()
        OR id IN (SELECT work_order_id FROM public.work_order_assignments WHERE employee_id = auth.uid())
      )
    )
    OR (
      has_any_role(ARRAY['CUST'])
      AND customer_id IN (
        SELECT id FROM public.customers WHERE email = (auth.jwt() ->> 'email')
      )
    )
  );
