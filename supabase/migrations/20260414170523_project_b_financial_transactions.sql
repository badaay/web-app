
-- 13. Financial Transactions (Ledger)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method TEXT,
    reference_id TEXT, -- e.g., bill_id, employee_id for salary
    created_by UUID REFERENCES auth.users(id), -- Foreign key to the user who created the transaction.
    created_at TIMESTAMPTZ DEFAULT now()
);


ALTER TABLE public.financial_transactions DISABLE ROW LEVEL SECURITY;