-- SiFatih Project A: Schema Restoration & Vault Integration
-- Description: Restores missing columns in Core tables and adds Vault-integrating functions.
-- Date: 2026-04-11

-- 1. Restore Work Orders columns
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS claimed_by UUID,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS payment_status TEXT,
ADD COLUMN IF NOT EXISTS referral_name TEXT,
ADD COLUMN IF NOT EXISTS alt_phone TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS ket TEXT;

-- 2. Restore Employees columns
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS join_date DATE,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS training TEXT DEFAULT 'Tidak',
ADD COLUMN IF NOT EXISTS bpjs TEXT DEFAULT 'Tidak';

-- 3. Restore Customers columns
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS mac_address TEXT,
ADD COLUMN IF NOT EXISTS damping TEXT,
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS alt_phone TEXT;

-- 4. Re-implement get_financial_summary (Vault-aware)
CREATE OR REPLACE FUNCTION public.get_financial_summary(start_date DATE, end_date DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_income', COALESCE((SELECT SUM(amount) FROM remote_vault.financial_transactions WHERE type = 'income' AND transaction_date BETWEEN start_date AND end_date), 0),
        'total_expense', COALESCE((SELECT SUM(amount) FROM remote_vault.financial_transactions WHERE type = 'expense' AND transaction_date BETWEEN start_date AND end_date), 0),
        'income_by_category', COALESCE((
            SELECT json_object_agg(category, total)
            FROM (
                SELECT category, SUM(amount) as total
                FROM remote_vault.financial_transactions
                WHERE type = 'income' AND transaction_date BETWEEN start_date AND end_date
                GROUP BY category
            ) s
        ), '{}'::json),
        'expense_by_category', COALESCE((
            SELECT json_object_agg(category, total)
            FROM (
                SELECT category, SUM(amount) as total
                FROM remote_vault.financial_transactions
                WHERE type = 'expense' AND transaction_date BETWEEN start_date AND end_date
                GROUP BY category
            ) s
        ), '{}'::json)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Technician Performance View (Vault-aware)
CREATE OR REPLACE VIEW public.v_technician_performance AS
SELECT 
    e.id,
    e.name,
    COALESCE(SUM(l.points), 0) as total_points
FROM public.employees e
LEFT JOIN remote_vault.technician_points_ledger l ON e.id = l.employee_id
GROUP BY e.id, e.name;

-- 6. Re-implement get_work_order_stats
CREATE OR REPLACE FUNCTION public.get_work_order_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'statuses', (
            SELECT json_object_agg(status, count)
            FROM (
                SELECT status, COUNT(*) as count
                FROM public.work_orders
                GROUP BY status
            ) s
        )
    ) INTO result
    FROM public.work_orders;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
