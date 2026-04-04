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
    total_points INTEGER DEFAULT 0,
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
    photo_ktp TEXT,
    photo_rumah TEXT,
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

-- 12. Customer Bills Table
-- Stores monthly billing records and tracking for payments.
CREATE TABLE IF NOT EXISTS public.customer_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    period_date DATE NOT NULL,
    due_date DATE,
    amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'unpaid',
    payment_method TEXT,
    payment_date TIMESTAMPTZ,
    secret_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (customer_id, period_date)
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

-- 2. Close Work Order and Calculate Points
CREATE OR REPLACE FUNCTION public.close_work_order_with_points(
    p_work_order_id UUID,
    p_close_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_base_point INTEGER;
    v_type_id UUID;
    v_customer_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Get work order info
    SELECT type_id, customer_id INTO v_type_id, v_customer_id
    FROM public.work_orders
    WHERE id = p_work_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Work order not found');
    END IF;

    -- 2. Get base points for this type
    SELECT base_point INTO v_base_point
    FROM public.master_queue_types
    WHERE id = v_type_id;

    -- 3. Update work order status and metadata
    UPDATE public.work_orders
    SET 
        status = 'closed',
        completed_at = now(),
        points = COALESCE(v_base_point, 0),
        updated_at = now()
    WHERE id = p_work_order_id;

    -- 4. Update installation_monitorings (where mac and notes actually live)
    UPDATE public.installation_monitorings
    SET
        mac_address = COALESCE((p_close_data->>'mac_address'), mac_address),
        notes = COALESCE((p_close_data->>'notes'), notes),
        photo_proof = COALESCE((p_close_data->>'photo_proof'), photo_proof),
        actual_date = COALESCE((p_close_data->>'actual_date')::DATE, now()::DATE),
        updated_at = now()
    WHERE work_order_id = p_work_order_id;

    -- 5. Update customer technical data (damping lives here)
    IF v_customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET 
            mac_address = COALESCE((p_close_data->>'mac_address'), mac_address),
            damping = COALESCE((p_close_data->>'damping'), damping)
        WHERE id = v_customer_id;
    END IF;

    -- 6. Distribute points to assigned technicians
    -- Lead and members get full base_point
    UPDATE public.work_order_assignments
    SET points_earned = COALESCE(v_base_point, 0)
    WHERE work_order_id = p_work_order_id;

    -- 7. Aggregate points to employee profile
    UPDATE public.employees e
    SET total_points = e.total_points + COALESCE(v_base_point, 0)
    FROM public.work_order_assignments a
    WHERE a.work_order_id = p_work_order_id
      AND a.employee_id = e.id;

    RETURN jsonb_build_object(
        'success', true, 
        'points_awarded', v_base_point,
        'message', 'Work order closed and points distributed'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Current User's Role Code
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
CREATE POLICY "Enable all for anyone" ON public.psb_registrations FOR ALL USING (true) WITH CHECK (true);
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
  

-- =============================================================
-- PHASE 2: Payment & Payroll Schema Extension
-- =============================================================

-- 1. Employee Table Extensions
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS base_salary INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_bpjs_enrolled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_monthly_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- 2. App Settings — Salary Config
INSERT INTO public.app_settings (setting_key, setting_value, setting_group, description) VALUES
('work_start_time',        '08:00',   'payroll', 'Daily work start time for attendance tracking'),
('late_rate_per_hour',     '20000',   'payroll', 'Deduction rate per hour of lateness (IDR)'),
('late_max_daily',         '20000',   'payroll', 'Maximum daily late deduction (IDR)'),
('overtime_start_time',    '16:30',   'payroll', 'Overtime starts after this time'),
('overtime_rate_per_hour', '10000',   'payroll', 'Overtime pay rate per hour (IDR)'),
('point_deduction_rate',   '11600',   'payroll', 'Deduction per point below monthly target (IDR)'),
('bpjs_fixed_amount',      '194040',  'payroll', 'Fixed BPJS Ketenagakerjaan deduction amount (IDR)')
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Employee Salary Configs (Historical Tracking)
CREATE TABLE IF NOT EXISTS public.employee_salary_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    position_allowance       INTEGER DEFAULT 0,
    additional_allowance     INTEGER DEFAULT 0,
    quota_allowance          INTEGER DEFAULT 0,
    education_allowance      INTEGER DEFAULT 0,
    transport_meal_allowance INTEGER DEFAULT 0,
    bpjs_company_contribution INTEGER DEFAULT 0,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to   DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_effective_period CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_employee_salary_configs_employee  ON public.employee_salary_configs(employee_id);
ALTER TABLE public.employee_salary_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage salary configs" ON public.employee_salary_configs FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());
CREATE POLICY "Employees can view own salary config" ON public.employee_salary_configs FOR SELECT USING (employee_id = auth.uid());

-- 4. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time   TIME,
    check_out_time  TIME,
    late_minutes     INTEGER DEFAULT 0,
    is_absent        BOOLEAN DEFAULT false,
    deduction_amount INTEGER DEFAULT 0,
    source      TEXT DEFAULT 'manual',
    external_id TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    created_by  UUID REFERENCES public.employees(id),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date     ON public.attendance_records(attendance_date);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage attendance" ON public.attendance_records FOR ALL USING (public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH'])) WITH CHECK (public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH']));
CREATE POLICY "Employees can view own attendance" ON public.attendance_records FOR SELECT USING (employee_id = auth.uid());

-- 5. Overtime Records
CREATE TABLE IF NOT EXISTS public.overtime_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overtime_date DATE NOT NULL,
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    description   TEXT NOT NULL,
    overtime_type TEXT,
    total_hours  DECIMAL(5,2) NOT NULL,
    hourly_rate  INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    work_order_id UUID REFERENCES public.work_orders(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view overtime" ON public.overtime_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage overtime" ON public.overtime_records FOR ALL USING (public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH'])) WITH CHECK (public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH']));

-- 6. Overtime Assignments
CREATE TABLE IF NOT EXISTS public.overtime_assignments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overtime_id  UUID NOT NULL REFERENCES public.overtime_records(id) ON DELETE CASCADE,
    employee_id  UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    amount_earned INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (overtime_id, employee_id)
);

ALTER TABLE public.overtime_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own overtime assignments" ON public.overtime_assignments FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Admins can manage overtime assignments" ON public.overtime_assignments FOR ALL USING (public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH'])) WITH CHECK (public.has_any_role(ARRAY['S_ADM','OWNER','ADM','SPV_TECH']));

-- 7. Payroll Periods
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year  INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    period_start DATE NOT NULL,
    period_end   DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','calculating','calculated','approved','paid')),
    calculated_at TIMESTAMPTZ,
    approved_at   TIMESTAMPTZ,
    paid_at       TIMESTAMPTZ,
    approved_by   UUID REFERENCES public.employees(id),
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (year, month),
    CONSTRAINT valid_period_dates CHECK (period_end >= period_start)
);

ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view payroll periods" ON public.payroll_periods FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage payroll periods" ON public.payroll_periods FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- 8. Payroll Summaries & Items
CREATE TABLE IF NOT EXISTS public.payroll_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id       UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    component_type TEXT NOT NULL CHECK (component_type IN ('earning','deduction')),
    component_code TEXT NOT NULL,
    component_name TEXT NOT NULL,
    amount         INTEGER NOT NULL,
    calculation_details JSONB,
    is_manual_override  BOOLEAN DEFAULT false,
    override_reason     TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (payroll_period_id, employee_id, component_code)
);

ALTER TABLE public.payroll_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own payroll items" ON public.payroll_line_items FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Admins can manage payroll items" ON public.payroll_line_items FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

CREATE TABLE IF NOT EXISTS public.payroll_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id       UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    gross_earnings   INTEGER NOT NULL DEFAULT 0,
    total_deductions INTEGER NOT NULL DEFAULT 0,
    take_home_pay    INTEGER NOT NULL DEFAULT 0,
    target_points INTEGER DEFAULT 0,
    actual_points INTEGER DEFAULT 0,
    point_shortage INTEGER DEFAULT 0,
    days_present INTEGER DEFAULT 0,
    days_late    INTEGER DEFAULT 0,
    days_absent  INTEGER DEFAULT 0,
    overtime_hours  DECIMAL(5,2) DEFAULT 0,
    overtime_amount INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (payroll_period_id, employee_id)
);

ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own payroll summary" ON public.payroll_summaries FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Admins can manage payroll summaries" ON public.payroll_summaries FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

CREATE TABLE IF NOT EXISTS public.payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id       UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('bonus','deduction')),
    amount          INTEGER NOT NULL CHECK (amount > 0),
    reason          TEXT NOT NULL,
    requested_by UUID REFERENCES public.employees(id),
    approved_by  UUID REFERENCES public.employees(id),
    approved_at  TIMESTAMPTZ,
    status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own adjustments" ON public.payroll_adjustments FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Admins can manage adjustments" ON public.payroll_adjustments FOR ALL USING (public.is_admin_class()) WITH CHECK (public.is_admin_class());

-- HR Functions
CREATE OR REPLACE FUNCTION public.calculate_late_deduction(p_check_in_time TIME, p_is_absent BOOLEAN DEFAULT false) RETURNS INTEGER AS $$
DECLARE
    v_work_start     TIME;
    v_rate_per_hour  INTEGER;
    v_max_daily      INTEGER;
    v_late_minutes   INTEGER;
    v_deduction      INTEGER;
BEGIN
    SELECT setting_value::TIME    INTO v_work_start    FROM public.app_settings WHERE setting_key = 'work_start_time';
    SELECT setting_value::INTEGER INTO v_rate_per_hour FROM public.app_settings WHERE setting_key = 'late_rate_per_hour';
    SELECT setting_value::INTEGER INTO v_max_daily     FROM public.app_settings WHERE setting_key = 'late_max_daily';
    v_work_start    := COALESCE(v_work_start, '08:00'::TIME);
    v_rate_per_hour := COALESCE(v_rate_per_hour, 20000);
    v_max_daily     := COALESCE(v_max_daily, 20000);
    IF p_is_absent OR p_check_in_time IS NULL THEN RETURN v_max_daily; END IF;
    IF p_check_in_time <= v_work_start THEN RETURN 0; END IF;
    v_late_minutes := EXTRACT(EPOCH FROM (p_check_in_time - v_work_start)) / 60;
    v_deduction := FLOOR((v_late_minutes::DECIMAL / 60) * v_rate_per_hour);
    RETURN LEAST(v_deduction, v_max_daily);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.calculate_point_deduction(p_employee_id UUID, p_year INTEGER, p_month INTEGER) RETURNS TABLE (target_points INTEGER, actual_points INTEGER, point_shortage INTEGER, deduction_amount INTEGER) AS $$
DECLARE
    v_target INTEGER; v_actual INTEGER; v_rate   INTEGER;
BEGIN
    SELECT e.target_monthly_points INTO v_target FROM public.employees e WHERE e.id = p_employee_id;
    v_target := COALESCE(v_target, 0);
    SELECT COALESCE(SUM(woa.points_earned), 0) INTO v_actual FROM public.work_order_assignments woa JOIN public.work_orders wo ON wo.id = woa.work_order_id WHERE woa.employee_id = p_employee_id AND EXTRACT(YEAR FROM wo.completed_at) = p_year AND EXTRACT(MONTH FROM wo.completed_at) = p_month AND wo.status = 'closed';
    SELECT setting_value::INTEGER INTO v_rate FROM public.app_settings WHERE setting_key = 'point_deduction_rate';
    v_rate := COALESCE(v_rate, 11600);
    RETURN QUERY SELECT v_target, v_actual, CASE WHEN v_actual < v_target THEN v_target - v_actual ELSE 0 END, CASE WHEN v_actual < v_target THEN (v_target - v_actual) * v_rate ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
