-- SiFatih Project B: Vault & High-Volume Schema
-- Description: High-volume data, audit logs, financials, and archive records.
-- Date: 2026-04-11

-- I. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- II. VAULT TABLES

-- 1. Notification Queue
CREATE TABLE public.notification_queue (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient    TEXT        NOT NULL,
    message_type TEXT        NOT NULL,
    payload      JSONB       DEFAULT '{}',
    priority     INTEGER     NOT NULL DEFAULT 2,
    status       TEXT        NOT NULL DEFAULT 'pending',
    dedup_hash   TEXT        UNIQUE,
    scheduled_at TIMESTAMPTZ DEFAULT now(),
    sent_at      TIMESTAMPTZ,
    error_msg    TEXT,
    ref_id       UUID,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. Activity Logs (Audit Trail)
CREATE TABLE public.activity_logs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID, -- References auth.users(id) in Project A (via mapping or manual ID)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Technician Points Ledger (Heavy Volume)
CREATE TABLE public.technician_points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL, -- References Project A employees
    work_order_id UUID NOT NULL, -- References Project A work_orders
    points INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Financial Transactions
CREATE TABLE public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Customer Bills
CREATE TABLE public.customer_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL, -- References Project A
    period_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'unpaid', -- unpaid, paid, overdue
    paid_at TIMESTAMPTZ,
    secret_token UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (customer_id, period_date)
);

-- 6. Payroll System
CREATE TABLE public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.payroll_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    gross_earnings INTEGER NOT NULL DEFAULT 0,
    total_deductions INTEGER NOT NULL DEFAULT 0,
    take_home_pay INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. HR History Records (High Volume)
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT, -- present, late, absent
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.overtime_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(5,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- III. SECURITY (RLS)
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;

-- Note: Policies usually mirror Project A but are strictly controlled via Service Role or FDW mapping.
CREATE POLICY "Vault accessed only by authenticated" ON public.activity_logs FOR SELECT USING (true);
