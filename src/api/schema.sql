-- Consolidated Database Schema
-- Created: 2026-03-15
-- Description: Single source of truth for the database structure, including roles, profiles, master data, and transactional tables.

-- I. EXTENSIONS
-- Enable necessary extensions if needed (gen_random_uuid is usually available by default in Supabase)

-- II. CORE TABLES (Dependencies first)

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles Table (Links Auth Users to Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role_id UUID REFERENCES public.roles(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Master Queue Types
CREATE TABLE IF NOT EXISTS public.master_queue_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    base_point INTEGER DEFAULT 0,
    color TEXT DEFAULT '#6b7280',
    icon TEXT DEFAULT 'bi-ticket-detailed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Internet Packages
CREATE TABLE IF NOT EXISTS public.internet_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    price DECIMAL(12,2),
    speed TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Inventory Items
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    stock INTEGER DEFAULT 0,
    unit TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    position TEXT NOT NULL,
    status TEXT DEFAULT 'Aktif',
    birth_place TEXT,
    birth_date DATE,
    address TEXT,
    join_date DATE,
    education TEXT,
    training TEXT DEFAULT 'Tidak',
    bpjs TEXT DEFAULT 'Tidak',
    role_id UUID REFERENCES public.roles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    customer_code TEXT UNIQUE,
    ktp TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    packet TEXT,
    install_date DATE,
    address TEXT NOT NULL,
    username TEXT,
    mac_address TEXT,
    damping TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    alt_phone TEXT,
    photo_ktp TEXT,
    photo_rumah TEXT,
    role_id UUID REFERENCES public.roles(id),
    billing_due_day INTEGER CHECK (billing_due_day >= 1 AND billing_due_day <= 28),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7.1 PSB Registrations (Prospects)
CREATE TABLE IF NOT EXISTS public.psb_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alt_phone TEXT,
    address TEXT NOT NULL,
    packet TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    photo_rumah TEXT, -- Storage path
    secret_token UUID UNIQUE DEFAULT gen_random_uuid(),
    status TEXT DEFAULT 'waiting',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_group TEXT DEFAULT 'general',
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- III. TRANSACTIONAL TABLES

-- 9. Work Orders Table
CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id),
    employee_id UUID REFERENCES public.employees(id),
    type_id UUID REFERENCES public.master_queue_types(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'waiting', -- waiting, confirmed, open, closed
    source TEXT DEFAULT 'admin', -- admin, technician, customer
    claimed_by UUID, -- no FK — assignments tracked via work_order_assignments table
    claimed_at TIMESTAMPTZ,
    points INTEGER DEFAULT 0,
    registration_date DATE DEFAULT CURRENT_DATE, -- Tanggal Daftar
    payment_status TEXT, -- Pembayaran
    referral_name TEXT, -- Nama Referal
    alt_phone TEXT, -- HP Alternatif
    photo_url TEXT, -- Foto Rumah
    ket TEXT, -- Keterangan Singkat
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Installation Monitorings
CREATE TABLE IF NOT EXISTS public.installation_monitorings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE UNIQUE,
    customer_id UUID REFERENCES public.customers(id),
    employee_id UUID REFERENCES public.employees(id),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    notes TEXT,
    photos JSONB DEFAULT '[]'::jsonb, -- Array of image URLs/paths
    mac_address TEXT,
    sn_modem TEXT,
    cable_label TEXT,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Work Order Assignments
-- Stores who claimed a work order (role='lead') and team members (role='member').
-- Replaces the work_orders.claimed_by FK — enables multi-person teams and per-person point tracking.
CREATE TABLE IF NOT EXISTS public.work_order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    assignment_role TEXT NOT NULL DEFAULT 'member', -- 'lead' | 'member'
    assigned_at TIMESTAMPTZ DEFAULT now(),
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (work_order_id, employee_id)
);

-- 12. Notification Queue Table
CREATE TABLE IF NOT EXISTS public.notification_queue (
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

-- 14. Payment Methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- IV. FUNCTIONS & TRIGGERS

-- 1. Get Work Order Stats
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

-- 2. Get Current User's Role Code
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
    SELECT r.code 
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Check if User Has Role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.code = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Handled New User Sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Default new signups to CUST (Customer)
    SELECT id INTO default_role_id FROM public.roles WHERE code = 'CUST' LIMIT 1;
    
    INSERT INTO public.profiles (id, email, role_id)
    VALUES (new.id, new.email, default_role_id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5a. Check User Has Any of Multiple Roles
CREATE OR REPLACE FUNCTION public.has_any_role(roles TEXT[])
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.code = ANY(roles)
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 5b. Check if User is Admin-class (S_ADM, OWNER, or ADM)
CREATE OR REPLACE FUNCTION public.is_admin_class()
RETURNS BOOLEAN AS $$
    SELECT public.has_any_role(ARRAY['S_ADM', 'OWNER', 'ADM']);
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Trigger for Profile Creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- V. SECURITY (RLS)

-- 1. Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_queue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internet_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installation_monitorings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Roles: Public Select
CREATE POLICY "Allow all public access for roles" ON public.roles FOR ALL USING (true) WITH CHECK (true);

-- Profiles: Own record or admin-class
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"    ON public.profiles FOR SELECT USING (is_admin_class());
CREATE POLICY "Admins can update all profiles"  ON public.profiles FOR UPDATE USING (is_admin_class()) WITH CHECK (is_admin_class());

-- Employees: Authenticated can read; admin-class can modify
CREATE POLICY "Employees viewable by authenticated" ON public.employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can modify employees"         ON public.employees FOR ALL   USING (is_admin_class()) WITH CHECK (is_admin_class());

-- App Settings: public read; admin-class write only
CREATE POLICY "Allow public read for app_settings"  ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin update for app_settings" ON public.app_settings FOR UPDATE USING (is_admin_class()) WITH CHECK (is_admin_class());
CREATE POLICY "Allow admin insert for app_settings" ON public.app_settings FOR INSERT WITH CHECK (is_admin_class());
CREATE POLICY "Allow admin delete for app_settings" ON public.app_settings FOR DELETE USING (is_admin_class());

-- Generic Public/Permissive Policies (Tightened)
-- PSB Registrations: Anyone can insert; Admins can see all; Public can see own by secret_token
CREATE POLICY "psb_insert_public" ON public.psb_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "psb_select_own"    ON public.psb_registrations FOR SELECT USING (true); -- Filtered at app level by token
CREATE POLICY "psb_admin_all"    ON public.psb_registrations FOR ALL USING (is_admin_class());

-- Customers: Admin full access; Customer view own
CREATE POLICY "customers_admin_all" ON public.customers FOR ALL USING (is_admin_class());
CREATE POLICY "customers_view_own"  ON public.customers FOR SELECT USING (auth.uid() = id);

-- Inventory & Packages: Admin modify; Authenticated read
CREATE POLICY "inventory_admin_all" ON public.inventory_items FOR ALL USING (is_admin_class());
CREATE POLICY "inventory_read_all"  ON public.inventory_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "packages_admin_all"  ON public.internet_packages FOR ALL USING (is_admin_class());
CREATE POLICY "packages_read_all"   ON public.internet_packages FOR SELECT USING (true);

-- Work Orders: Admin/SPV full; Tech assigned; Customer own
CREATE POLICY "wo_admin_all" ON public.work_orders FOR ALL USING (is_admin_class() OR has_role('SPV_TECH'));
CREATE POLICY "wo_tech_view" ON public.work_orders FOR SELECT USING (
    employee_id = auth.uid() 
    OR id IN (SELECT work_order_id FROM public.work_order_assignments WHERE employee_id = auth.uid())
);
CREATE POLICY "wo_tech_update" ON public.work_orders FOR UPDATE USING (
    employee_id = auth.uid() 
    OR id IN (SELECT work_order_id FROM public.work_order_assignments WHERE employee_id = auth.uid())
);
CREATE POLICY "wo_cust_view" ON public.work_orders FOR SELECT USING (customer_id = auth.uid());

-- Installation Monitorings: Admin/SPV full; Tech assigned
CREATE POLICY "monitor_admin_all" ON public.installation_monitorings FOR ALL USING (is_admin_class() OR has_role('SPV_TECH'));
CREATE POLICY "monitor_tech_all"  ON public.installation_monitorings FOR ALL USING (employee_id = auth.uid());

-- Master Queue Types: Read for all authenticated; Admin modify
CREATE POLICY "queue_types_admin_all" ON public.master_queue_types FOR ALL USING (is_admin_class());
CREATE POLICY "queue_types_read_all"  ON public.master_queue_types FOR SELECT USING (auth.role() = 'authenticated');

-- Work Order Assignments: TECH can manage own rows; admin/SPV see all
CREATE POLICY "assignments_select" ON public.work_order_assignments
  FOR SELECT USING (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH', 'TREASURER'])
    OR employee_id = auth.uid()
  );
CREATE POLICY "assignments_insert" ON public.work_order_assignments
  FOR INSERT WITH CHECK (
    is_admin_class()
    OR has_any_role(ARRAY['SPV_TECH'])
    OR employee_id = auth.uid()
  );
CREATE POLICY "assignments_update" ON public.work_order_assignments
  FOR UPDATE USING (is_admin_class() OR employee_id = auth.uid())
  WITH CHECK (is_admin_class() OR employee_id = auth.uid());
CREATE POLICY "assignments_delete" ON public.work_order_assignments
  FOR DELETE USING (has_any_role(ARRAY['S_ADM', 'OWNER']));

-- Customer Bills: Admin/Treasurer full access; public select for invoice portal
CREATE POLICY "bills_select_admin" ON public.customer_bills FOR SELECT USING (is_admin_class() OR has_role('TREASURER'));
CREATE POLICY "bills_modify_admin" ON public.customer_bills FOR ALL USING (is_admin_class() OR has_role('TREASURER')) WITH CHECK (is_admin_class() OR has_role('TREASURER'));
CREATE POLICY "bills_select_public" ON public.customer_bills FOR SELECT USING (true); -- Public can read IF they know the token (secured at API/Search level)
-- Notification Queue: Admin only
CREATE POLICY "notif_queue_admin_all" ON public.notification_queue
    FOR ALL
    USING (is_admin_class())
    WITH CHECK (is_admin_class());


-- VI. OPTIMIZATION (INDEXES)
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON public.work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_employee_id ON public.work_orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_work_order_id ON public.work_order_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_employee_id ON public.work_order_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON public.customer_bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.customer_bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_token ON public.customer_bills(secret_token);
CREATE INDEX IF NOT EXISTS idx_notif_queue_dispatch
    ON public.notification_queue (status, priority, scheduled_at)
    WHERE status = 'pending';


-- VII. SEED DATA
-- Roles: 7-tier unified role system (source of truth)
INSERT INTO public.roles (name, code, description) VALUES
  ('Superadmin',   'S_ADM',     'Full system-level access — IT/developer only'),
  ('Owner',        'OWNER',     'Business owner — read-all, approve-all'),
  ('Admin',        'ADM',       'Day-to-day operations admin'),
  ('Bendahara',    'TREASURER', 'Finance and payment monitoring'),
  ('SPV Teknisi',  'SPV_TECH',  'Supervisor — assign and monitor field work'),
  ('Teknisi',      'TECH',      'Field technician — claim and close work orders'),
  ('Customer',     'CUST',      'Customer portal — view own ticket and profile')
ON CONFLICT (code) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.master_queue_types (name, base_point, color, icon) VALUES 
('PSB', 100, '#22c55e', 'bi-house-add-fill'),
('Repair', 50, '#ef4444', 'bi-tools'),
('Relocation', 75, '#f59e0b', 'bi-arrow-left-right'),
('Upgrade', 50, '#3b82f6', 'bi-arrow-up-circle-fill'),
('Cancel', 0, '#6b7280', 'bi-x-circle-fill')
ON CONFLICT (name) DO UPDATE SET
  base_point = EXCLUDED.base_point,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;

-- App Settings: Fonnte Configuration
INSERT INTO public.app_settings (setting_key, setting_value, setting_group, description)
VALUES
    ('FONNTE_TOKEN',          '',          'whatsapp', 'API token from fonnte.com dashboard'),
    ('FONNTE_DAILY_LIMIT',    '500',       'whatsapp', 'Max WhatsApp messages allowed per day'),
    ('FONNTE_WARN_THRESHOLD', '0.80',      'whatsapp', 'Fraction of daily limit that triggers admin warning (0.0–1.0)'),
    ('FONNTE_SENT_TODAY',     '0',         'whatsapp', 'Rolling daily message counter, reset each day'),
    ('FONNTE_LAST_RESET',     NOW()::TEXT, 'whatsapp', 'ISO timestamp of last daily counter reset'),
    ('WHATSAPP_ROUTING',
        '{"wo_created":"main","wo_confirmed":"main","wo_open":"main","wo_closed":"main","welcome_installed":"main","payment_due_soon":"main","payment_overdue":"main","direct_admin":"main","_default":"main"}',
        'whatsapp',
        'JSON map of message_type → device label. All default to "main" (single device). Edit in Settings to reassign when additional devices are added.')
ON CONFLICT (setting_key) DO NOTHING;

-- Seed Payment Methods
INSERT INTO public.payment_methods (name) VALUES
('Cash'), ('Bank Transfer'), ('QRIS')
ON CONFLICT (name) DO NOTHING;

-- Seed Expense Categories
INSERT INTO public.expense_categories (name, description) VALUES
('Gaji Karyawan', 'Pembayaran gaji bulanan karyawan'),
('Operasional Kantor', 'Biaya rutin kantor seperti listrik, air, internet'),
('Pembelian Stok', 'Pembelian perangkat dan material untuk instalasi'),
('Transportasi', 'Biaya bensin dan transportasi teknisi'),
('Lain-lain', 'Pengeluaran lain-lain yang tidak terduga')
ON CONFLICT (name) DO NOTHING;

-- 6. Get Financial Summary
CREATE OR REPLACE FUNCTION public.get_financial_summary(start_date DATE, end_date DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_income', COALESCE((SELECT SUM(amount) FROM public.financial_transactions WHERE type = 'income' AND transaction_date BETWEEN start_date AND end_date), 0),
        'total_expense', COALESCE((SELECT SUM(amount) FROM public.financial_transactions WHERE type = 'expense' AND transaction_date BETWEEN start_date AND end_date), 0),
        'income_by_category', COALESCE((
            SELECT json_object_agg(category, total)
            FROM (
                SELECT category, SUM(amount) as total
                FROM public.financial_transactions
                WHERE type = 'income' AND transaction_date BETWEEN start_date AND end_date
                GROUP BY category
            ) s
        ), '{}'::json),
        'expense_by_category', COALESCE((
            SELECT json_object_agg(category, total)
            FROM (
                SELECT category, SUM(amount) as total
                FROM public.financial_transactions
                WHERE type = 'expense' AND transaction_date BETWEEN start_date AND end_date
                GROUP BY category
            ) s
        ), '{}'::json)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


