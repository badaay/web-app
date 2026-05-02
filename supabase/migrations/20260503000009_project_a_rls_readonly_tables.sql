-- Migration: 009_rls_readonly_tables.sql
-- Description: Tighten RLS for reference/catalogue tables.
--              Read: public or authenticated. Write: admin-class only.
-- Date: 2026-03-19
-- Run in: Supabase SQL Editor (as postgres / service role)

-- ╔══════════════════════════════════════════════╗
-- ║  internet_packages                           ║
-- ╚══════════════════════════════════════════════╝
DROP POLICY IF EXISTS "Enable all for anyone" ON public.internet_packages;

CREATE POLICY "packages_select" ON public.internet_packages
  FOR SELECT USING (true);  -- public read (needed by registration form before login)

CREATE POLICY "packages_insert" ON public.internet_packages
  FOR INSERT WITH CHECK (is_admin_class());

CREATE POLICY "packages_update" ON public.internet_packages
  FOR UPDATE USING (is_admin_class()) WITH CHECK (is_admin_class());

CREATE POLICY "packages_delete" ON public.internet_packages
  FOR DELETE USING (has_any_role(ARRAY['S_ADM', 'OWNER']));


-- ╔══════════════════════════════════════════════╗
-- ║  master_queue_types                          ║
-- ╚══════════════════════════════════════════════╝
DROP POLICY IF EXISTS "Enable all for anyone" ON public.master_queue_types;

CREATE POLICY "queue_types_select" ON public.master_queue_types
  FOR SELECT USING (true);  -- public read (needed by registration form + activity page)

CREATE POLICY "queue_types_insert" ON public.master_queue_types
  FOR INSERT WITH CHECK (is_admin_class());

CREATE POLICY "queue_types_update" ON public.master_queue_types
  FOR UPDATE USING (is_admin_class()) WITH CHECK (is_admin_class());

CREATE POLICY "queue_types_delete" ON public.master_queue_types
  FOR DELETE USING (has_any_role(ARRAY['S_ADM', 'OWNER']));


-- ╔══════════════════════════════════════════════╗
-- ║  inventory                                   ║
-- ╚══════════════════════════════════════════════╝
DROP POLICY IF EXISTS "Enable all for anyone" ON public.inventory;

CREATE POLICY "inventory_select" ON public.inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "inventory_insert" ON public.inventory
  FOR INSERT WITH CHECK (is_admin_class());

CREATE POLICY "inventory_update" ON public.inventory
  FOR UPDATE USING (is_admin_class()) WITH CHECK (is_admin_class());

CREATE POLICY "inventory_delete" ON public.inventory
  FOR DELETE USING (has_any_role(ARRAY['S_ADM', 'OWNER']));


-- ╔══════════════════════════════════════════════╗
-- ║  installation_monitorings                    ║
-- ╚══════════════════════════════════════════════╝
DROP POLICY IF EXISTS "Enable all for anyone" ON public.installation_monitorings;

-- Read: Admin-class, SPV_TECH, TREASURER see all; TECH sees only their own rows
CREATE POLICY "install_mon_select" ON public.installation_monitorings
  FOR SELECT USING (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH', 'TREASURER'])
    OR (
      has_any_role(ARRAY['TECH'])
      AND employee_id = auth.uid()
    )
  );

-- Insert: Admin-class or TECH (for their own work orders)
CREATE POLICY "install_mon_insert" ON public.installation_monitorings
  FOR INSERT WITH CHECK (
    is_admin_class()
    OR (
      has_any_role(ARRAY['TECH'])
      AND employee_id = auth.uid()
    )
  );

-- Update: Admin-class or TECH (own rows only)
CREATE POLICY "install_mon_update" ON public.installation_monitorings
  FOR UPDATE USING (
    is_admin_class()
    OR (
      has_any_role(ARRAY['TECH'])
      AND employee_id = auth.uid()
    )
  ) WITH CHECK (
    is_admin_class()
    OR (
      has_any_role(ARRAY['TECH'])
      AND employee_id = auth.uid()
    )
  );

-- Delete: S_ADM / OWNER only
CREATE POLICY "install_mon_delete" ON public.installation_monitorings
  FOR DELETE USING (has_any_role(ARRAY['S_ADM', 'OWNER']));
