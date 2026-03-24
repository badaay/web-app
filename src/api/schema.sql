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
    created_at TIMESTAMPTZ DEFAULT now()
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
    work_order_id UUID REFERENCES public.work_orders(id) UNIQUE,
    customer_id UUID REFERENCES public.customers(id),
    employee_id UUID REFERENCES public.employees(id),
    planned_date DATE,
    actual_date DATE,
    activation_date DATE,
    photo_proof TEXT,
    mac_address TEXT,
    sn_modem TEXT,
    cable_label TEXT,
    notes TEXT,
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
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installation_monitorings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_assignments ENABLE ROW LEVEL SECURITY;

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

-- Generic Public/Permissive Policies (Can be tightened later per business logic)
CREATE POLICY "Enable all for anyone" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anyone" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anyone" ON public.internet_packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anyone" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anyone" ON public.installation_monitorings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anyone" ON public.master_queue_types FOR ALL USING (true) WITH CHECK (true);

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


-- VI. OPTIMIZATION (INDEXES)
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON public.work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_employee_id ON public.work_orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_work_order_id ON public.work_order_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_employee_id ON public.work_order_assignments(employee_id);


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
  
  
