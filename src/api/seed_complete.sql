-- ============================================================
-- COMPLETE DATABASE SEEDER
-- Project: SiFatih Web Application
-- Date: 2026-03-19
-- Purpose: Full clean reset — drop all data and reseed.
--          Run in Supabase SQL Editor (as postgres / service role).
--          Auth users are handled separately by seed_auth.js.
-- ============================================================

-- ============================================================
-- STEP 0: CLEAN SLATE — Truncate all tables (respect FK order)
-- ============================================================
TRUNCATE TABLE public.customer_bills CASCADE;
TRUNCATE TABLE public.work_order_assignments CASCADE;
TRUNCATE TABLE public.installation_monitorings CASCADE;
TRUNCATE TABLE public.psb_registrations CASCADE;
TRUNCATE TABLE public.work_orders CASCADE;
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.employees CASCADE;
TRUNCATE TABLE public.inventory_items CASCADE;
TRUNCATE TABLE public.internet_packages CASCADE;
TRUNCATE TABLE public.master_queue_types CASCADE;
TRUNCATE TABLE public.app_settings CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.roles CASCADE;

-- ============================================================
-- STEP 1: ROLES
-- Source of truth: seed_data.js role codes (more granular)
-- ============================================================
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

-- ============================================================
-- STEP 2: MASTER QUEUE TYPES
-- ============================================================
INSERT INTO public.master_queue_types (name, base_point, color, icon) VALUES
  ('PSB',        100, '#22c55e', 'bi-house-add-fill'),
  ('Repair',      50, '#ef4444', 'bi-tools'),
  ('Relocation',  75, '#f59e0b', 'bi-arrow-left-right'),
  ('Upgrade',     50, '#3b82f6', 'bi-arrow-up-circle-fill'),
  ('Cancel',       0, '#6b7280', 'bi-x-circle-fill')
ON CONFLICT (name) DO UPDATE SET
  base_point = EXCLUDED.base_point,
  color      = EXCLUDED.color,
  icon       = EXCLUDED.icon;

-- ============================================================
-- STEP 3: INTERNET PACKAGES
-- ============================================================
INSERT INTO public.internet_packages (name, price, speed, description) VALUES
  ('Paket Hemat 15Mbps',   166000,  '15Mbps',  'Paket entry level untuk rumahan ringan'),
  ('Paket Rumahan 20Mbps', 175000,  '20Mbps',  'Paket standar untuk keluarga'),
  ('Paket Plus 25Mbps',    200000,  '25Mbps',  'Paket menengah streaming HD'),
  ('Paket Prima 35Mbps',   250000,  '35Mbps',  'Paket kerja dari rumah'),
  ('Paket Unggulan 50Mbps',350000,  '50Mbps',  'Paket premium gaming dan bisnis')
ON CONFLICT (name) DO UPDATE SET
  price       = EXCLUDED.price,
  speed       = EXCLUDED.speed,
  description = EXCLUDED.description;

-- ============================================================
-- STEP 4: INVENTORY ITEMS
-- ============================================================
INSERT INTO public.inventory_items (name, stock, unit, category) VALUES
  ('Kabel FO Drop 1 Core',   2000, 'Meter',  'Kabel'),
  ('Kabel FO Drop 2 Core',    500, 'Meter',  'Kabel'),
  ('Kabel UTP Cat6',         1000, 'Meter',  'Kabel'),
  ('Modem ONT ZTE F601',       50, 'Unit',   'Perangkat'),
  ('Modem ONT Huawei HG8310M', 30, 'Unit',   'Perangkat'),
  ('Splitter 1:4',             80, 'Buah',   'Aksesoris'),
  ('Splitter 1:8',             40, 'Buah',   'Aksesoris'),
  ('Closure Aerial 2 Port',    25, 'Buah',   'Aksesoris'),
  ('Closure Aerial 4 Port',    15, 'Buah',   'Aksesoris'),
  ('Tiang Besi 7m',            20, 'Batang', 'Infrastruktur'),
  ('Konektor SC/APC',         200, 'Buah',   'Konektor'),
  ('Konektor SC/UPC',         150, 'Buah',   'Konektor'),
  ('Power Supply Adaptor 12V', 30, 'Unit',   'Perangkat')
ON CONFLICT (name) DO UPDATE SET
  stock    = EXCLUDED.stock,
  unit     = EXCLUDED.unit,
  category = EXCLUDED.category;

-- ============================================================
-- STEP 5: APP SETTINGS
-- ============================================================
INSERT INTO public.app_settings (setting_key, setting_value, setting_group, description) VALUES
  ('company_name',        'SiFatih Net',              'general',    'Nama perusahaan'),
  ('company_phone',       '081234567890',              'general',    'Nomor telepon kantor'),
  ('company_address',     'Bangkalan, Madura',         'general',    'Alamat kantor'),
  ('company_email',       'admin@sifatih.id',          'general',    'Email perusahaan'),
  ('auth_domain_suffix',  '@sifatih.id',               'auth',       'Domain suffix untuk login shortcode'),
  ('default_role_code',   'CUST',                      'auth',       'Role default untuk user baru'),
  ('maps_default_lat',    '-7.053',                    'map',        'Latitude pusat peta default'),
  ('maps_default_lng',    '112.737',                   'map',        'Longitude pusat peta default'),
  ('maps_default_zoom',   '12',                        'map',        'Zoom level peta default'),
  ('psb_require_ktp',     'true',                      'workflow',   'Wajib upload foto KTP saat PSB'),
  ('wo_auto_assign',      'false',                     'workflow',   'Auto-assign work order ke teknisi tersedia'),
  ('FONNTE_TOKEN',        'ym2qun7QSnJ7a1nEYRQF',      'whatsapp',    'API token from fonnte.com dashboard'),
  ('FONNTE_DAILY_LIMIT',  '500',                       'whatsapp',   'Max WhatsApp messages allowed per day'),
  ('FONNTE_WARN_THRESHOLD', '0.80',                    'whatsapp',   'Fraction of daily limit that triggers admin warning'),
  ('FONNTE_SENT_TODAY',   '0',                         'whatsapp',   'Rolling daily message counter, reset each day'),
  ('FONNTE_LAST_RESET',   NOW()::TEXT,                 'whatsapp',   'ISO timestamp of last daily counter reset'),
  ('WHATSAPP_ROUTING',    '{"wo_created":"main","wo_confirmed":"main","wo_open":"main","wo_closed":"main","welcome_installed":"main","payment_due_soon":"main","payment_overdue":"main","direct_admin":"main","_default":"main"}', 'whatsapp', 'JSON map of message_type to device label')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description   = EXCLUDED.description;

-- ============================================================
-- STEP 5.5: PROFILES (Link auth users to roles)
-- This must come AFTER roles but BEFORE employees reference roles.
-- NOTE: The profile.id values are obtained from auth.users table
--       If auth users don't exist yet, run seed_auth.js first.
-- ============================================================
-- We'll insert profiles after employees are created (Step 6 → Step 6.5)

-- ============================================================
-- STEP 6: EMPLOYEES
-- NOTE: email must match auth user email (employee_id@sifatih.id)
-- Auth users are created by seed_auth.js — IDs will be linked
-- by the handle_new_user trigger -> profiles table.
-- employee.id will be synced after auth user creation.
-- ============================================================
INSERT INTO public.employees (name, employee_id, email, position, status, birth_place, birth_date, address, join_date, education, training, bpjs, role_id) 
SELECT
  emp.name, emp.employee_id, emp.email, emp.position, emp.status,
  emp.birth_place, emp.birth_date::DATE, emp.address, emp.join_date::DATE,
  emp.education, emp.training, emp.bpjs,
  r.id AS role_id
FROM (VALUES
  ('Muhammad Rifqi Arifandi', '202101001', '202101001@sifatih.id', 'Owner',       'Non-Aktif', 'Situbondo', '1994-12-24', 'Bangkalan', '2021-01-01', 'S1',  'Ya', 'Ya', 'OWNER'),
  ('Sitti Sulaihah',          '202101002', '202101002@sifatih.id', 'Bendahara',   'Non-Aktif', 'Pamekasan', '1995-01-31', 'Bangkalan', '2021-01-01', 'S2',  'Ya', 'Ya', 'TREASURER'),
  ('Fungki Gunawan',          '202408003', '202408003@sifatih.id', 'SPV Teknisi', 'Aktif',     'Bangkalan', '2006-08-11', 'Bangkalan', '2024-08-01', 'SMK', 'Ya', 'Ya', 'SPV_TECH'),
  ('Aulia Farida',            '202509007', '202509007@sifatih.id', 'Admin',       'Aktif',     'Bangkalan', '2008-01-15', 'Bangkalan', '2025-09-01', 'SMA', 'Ya', 'Ya', 'ADM'),
  ('Ali Wafa',                '202512008', '202512008@sifatih.id', 'Teknisi',     'Aktif',     'Bangkalan', '2005-05-26', 'Bangkalan', '2025-12-01', 'SMA', 'Ya', 'Ya', 'TECH'),
  ('Abdul Wahid Hasyim',      '202602009', '202602009@sifatih.id', 'Teknisi',     'Aktif',     'Jakarta',   '1980-03-22', 'Bangkalan', '2026-02-01', 'SMA', 'Ya', 'Ya', 'TECH'),
  ('Super Admin',             'SA001',     'SA001@sifatih.id',     'IT Admin',    'Aktif',     'Jakarta',   '1990-01-01', 'Jakarta',   '2021-01-01', 'S1',  'Ya', 'Ya', 'S_ADM')
) AS emp(name, employee_id, email, position, status, birth_place, birth_date, address, join_date, education, training, bpjs, role_code)
JOIN public.roles r ON r.code = emp.role_code
ON CONFLICT (employee_id) DO UPDATE SET
  name       = EXCLUDED.name,
  email      = EXCLUDED.email,
  position   = EXCLUDED.position,
  status     = EXCLUDED.status,
  role_id    = EXCLUDED.role_id;

-- ============================================================
-- STEP 6.5: LINK PROFILES TO EMPLOYEES (Auth users → Profiles)
-- This creates profiles for all seeded employees.
-- The auth user must exist first (run seed_auth.js).
-- ============================================================
INSERT INTO public.profiles (id, email, role_id)
SELECT
  au.id,
  au.email,
  (SELECT id FROM public.roles WHERE code = emp.role_code)
FROM auth.users au
JOIN (
  SELECT email, 
    CASE position
      WHEN 'Owner'       THEN 'OWNER'
      WHEN 'Bendahara'   THEN 'TREASURER'
      WHEN 'SPV Teknisi' THEN 'SPV_TECH'
      WHEN 'Teknisi'     THEN 'TECH'
      WHEN 'Admin'       THEN 'ADM'
      WHEN 'IT Admin'    THEN 'S_ADM'
      ELSE 'CUST'
    END AS role_code
  FROM public.employees
) emp ON au.email = emp.email
ON CONFLICT (id) DO UPDATE SET
  role_id = EXCLUDED.role_id;

-- ============================================================
-- STEP 8: CUSTOMERS (3 real + 5 test)
-- ============================================================
INSERT INTO public.customers (name, customer_code, phone, email, packet, address, install_date, mac_address, lat, lng, role_id, billing_due_day)
SELECT
  c.name, c.customer_code, c.phone, c.email, c.packet,
  c.address, c.install_date::DATE, c.mac_address,
  c.lat::DOUBLE PRECISION, c.lng::DOUBLE PRECISION,
  r.id AS role_id, c.billing_due_day
FROM (VALUES
  -- Real customers (existing)
  ('FATMAWATI',   '25094031501', '82333015005',  '25094031501@sifatih.id', '175K 20Mbps',     'Mrecah, Bangkalan',        '2025-11-27', '08:ED:ED:B1:43:F8', '-7.0610', '112.7320', 'CUST', 10),
  ('ISNAWIYAH',   '25094031601', '85230845589',  '25094031601@sifatih.id', '175K 20Mbps',     'Mrecah, Bangkalan',        '2025-11-29', '48:A9:8A:36:F7:4A', '-7.0615', '112.7315', 'CUST', 10),
  ('HASIB',       '25094031701', '83850126625',  '25094031701@sifatih.id', '175K 20Mbps',     'Mrecah, Bangkalan',        '2025-11-29', '08:ED:ED:B1:43:F9', '-7.0620', '112.7310', 'CUST', 10),
  -- Test customers
  ('BUDI SANTOSO','26030000101', '81111111101',  '26030000101@sifatih.id', 'Paket Plus 25Mbps','Jl. Raya Bangkalan No. 1', '2026-01-10', 'AA:BB:CC:DD:EE:01', '-7.0530', '112.7380', 'CUST', 15),
  ('SITI RAHAYU', '26030000201', '81111111102',  '26030000201@sifatih.id', 'Paket Prima 35Mbps','Jl. Raya Bangkalan No. 2','2026-01-15', 'AA:BB:CC:DD:EE:02', '-7.0540', '112.7390', 'CUST', 15),
  ('AHMAD FAUZI', '26030000301', '81111111103',  '26030000301@sifatih.id', 'Paket Hemat 15Mbps','Jl. Raya Bangkalan No. 3','2026-02-01', 'AA:BB:CC:DD:EE:03', '-7.0550', '112.7400', 'CUST', 15),
  ('DEWI LESTARI','26030000401', '81111111104',  '26030000401@sifatih.id', 'Paket Unggulan 50Mbps','Desa Burneh, Bangkalan','2026-02-10', 'AA:BB:CC:DD:EE:04', '-7.0560', '112.7410', 'CUST', 20),
  ('HASAN BASRI', '26030000501', '81111111105',  '26030000501@sifatih.id', 'Paket Rumahan 20Mbps','Desa Kamal, Bangkalan', '2026-03-01', 'AA:BB:CC:DD:EE:05', '-7.0570', '112.7420', 'CUST', 20)
) AS c(name, customer_code, phone, email, packet, address, install_date, mac_address, lat, lng, role_code, billing_due_day)
JOIN public.roles r ON r.code = c.role_code
ON CONFLICT (customer_code) DO UPDATE SET
  name       = EXCLUDED.name,
  phone      = EXCLUDED.phone,
  email      = EXCLUDED.email,
  packet     = EXCLUDED.packet,
  address    = EXCLUDED.address,
  role_id    = EXCLUDED.role_id;

-- ============================================================
-- STEP 9: WORK ORDERS (Test scenarios covering all statuses)
-- ============================================================
WITH
  emp_ali   AS (SELECT id FROM public.employees WHERE employee_id = '202512008' LIMIT 1),
  emp_wahid AS (SELECT id FROM public.employees WHERE employee_id = '202602009' LIMIT 1),
  emp_fungki AS (SELECT id FROM public.employees WHERE employee_id = '202408003' LIMIT 1),
  cust_fat  AS (SELECT id FROM public.customers WHERE customer_code = '25094031501' LIMIT 1),
  cust_isn  AS (SELECT id FROM public.customers WHERE customer_code = '25094031601' LIMIT 1),
  cust_has  AS (SELECT id FROM public.customers WHERE customer_code = '25094031701' LIMIT 1),
  cust_budi AS (SELECT id FROM public.customers WHERE customer_code = '26030000101' LIMIT 1),
  cust_siti AS (SELECT id FROM public.customers WHERE customer_code = '26030000201' LIMIT 1),
  cust_ahm  AS (SELECT id FROM public.customers WHERE customer_code = '26030000301' LIMIT 1),
  qt_psb    AS (SELECT id FROM public.master_queue_types WHERE name = 'PSB' LIMIT 1),
  qt_repair AS (SELECT id FROM public.master_queue_types WHERE name = 'Repair' LIMIT 1),
  qt_upgrade AS (SELECT id FROM public.master_queue_types WHERE name = 'Upgrade' LIMIT 1)
INSERT INTO public.work_orders (
  customer_id, employee_id, type_id,
  title, description, status, source,
  claimed_by, claimed_at, points,
  registration_date, payment_status, ket
)
SELECT
  wo.customer_id, wo.employee_id, wo.type_id,
  wo.title, wo.description, wo.status, wo.source,
  wo.claimed_by, wo.claimed_at, wo.points::INTEGER,
  wo.registration_date::DATE, wo.payment_status, wo.ket
FROM (VALUES
  -- Status: waiting (baru masuk, belum diproses)
  ((SELECT id FROM cust_budi), NULL, (SELECT id FROM qt_psb),
   'PSB - BUDI SANTOSO', 'Pendaftaran baru area Bangkalan Kota', 'waiting', 'customer',
   NULL, NULL, 0, '2026-03-01', 'Belum Bayar', 'Menunggu konfirmasi admin'),

  ((SELECT id FROM cust_siti), NULL, (SELECT id FROM qt_psb),
   'PSB - SITI RAHAYU', 'Pendaftaran baru area Bangkalan Kota', 'waiting', 'admin',
   NULL, NULL, 0, '2026-03-05', 'Belum Bayar', 'Menunggu konfirmasi admin'),

  -- Status: confirmed (sudah dikonfirmasi, menunggu teknisi)
  ((SELECT id FROM cust_fat), (SELECT id FROM emp_ali), (SELECT id FROM qt_psb),
   'PSB - FATMAWATI', 'Instalasi baru area Mrecah', 'confirmed', 'admin',
   NULL, NULL, 0, '2025-11-20', 'Lunas', 'Siap dijadwalkan'),

  ((SELECT id FROM cust_isn), (SELECT id FROM emp_ali), (SELECT id FROM qt_psb),
   'PSB - ISNAWIYAH', 'Instalasi baru area Mrecah', 'confirmed', 'admin',
   NULL, NULL, 0, '2025-11-22', 'Lunas', 'Siap dijadwalkan'),

  -- Status: open (sedang dikerjakan teknisi)
  ((SELECT id FROM cust_has), (SELECT id FROM emp_wahid), (SELECT id FROM qt_psb),
   'PSB - HASIB', 'Instalasi baru area Mrecah', 'open', 'admin',
   (SELECT id FROM emp_wahid), NOW() - INTERVAL '2 hours', 0,
   '2025-11-25', 'Lunas', 'Teknisi sudah di lokasi'),

  ((SELECT id FROM cust_ahm), (SELECT id FROM emp_ali), (SELECT id FROM qt_repair),
   'REPAIR - AHMAD FAUZI', 'Gangguan koneksi putus-putus', 'open', 'customer',
   (SELECT id FROM emp_ali), NOW() - INTERVAL '1 hour', 0,
   '2026-03-10', 'Lunas', 'Kemungkinan konektor longgar'),

  -- Status: closed (selesai)
  ((SELECT id FROM cust_fat), (SELECT id FROM emp_fungki), (SELECT id FROM qt_upgrade),
   'UPGRADE - FATMAWATI', 'Upgrade paket dari 15Mbps ke 20Mbps', 'closed', 'admin',
   (SELECT id FROM emp_fungki), NOW() - INTERVAL '5 days', 50,
   '2026-02-15', 'Lunas', 'Upgrade berhasil, modem diganti')
) AS wo(customer_id, employee_id, type_id, title, description, status, source, claimed_by, claimed_at, points, registration_date, payment_status, ket);

-- ============================================================
-- STEP 10: INSTALLATION MONITORINGS
-- Link to work orders that are open or closed
-- ============================================================
INSERT INTO public.installation_monitorings (
  work_order_id, customer_id, employee_id,
  planned_date, actual_date, activation_date,
  mac_address, sn_modem, cable_label,
  notes, is_confirmed
)
SELECT
  wo.id,
  wo.customer_id,
  wo.employee_id,
  wo.registration_date + INTERVAL '3 days',
  CASE wo.status WHEN 'closed' THEN wo.registration_date + INTERVAL '3 days' ELSE NULL END,
  CASE wo.status WHEN 'closed' THEN wo.registration_date + INTERVAL '3 days' ELSE NULL END,
  CASE wo.status
    WHEN 'closed' THEN '08:ED:ED:B1:43:F8'
    WHEN 'open'   THEN NULL
    ELSE NULL
  END,
  CASE wo.status WHEN 'closed' THEN 'SN-' || substring(CAST(wo.id AS TEXT), 1, 8) ELSE NULL END,
  CASE wo.status WHEN 'closed' THEN 'MRECAH-' || substring(CAST(wo.id AS TEXT), 1, 4) ELSE NULL END,
  CASE wo.status
    WHEN 'closed' THEN 'Instalasi selesai, jaringan aktif normal'
    WHEN 'open'   THEN 'Teknisi sedang di lokasi'
    ELSE NULL
  END,
  wo.status = 'closed'
FROM public.work_orders wo
WHERE wo.status IN ('open', 'closed')
  AND wo.type_id = (SELECT id FROM public.master_queue_types WHERE name = 'PSB' LIMIT 1)
ON CONFLICT (work_order_id) DO NOTHING;

-- ============================================================
-- STEP 11: PSB REGISTRATIONS (Prospects awaiting approval)
-- ============================================================
INSERT INTO public.psb_registrations (name, phone, alt_phone, address, packet, lat, lng, status)
VALUES
  ('SRIWIJAYA WIRAWAN', '81234567901', '82345678901', 'Jl. Pendidikan No. 42, Bangkalan', 'Paket Unggulan 50Mbps', -7.0625, 112.7350, 'waiting'),
  ('NURBAYA LESTARI', '81234567902', '82345678902', 'Desa Kamal, Bangkalan', 'Paket Prima 35Mbps', -7.0635, 112.7360, 'waiting'),
  ('RUDI HERMAWAN', '81234567903', '82345678903', 'Jl. Raya Arjasa, Bangkalan', 'Paket Rumahan 20Mbps', -7.0645, 112.7370, 'waiting');

-- ============================================================
-- STEP 12: WORK ORDER ASSIGNMENTS (Teams and point tracking)
-- ============================================================
WITH
  emp_ali   AS (SELECT id FROM public.employees WHERE employee_id = '202512008' LIMIT 1),
  emp_wahid AS (SELECT id FROM public.employees WHERE employee_id = '202602009' LIMIT 1),
  emp_fungki AS (SELECT id FROM public.employees WHERE employee_id = '202408003' LIMIT 1),
  wo_1 AS (SELECT id FROM public.work_orders WHERE title = 'PSB - FATMAWATI' AND status = 'confirmed' LIMIT 1),
  wo_2 AS (SELECT id FROM public.work_orders WHERE title = 'PSB - HASIB' AND status = 'open' LIMIT 1),
  wo_3 AS (SELECT id FROM public.work_orders WHERE title = 'UPGRADE - FATMAWATI' AND status = 'closed' LIMIT 1)
INSERT INTO public.work_order_assignments (work_order_id, employee_id, assignment_role, points_earned)
VALUES
  ((SELECT id FROM wo_1), (SELECT id FROM emp_ali), 'lead', 0),
  ((SELECT id FROM wo_2), (SELECT id FROM emp_wahid), 'lead', 0),
  ((SELECT id FROM wo_3), (SELECT id FROM emp_fungki), 'lead', 50)
ON CONFLICT (work_order_id, employee_id) DO NOTHING;

-- ============================================================
-- STEP 13: CUSTOMER BILLS (Monthly billing records)
-- ============================================================
WITH
  cust_fat  AS (SELECT id FROM public.customers WHERE customer_code = '25094031501' LIMIT 1),
  cust_isn  AS (SELECT id FROM public.customers WHERE customer_code = '25094031601' LIMIT 1),
  cust_has  AS (SELECT id FROM public.customers WHERE customer_code = '25094031701' LIMIT 1),
  cust_budi AS (SELECT id FROM public.customers WHERE customer_code = '26030000101' LIMIT 1)
INSERT INTO public.customer_bills (customer_id, period_date, due_date, amount, status, payment_method, payment_date, notes)
VALUES
  ((SELECT id FROM cust_fat), '2026-03-01'::DATE, '2026-03-10'::DATE, 175000.00, 'paid', 'transfer', now(), 'Pembayaran Maret 2026'),
  ((SELECT id FROM cust_fat), '2026-02-01'::DATE, '2026-02-10'::DATE, 175000.00, 'paid', 'transfer', now() - INTERVAL '30 days', 'Pembayaran Februari 2026'),
  ((SELECT id FROM cust_isn), '2026-03-01'::DATE, '2026-03-10'::DATE, 175000.00, 'unpaid', NULL, NULL, 'Menunggu pembayaran'),
  ((SELECT id FROM cust_has), '2026-03-01'::DATE, '2026-03-10'::DATE, 175000.00, 'paid', 'cash', now() - INTERVAL '2 days', 'Pembayaran tunai'),
  ((SELECT id FROM cust_budi), '2026-03-01'::DATE, '2026-03-10'::DATE, 200000.00, 'unpaid', NULL, NULL, 'Pelanggan baru, menunggu aktivasi')
ON CONFLICT (customer_id, period_date) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- Run these to confirm seed completed correctly
-- ============================================================
/*
SELECT 'roles' AS tbl, COUNT(*) FROM public.roles
UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL SELECT 'employees', COUNT(*) FROM public.employees
UNION ALL SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL SELECT 'internet_packages', COUNT(*) FROM public.internet_packages
UNION ALL SELECT 'inventory_items', COUNT(*) FROM public.inventory_items
UNION ALL SELECT 'master_queue_types', COUNT(*) FROM public.master_queue_types
UNION ALL SELECT 'psb_registrations', COUNT(*) FROM public.psb_registrations
UNION ALL SELECT 'work_orders', COUNT(*) FROM public.work_orders
UNION ALL SELECT 'work_order_assignments', COUNT(*) FROM public.work_order_assignments
UNION ALL SELECT 'installation_monitorings', COUNT(*) FROM public.installation_monitorings
UNION ALL SELECT 'customer_bills', COUNT(*) FROM public.customer_bills
UNION ALL SELECT 'app_settings', COUNT(*) FROM public.app_settings;
