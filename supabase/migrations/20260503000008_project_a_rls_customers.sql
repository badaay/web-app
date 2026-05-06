-- Migration: 008_rls_customers.sql
-- Description: Role-based RLS policies for the customers table.
-- Date: 2026-03-19
-- Run in: Supabase SQL Editor (as postgres / service role)

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Enable all for anyone" ON public.customers;

-- ── SELECT ────────────────────────────────────────────────────────────────────
-- Any authenticated user can read customer records (needed for WO card display).
-- Restrict sensitive columns (ktp_number, etc.) via a view if needed later.
CREATE POLICY "customers_select" ON public.customers
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- ── INSERT ────────────────────────────────────────────────────────────────────
-- Admin-class: can create customers (admin registration path)
-- CUST role (self-registration): user can only insert a row where
--   the row's email matches their own auth email (via JWT)
CREATE POLICY "customers_insert" ON public.customers
  FOR INSERT WITH CHECK (
    is_admin_class()
    OR (
      has_any_role(ARRAY['CUST'])
      AND email = (auth.jwt() ->> 'email')
    )
  );

-- ── UPDATE ────────────────────────────────────────────────────────────────────
-- Admin-class: update any customer
-- CUST: update only their own record
CREATE POLICY "customers_update" ON public.customers
  FOR UPDATE USING (
    is_admin_class()
    OR (
      has_any_role(ARRAY['CUST'])
      AND email = (auth.jwt() ->> 'email')
    )
  ) WITH CHECK (
    is_admin_class()
    OR (
      has_any_role(ARRAY['CUST'])
      AND email = (auth.jwt() ->> 'email')
    )
  );

-- ── DELETE ────────────────────────────────────────────────────────────────────
-- Only S_ADM and OWNER can delete customer records
CREATE POLICY "customers_delete" ON public.customers
  FOR DELETE USING (
    has_any_role(ARRAY['S_ADM', 'OWNER'])
  );
