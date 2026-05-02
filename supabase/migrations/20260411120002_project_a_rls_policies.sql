-- Migration: 20260411120002_project_a_rls_policies.sql
-- Description: Restore data visibility by adding missing RLS policies for Project A tables.
-- Date: 2026-04-11

-- 1. Master Data (Read-only for all authenticated users)
DO $$
BEGIN
    -- Internet Packages
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internet_packages' AND policyname = 'allow_select_auth') THEN
        CREATE POLICY "allow_select_auth" ON public.internet_packages FOR SELECT TO authenticated USING (true);
    END IF;

    -- Master Queue Types
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'master_queue_types' AND policyname = 'allow_select_auth') THEN
        CREATE POLICY "allow_select_auth" ON public.master_queue_types FOR SELECT TO authenticated USING (true);
    END IF;

    -- Inventory Items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_items' AND policyname = 'allow_select_auth') THEN
        CREATE POLICY "allow_select_auth" ON public.inventory_items FOR SELECT TO authenticated USING (true);
    END IF;

    -- Roles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'allow_select_auth') THEN
        CREATE POLICY "allow_select_auth" ON public.roles FOR SELECT TO authenticated USING (true);
    END IF;

    -- App Settings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'allow_select_auth') THEN
        CREATE POLICY "allow_select_auth" ON public.app_settings FOR SELECT TO authenticated USING (true);
    END IF;
    
    -- Payment Methods
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'allow_select_auth') THEN
        ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "allow_select_auth" ON public.payment_methods FOR SELECT TO authenticated USING (true);
    END IF;

    -- Expense Categories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expense_categories' AND policyname = 'allow_select_auth') THEN
        ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "allow_select_auth" ON public.expense_categories FOR SELECT TO authenticated USING (true);
    END IF;

END $$;

-- 2. Operational Data (Full Access for Admin Class)
-- Roles: OWNER, S_ADM, ADM

-- Employees
CREATE POLICY "admin_all_employees" ON public.employees FOR ALL TO authenticated 
USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- Customers
CREATE POLICY "admin_all_customers" ON public.customers FOR ALL TO authenticated 
USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- Work Orders
CREATE POLICY "admin_all_work_orders" ON public.work_orders FOR ALL TO authenticated 
USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- Work Order Assignments
CREATE POLICY "admin_all_assignments" ON public.work_order_assignments FOR ALL TO authenticated 
USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- PSB Registrations
CREATE POLICY "admin_all_registrations" ON public.psb_registrations FOR ALL TO authenticated 
USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());


-- 3. Technician Specific Policies

-- Can view work orders they are assigned to
CREATE POLICY "tech_assigned_work_orders" ON public.work_orders FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.work_order_assignments asgn
        WHERE asgn.work_order_id = public.work_orders.id
        AND asgn.employee_id = auth.uid()
    )
);

-- Can view their own assignments
CREATE POLICY "tech_own_assignments" ON public.work_order_assignments FOR SELECT TO authenticated
USING (employee_id = auth.uid());


-- 4. Settings Management (Admin Only)
CREATE POLICY "admin_manage_settings" ON public.app_settings FOR ALL TO authenticated
USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());
