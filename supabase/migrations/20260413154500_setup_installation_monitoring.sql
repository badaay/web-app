-- Migration: Installation Monitoring Setup
-- Created: 2026-04-13
-- Description: Create installation_monitorings table and relate it to work_orders.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.installation_monitorings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE UNIQUE,
    customer_id UUID REFERENCES public.customers(id),
    employee_id UUID REFERENCES public.employees(id),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    notes TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    mac_address TEXT,
    sn_modem TEXT,
    cable_label TEXT,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indexes
CREATE INDEX IF NOT EXISTS idx_installation_monitorings_wo_id ON public.installation_monitorings(work_order_id);
CREATE INDEX IF NOT EXISTS idx_installation_monitorings_status ON public.installation_monitorings(status);

-- 3. Enable RLS
ALTER TABLE public.installation_monitorings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Managers can view all monitorings
DROP POLICY IF EXISTS "Managers can view all monitorings" ON public.installation_monitorings;
CREATE POLICY "Managers can view all monitorings" 
    ON public.installation_monitorings 
    FOR SELECT 
    USING (public.is_admin_class() OR public.has_any_role(ARRAY['SPV_TECH', 'TREASURER']));

-- Technicians can view monitorings they are assigned to (via work_order_assignments)
DROP POLICY IF EXISTS "Technicians can view assigned monitorings" ON public.installation_monitorings;
CREATE POLICY "Technicians can view assigned monitorings" 
    ON public.installation_monitorings 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.work_order_assignments 
            WHERE work_order_id = installation_monitorings.work_order_id 
            AND employee_id = auth.uid()
        )
        OR employee_id = auth.uid()
    );

-- Technicians can update monitorings they are assigned to
DROP POLICY IF EXISTS "Technicians can update assigned monitorings" ON public.installation_monitorings;
CREATE POLICY "Technicians can update assigned monitorings" 
    ON public.installation_monitorings 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.work_order_assignments 
            WHERE work_order_id = installation_monitorings.work_order_id 
            AND employee_id = auth.uid()
        )
        OR employee_id = auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.work_order_assignments 
            WHERE work_order_id = installation_monitorings.work_order_id 
            AND employee_id = auth.uid()
        )
        OR employee_id = auth.uid()
    );

-- Admins can do anything
DROP POLICY IF EXISTS "Admins have full access to monitorings" ON public.installation_monitorings;
CREATE POLICY "Admins have full access to monitorings" 
    ON public.installation_monitorings 
    FOR ALL 
    USING (public.is_admin_class()) 
    WITH CHECK (public.is_admin_class());

-- 5. Trigger for updated_at
-- Use existing trigger function if available in migration 100002
DROP TRIGGER IF EXISTS on_installation_monitorings_updated ON public.installation_monitorings;
CREATE TRIGGER on_installation_monitorings_updated
    BEFORE UPDATE ON public.installation_monitorings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
