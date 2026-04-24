-- Fix Migration: Ensure financial_transactions has all required columns
-- The enhanced_finance_schema migration's DO $$ block may have silently
-- failed, leaving the table without bank_account_id and related columns.

-- 1. Ensure bank_accounts table exists first
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    account_number TEXT,
    account_holder TEXT,
    is_active BOOLEAN DEFAULT true,
    current_balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add missing columns to financial_transactions (safe with IF NOT EXISTS)
ALTER TABLE public.financial_transactions
    ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id),
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_by_profile_id UUID;

-- 3. Seed bank accounts if empty
INSERT INTO public.bank_accounts (name, account_number, account_holder) VALUES
('BCA', '1234567890', 'Mitra Flow'),
('BSI', '0987654321', 'Mitra Flow'),
('Tunai', '-', 'Kas Kantor')
ON CONFLICT (name) DO NOTHING;

-- 4. Ensure RLS & policies
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vault bank_accounts access" ON public.bank_accounts;
CREATE POLICY "Vault bank_accounts access" ON public.bank_accounts FOR ALL USING (true);

-- 5. Ensure balance increment function exists
CREATE OR REPLACE FUNCTION public.increment_bank_balance(account_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE public.bank_accounts
    SET current_balance = current_balance + amount
    WHERE id = account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. NOW create the views (depends on columns above)

CREATE OR REPLACE VIEW v_payroll_summaries AS
SELECT 
    ps.*,
    e.name        AS employee_name,
    e.employee_id AS employee_code
FROM payroll_summaries ps
LEFT JOIN employees e ON ps.employee_id = e.id;

CREATE OR REPLACE VIEW v_attendance_records AS
SELECT 
    ar.*,
    e.name        AS employee_name,
    e.employee_id AS employee_code
FROM attendance_records ar
LEFT JOIN employees e ON ar.employee_id = e.id;

CREATE OR REPLACE VIEW v_financial_recap AS
SELECT 
    ft.*,
    ba.name AS bank_name
FROM financial_transactions ft
LEFT JOIN bank_accounts ba ON ft.bank_account_id = ba.id;
