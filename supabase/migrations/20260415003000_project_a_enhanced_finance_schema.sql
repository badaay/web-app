-- Migration: Enhanced Finance Schema
-- Date: 2026-04-15

-- 1. Create Bank Accounts Table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    account_number TEXT,
    account_holder TEXT,
    is_active BOOLEAN DEFAULT true,
    current_balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Bank Balance Snapshots Table
CREATE TABLE IF NOT EXISTS public.bank_balance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) NOT NULL,
    snapshot_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID, -- Refers to profiles id in Project A
    notes TEXT
);

-- 3. Modify Financial Transactions Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='payment_date') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN payment_date TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='bank_account_id') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN bank_account_id UUID REFERENCES public.bank_accounts(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='is_verified') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='verified_at') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='verified_by_profile_id') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN verified_by_profile_id UUID;
    END IF;
END $$;

-- 4. Seed Bank Accounts
INSERT INTO public.bank_accounts (name, account_number, account_holder) VALUES
('BCA', '1234567890', 'Mitra Flow'),
('BSI', '0987654321', 'Mitra Flow'),
('Tunai', '-', 'Kas Kantor')
ON CONFLICT (name) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_balance_snapshots ENABLE ROW LEVEL SECURITY;

-- 6. Basic Policies (Allow all authenticated for now, similar to other vault tables)
DROP POLICY IF EXISTS "Vault bank_accounts access" ON public.bank_accounts;
CREATE POLICY "Vault bank_accounts access" ON public.bank_accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Vault bank_balance_snapshots access" ON public.bank_balance_snapshots;
CREATE POLICY "Vault bank_balance_snapshots access" ON public.bank_balance_snapshots FOR ALL USING (true);

-- 7. Functions
CREATE OR REPLACE FUNCTION public.increment_bank_balance(account_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE public.bank_accounts
    SET current_balance = current_balance + amount
    WHERE id = account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
