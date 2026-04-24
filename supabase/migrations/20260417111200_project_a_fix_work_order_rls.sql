-- Migration: Fix Work Order RLS Policies (UUID Mismatch & Global Pool Access)
-- Description: Replaces auth.uid() comparisons with a secure lookup matching profile email to the employees table, enabling technicians to view both their assigned tickets and the unclaimed waiting pool.

-- 1. Helper function to safely get employee_id for authenticated user
CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS UUID AS $$
    SELECT e.id 
    FROM public.employees e 
    JOIN public.profiles p ON p.email = e.email 
    WHERE p.id = auth.uid() 
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Update Work Orders RLS
DROP POLICY IF EXISTS "wo_tech_view" ON public.work_orders;
CREATE POLICY "wo_tech_view" ON public.work_orders FOR SELECT USING (
    employee_id = public.get_my_employee_id() 
    OR claimed_by = public.get_my_employee_id()
    OR id IN (SELECT work_order_id FROM public.work_order_assignments WHERE employee_id = public.get_my_employee_id())
    OR (status IN ('waiting', 'confirmed') AND claimed_by IS NULL)
);

DROP POLICY IF EXISTS "wo_tech_update" ON public.work_orders;
CREATE POLICY "wo_tech_update" ON public.work_orders FOR UPDATE USING (
    employee_id = public.get_my_employee_id() 
    OR claimed_by = public.get_my_employee_id()
    OR id IN (SELECT work_order_id FROM public.work_order_assignments WHERE employee_id = public.get_my_employee_id())
);

-- 3. Update Work Order Assignments RLS
DROP POLICY IF EXISTS "assignments_select" ON public.work_order_assignments;
CREATE POLICY "assignments_select" ON public.work_order_assignments
  FOR SELECT USING (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH', 'TREASURER'])
    OR employee_id = public.get_my_employee_id()
  );
