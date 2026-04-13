-- Migration: 20260413150000_allow_techs_to_view_employees.sql
-- Description: Add RLS policies to allow technicians to view their own employee record and related data.
-- Date: 2026-04-13

-- 1. Employees: Allow all authenticated users (techs) to view employee directory
-- This is needed for the activity page to lookup technician details
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Allow techs to view employees') THEN
        CREATE POLICY "Allow techs to view employees" 
        ON public.employees
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- 2. Customers: Allow technicians to view customers associated with work orders
-- The activity page needs to see metadata (name, address, lat, lng) for tickets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'tech_view_customers') THEN
        CREATE POLICY "tech_view_customers" 
        ON public.customers
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- 3. Work Orders: Additional check for visibility
-- Ensuring technicians can see confirmed tickets that haven't been claimed yet
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_orders' AND policyname = 'tech_view_confirmed_orders') THEN
        CREATE POLICY "tech_view_confirmed_orders" 
        ON public.work_orders
        FOR SELECT 
        TO authenticated
        USING (status = 'confirmed');
    END IF;
END $$;

