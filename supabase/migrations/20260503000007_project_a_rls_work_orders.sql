-- Migration: 007_rls_work_orders.sql
-- Description: Role-based RLS policies for work_orders table.
--              Replaces the open "Enable all for anyone" policy.
-- Date: 2026-03-19
-- Run in: Supabase SQL Editor (as postgres / service role)

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Enable all for anyone" ON public.work_orders;

-- ── SELECT ────────────────────────────────────────────────────────────────────
-- Admin-class (S_ADM, OWNER, ADM), SPV_TECH, TREASURER: see ALL work orders
-- TECH: sees (a) confirmed rows (to claim) + (b) rows assigned to or claimed by them
-- CUST: sees only rows where their customers.id = work_orders.customer_id
--       matched via their auth email → customers.email column
CREATE POLICY "work_orders_select" ON public.work_orders
  FOR SELECT USING (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH', 'TREASURER'])
    OR (
      has_any_role(ARRAY['TECH'])
      AND (
        status = 'confirmed'
        OR claimed_by = auth.uid()
        OR employee_id = auth.uid()
      )
    )
    OR (
      has_any_role(ARRAY['CUST'])
      AND customer_id IN (
        SELECT id FROM public.customers WHERE email = (auth.jwt() ->> 'email')
      )
    )
  );

-- ── INSERT ────────────────────────────────────────────────────────────────────
-- Admin-class and SPV_TECH: can create any work order
-- CUST: can only create work orders with status='waiting' for their own customer_id
CREATE POLICY "work_orders_insert" ON public.work_orders
  FOR INSERT WITH CHECK (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH'])
    OR (
      has_any_role(ARRAY['CUST'])
      AND status = 'waiting'
      AND customer_id IN (
        SELECT id FROM public.customers WHERE email = (auth.jwt() ->> 'email')
      )
    )
  );

-- ── UPDATE ────────────────────────────────────────────────────────────────────
-- Admin-class and SPV_TECH: can update any work order
-- TECH: can only update rows they have claimed
CREATE POLICY "work_orders_update" ON public.work_orders
  FOR UPDATE USING (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH'])
    OR (
      has_any_role(ARRAY['TECH'])
      AND claimed_by = auth.uid()
    )
  ) WITH CHECK (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH'])
    OR (
      has_any_role(ARRAY['TECH'])
      AND claimed_by = auth.uid()
    )
  );

-- ── DELETE ────────────────────────────────────────────────────────────────────
-- Only S_ADM and OWNER can delete work orders
CREATE POLICY "work_orders_delete" ON public.work_orders
  FOR DELETE USING (
    has_any_role(ARRAY['S_ADM', 'OWNER'])
  );
