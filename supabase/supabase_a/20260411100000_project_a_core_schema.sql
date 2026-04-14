-- SiFatih Project A: Core & Identity Schema
-- Description: Core business logic, identity management, and active operations.
-- Date: 2026-04-11

-- I. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- II. CORE TABLES

-- 1. Roles Table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role_id UUID REFERENCES public.roles(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Master Queue Types
CREATE TABLE public.master_queue_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    base_point INTEGER DEFAULT 0,
    color TEXT DEFAULT '#6b7280',
    icon TEXT DEFAULT 'bi-ticket-detailed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Internet Packages
CREATE TABLE public.internet_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    price DECIMAL(12,2),
    speed TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Inventory Items
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    stock INTEGER DEFAULT 0,
    unit TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Employees Table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    position TEXT NOT NULL,
    status TEXT DEFAULT 'Aktif',
    role_id UUID REFERENCES public.roles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Customers Table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    customer_code TEXT UNIQUE,
    ktp TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    packet TEXT,
    install_date DATE,
    address TEXT NOT NULL,
    photo_ktp TEXT, -- Reference to Storage A
    photo_rumah TEXT, -- Reference to Storage B
    role_id UUID REFERENCES public.roles(id),
    billing_due_day INTEGER CHECK (billing_due_day >= 1 AND billing_due_day <= 28),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. PSB Registrations
CREATE TABLE public.psb_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    packet TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    photo_ktp TEXT,
    photo_rumah TEXT,
    status TEXT DEFAULT 'waiting',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. App Settings
CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_group TEXT DEFAULT 'general',
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Work Orders
CREATE TABLE public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id),
    employee_id UUID REFERENCES public.employees(id),
    type_id UUID REFERENCES public.master_queue_types(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'waiting',
    points INTEGER DEFAULT 0, -- Cached value after closure
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Work Order Assignments
CREATE TABLE public.work_order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    assignment_role TEXT NOT NULL DEFAULT 'member', -- 'lead' | 'member'
    assigned_at TIMESTAMPTZ DEFAULT now(),
    points_earned INTEGER DEFAULT 0, -- Distributed points
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (work_order_id, employee_id)
);

-- 12. Support Master Data
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- III. CORE FUNCTIONS

CREATE OR REPLACE FUNCTION public.has_any_role(roles TEXT[])
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.code = ANY(roles)
    );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_class()
RETURNS BOOLEAN AS $$
    SELECT public.has_any_role(ARRAY['S_ADM', 'OWNER', 'ADM']);
$$ LANGUAGE sql SECURITY DEFINER;

-- IV. RLS POLICIES (Simplified for fresh deployment)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for admin_class" ON public.roles FOR ALL USING (is_admin_class());
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin_class());

-- V. SEED DATA
INSERT INTO public.roles (name, code, description) VALUES
  ('Superadmin',   'S_ADM',     'Full system-level access'),
  ('Owner',        'OWNER',     'Business owner'),
  ('Admin',        'ADM',       'Day-to-day operations admin'),
  ('Bendahara',    'TREASURER', 'Finance monitoring'),
  ('SPV Teknisi',  'SPV_TECH',  'Supervisor'),
  ('Teknisi',      'TECH',      'Field technician'),
  ('Customer',     'CUST',      'Customer portal')
ON CONFLICT (code) DO NOTHING;
