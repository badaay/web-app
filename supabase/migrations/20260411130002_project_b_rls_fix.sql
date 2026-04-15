-- SiFatih Project B: RLS fix for vault tables
-- Description: Vault tables are accessed server-side only (service_role via FDW or direct).
--              Disabling RLS lets the FDW + service_role key access them without policies.
-- Date: 2026-04-11
-- Target: Run on Project B (Vault)

-- Operational / Financial tables — server-side only access
ALTER TABLE public.financial_transactions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_bills          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_summaries       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_records        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_points_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue      DISABLE ROW LEVEL SECURITY;

-- Keep activity_logs: audited, not disabled
-- (already has a policy: "Vault accessed only by authenticated")
