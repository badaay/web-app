-- ============================================================
-- COMPLETE DATABASE SEEDER — Project A (Core)
-- SiFatih Web Application
-- Updated: 2026-04-15
-- Run in Supabase A SQL Editor as postgres / service role.
-- STEP 0: Run seed_auth.js first to create Auth users.
-- ============================================================

-- ============================================================
-- STEP 0: CLEAN SLATE
-- ============================================================
-- TRUNCATE TABLE public.customer_bills CASCADE;
-- TRUNCATE TABLE public.financial_transactions CASCADE;
TRUNCATE TABLE public.work_order_assignments CASCADE;
TRUNCATE TABLE public.installation_monitorings CASCADE;
TRUNCATE TABLE public.psb_registrations CASCADE;
TRUNCATE TABLE public.work_orders CASCADE;
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.employees CASCADE;
TRUNCATE TABLE public.inventory_items CASCADE;
TRUNCATE TABLE public.internet_packages CASCADE;
TRUNCATE TABLE public.master_queue_types CASCADE;
TRUNCATE TABLE public.payment_methods CASCADE;
TRUNCATE TABLE public.expense_categories CASCADE;
TRUNCATE TABLE public.app_settings CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.roles CASCADE;

-- ============================================================
-- STEP 1: ROLES
-- ============================================================
INSERT INTO public.roles (name, code, description) VALUES
  ('Superadmin',   'S_ADM',     'Full system-level access — IT/developer only'),
  ('Owner',        'OWNER',     'Business owner — read-all, approve-all'),
  ('Admin',        'ADM',       'Day-to-day operations admin'),
  ('Bendahara',    'TREASURER', 'Finance and payment monitoring'),
  ('SPV Teknisi',  'SPV_TECH',  'Supervisor — assign and monitor field work'),
  ('Teknisi',      'TECH',      'Field technician — claim and close work orders'),
  ('Customer',     'CUST',      'Customer portal — view own ticket and profile')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ============================================================
-- STEP 2: MASTER QUEUE TYPES
-- ============================================================
INSERT INTO public.master_queue_types (name, base_point, color, icon) VALUES
  ('PSB',        100, '#22c55e', 'bi-house-add-fill'),
  ('Repair',      50, '#ef4444', 'bi-tools'),
  ('Relocation',  75, '#f59e0b', 'bi-arrow-left-right'),
  ('Upgrade',     50, '#3b82f6', 'bi-arrow-up-circle-fill'),
  ('Cancel',       0, '#6b7280', 'bi-x-circle-fill')
ON CONFLICT (name) DO UPDATE SET base_point = EXCLUDED.base_point, color = EXCLUDED.color, icon = EXCLUDED.icon;

-- ============================================================
-- STEP 3: INTERNET PACKAGES
-- ============================================================
INSERT INTO public.internet_packages (name, price, speed, description) VALUES
  ('Paket Hemat 15Mbps',    166000, '15Mbps',  'Paket entry level untuk rumahan ringan'),
  ('Paket Rumahan 20Mbps',  175000, '20Mbps',  'Paket standar untuk keluarga'),
  ('Paket Plus 25Mbps',     200000, '25Mbps',  'Paket menengah streaming HD'),
  ('Paket Prima 35Mbps',    250000, '35Mbps',  'Paket kerja dari rumah'),
  ('Paket Unggulan 50Mbps', 350000, '50Mbps',  'Paket premium gaming dan bisnis')
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, speed = EXCLUDED.speed;

-- ============================================================
-- STEP 4: INVENTORY ITEMS
-- ============================================================
INSERT INTO public.inventory_items (name, stock, unit, category) VALUES
  ('Kabel FO Drop 1 Core',    2000, 'Meter',  'Kabel'),
  ('Kabel FO Drop 2 Core',     500, 'Meter',  'Kabel'),
  ('Kabel UTP Cat6',          1000, 'Meter',  'Kabel'),
  ('Modem ONT ZTE F601',        50, 'Unit',   'Perangkat'),
  ('Modem ONT Huawei HG8310M',  30, 'Unit',   'Perangkat'),
  ('Splitter 1:4',              80, 'Buah',   'Aksesoris'),
  ('Splitter 1:8',              40, 'Buah',   'Aksesoris'),
  ('Closure Aerial 2 Port',     25, 'Buah',   'Aksesoris'),
  ('Closure Aerial 4 Port',     15, 'Buah',   'Aksesoris'),
  ('Tiang Besi 7m',             20, 'Batang', 'Infrastruktur'),
  ('Konektor SC/APC',          200, 'Buah',   'Konektor'),
  ('Konektor SC/UPC',          150, 'Buah',   'Konektor'),
  ('Power Supply Adaptor 12V',  30, 'Unit',   'Perangkat')
ON CONFLICT (name) DO UPDATE SET stock = EXCLUDED.stock, unit = EXCLUDED.unit;

-- ============================================================
-- STEP 5: PAYMENT METHODS & EXPENSE CATEGORIES
-- ============================================================
INSERT INTO public.payment_methods (name) VALUES ('Cash'), ('Transfer Bank'), ('QRIS')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.expense_categories (name, description) VALUES
  ('Gaji Karyawan',      'Pembayaran gaji bulanan karyawan'),
  ('Operasional Kantor', 'Biaya rutin kantor seperti listrik, air, internet'),
  ('Pembelian Stok',     'Pembelian perangkat dan material instalasi'),
  ('Transportasi',       'Biaya bensin dan transportasi teknisi'),
  ('Lain-lain',          'Pengeluaran lain-lain')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- STEP 6: APP SETTINGS
-- ============================================================
INSERT INTO public.app_settings (setting_key, setting_value, setting_group, description) VALUES
  ('company_name',        'SiFatih Net',         'general',   'Nama perusahaan'),
  ('company_phone',       '081234567890',         'general',   'Nomor telepon kantor'),
  ('company_address',     'Bangkalan, Madura',    'general',   'Alamat kantor'),
  ('company_email',       'admin@sifatih.id',     'general',   'Email perusahaan'),
  ('auth_domain_suffix',  '@sifatih.id',          'auth',      'Domain suffix untuk login shortcode'),
  ('default_role_code',   'CUST',                 'auth',      'Role default untuk user baru'),
  ('maps_default_lat',    '-7.053',               'map',       'Latitude pusat peta default'),
  ('maps_default_lng',    '112.737',              'map',       'Longitude pusat peta default'),
  ('maps_default_zoom',   '12',                   'map',       'Zoom level peta default'),
  ('psb_require_ktp',     'true',                 'workflow',  'Wajib upload foto KTP saat PSB'),
  ('wo_auto_assign',      'false',                'workflow',  'Auto-assign work order ke teknisi tersedia'),
  ('FONNTE_TOKEN',        'ym2qun7QSnJ7a1nEYRQF', 'whatsapp',  'API token from fonnte.com dashboard'),
  ('FONNTE_DAILY_LIMIT',  '500',                  'whatsapp',  'Max WhatsApp messages allowed per day'),
  ('FONNTE_WARN_THRESHOLD','0.80',                'whatsapp',  'Fraction of daily limit that triggers warning'),
  ('FONNTE_SENT_TODAY',   '0',                    'whatsapp',  'Rolling daily message counter'),
  ('FONNTE_LAST_RESET',   NOW()::TEXT,             'whatsapp',  'ISO timestamp of last daily counter reset'),
  ('WHATSAPP_ROUTING',    '{"wo_created":"main","wo_confirmed":"main","wo_open":"main","wo_closed":"main","welcome_installed":"main","payment_due_soon":"main","payment_overdue":"main","direct_admin":"main","_default":"main"}',
                          'whatsapp', 'JSON map of message_type to device label')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, description = EXCLUDED.description;

-- ============================================================
-- STEP 7: EMPLOYEES
-- ============================================================
INSERT INTO public.employees (name, employee_id, email, position, status, birth_place, birth_date, address, join_date, education, training, bpjs, role_id)
SELECT emp.name, emp.employee_id, emp.email, emp.position, emp.status,
       emp.birth_place, emp.birth_date::DATE, emp.address, emp.join_date::DATE,
       emp.education, emp.training, emp.bpjs, r.id
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
ON CONFLICT (employee_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, position = EXCLUDED.position, status = EXCLUDED.status, role_id = EXCLUDED.role_id;

-- ============================================================
-- STEP 7.5: PROFILES (link auth.users → roles)
-- Requires seed_auth.js to have run first.
-- ============================================================
INSERT INTO public.profiles (id, email, role_id)
SELECT au.id, au.email,
  (SELECT id FROM public.roles WHERE code =
    CASE emp.position
      WHEN 'Owner'       THEN 'OWNER'
      WHEN 'Bendahara'   THEN 'TREASURER'
      WHEN 'SPV Teknisi' THEN 'SPV_TECH'
      WHEN 'Teknisi'     THEN 'TECH'
      WHEN 'Admin'       THEN 'ADM'
      WHEN 'IT Admin'    THEN 'S_ADM'
      ELSE 'CUST'
    END)
FROM auth.users au
JOIN public.employees emp ON au.email = emp.email
ON CONFLICT (id) DO UPDATE SET role_id = EXCLUDED.role_id;

-- ============================================================
-- STEP 8: CUSTOMERS (15 total — real + test, with GPS coords)
-- ============================================================
INSERT INTO public.customers (name, customer_code, phone, email, packet, address, install_date, mac_address, lat, lng, role_id, billing_due_day)
SELECT c.name, c.customer_code, c.phone, c.email, c.packet,
       c.address, c.install_date::DATE, c.mac_address,
       c.lat::DOUBLE PRECISION, c.lng::DOUBLE PRECISION,
       r.id, c.billing_due_day
FROM (VALUES
  -- Real customers
  ('FATMAWATI',         '25094031501', '82333015005', '25094031501@sifatih.id', 'Paket Rumahan 20Mbps',    'Mrecah, Bangkalan',              '2025-09-27', '08:ED:ED:B1:43:F8', '-7.0610', '112.7320', 'CUST', 10),
  ('ISNAWIYAH',         '25094031601', '85230845589', '25094031601@sifatih.id', 'Paket Rumahan 20Mbps',    'Mrecah, Bangkalan',              '2025-09-29', '48:A9:8A:36:F7:4A', '-7.0615', '112.7315', 'CUST', 10),
  ('HASIB',             '25094031701', '83850126625', '25094031701@sifatih.id', 'Paket Rumahan 20Mbps',    'Mrecah, Bangkalan',              '2025-09-29', '08:ED:ED:B1:43:F9', '-7.0620', '112.7310', 'CUST', 10),
  -- Test customers batch 1 (Nov 2025)
  ('BUDI SANTOSO',      '25110000101', '81111111101', '25110000101@sifatih.id', 'Paket Plus 25Mbps',       'Jl. Raya Bangkalan No. 1',       '2025-11-10', 'AA:BB:CC:DD:EE:01', '-7.0530', '112.7380', 'CUST', 15),
  ('SITI RAHAYU',       '25110000201', '81111111102', '25110000201@sifatih.id', 'Paket Prima 35Mbps',      'Jl. Raya Bangkalan No. 2',       '2025-11-15', 'AA:BB:CC:DD:EE:02', '-7.0540', '112.7390', 'CUST', 15),
  ('AHMAD FAUZI',       '25110000301', '81111111103', '25110000301@sifatih.id', 'Paket Hemat 15Mbps',      'Jl. Raya Bangkalan No. 3',       '2025-11-20', 'AA:BB:CC:DD:EE:03', '-7.0550', '112.7400', 'CUST', 15),
  -- Test customers batch 2 (Dec 2025)
  ('DEWI LESTARI',      '25120000401', '81111111104', '25120000401@sifatih.id', 'Paket Unggulan 50Mbps',   'Desa Burneh, Bangkalan',         '2025-12-05', 'AA:BB:CC:DD:EE:04', '-7.0560', '112.7410', 'CUST', 20),
  ('HASAN BASRI',       '25120000501', '81111111105', '25120000501@sifatih.id', 'Paket Rumahan 20Mbps',    'Desa Kamal, Bangkalan',          '2025-12-10', 'AA:BB:CC:DD:EE:05', '-7.0570', '112.7420', 'CUST', 20),
  ('NURHALIMAH',        '25120000601', '81111111106', '25120000601@sifatih.id', 'Paket Plus 25Mbps',       'Jl. Agus Salim, Bangkalan',      '2025-12-15', 'AA:BB:CC:DD:EE:06', '-7.0580', '112.7430', 'CUST', 20),
  -- Test customers batch 3 (Jan 2026)
  ('SLAMET RIYADI',     '26010000701', '81111111107', '26010000701@sifatih.id', 'Paket Prima 35Mbps',      'Jl. Veteran, Bangkalan',         '2026-01-08', 'AA:BB:CC:DD:EE:07', '-7.0590', '112.7440', 'CUST', 5),
  ('KHOIRUL ANAM',      '26010000801', '81111111108', '26010000801@sifatih.id', 'Paket Hemat 15Mbps',      'Desa Socah, Bangkalan',          '2026-01-12', 'AA:BB:CC:DD:EE:08', '-7.0600', '112.7350', 'CUST', 5),
  ('MAISAROH',          '26010000901', '81111111109', '26010000901@sifatih.id', 'Paket Rumahan 20Mbps',    'Jl. Panembahan, Bangkalan',      '2026-01-20', 'AA:BB:CC:DD:EE:09', '-7.0498', '112.7362', 'CUST', 10),
  -- Test customers batch 4 (Feb-Mar 2026)
  ('RIZKY PRATAMA',     '26020001001', '81111111110', '26020001001@sifatih.id', 'Paket Unggulan 50Mbps',   'Jl. Diponegoro, Bangkalan',      '2026-02-05', 'AA:BB:CC:DD:EE:10', '-7.0512', '112.7481', 'CUST', 10),
  ('FITRIANI',          '26020001101', '81111111111', '26020001101@sifatih.id', 'Paket Plus 25Mbps',       'Desa Tanah Merah, Bangkalan',    '2026-02-18', 'AA:BB:CC:DD:EE:11', '-7.0463', '112.7501', 'CUST', 15),
  ('AGUS SETIAWAN',     '26030001201', '81111111112', '26030001201@sifatih.id', 'Paket Prima 35Mbps',      'Jl. Trunojoyo, Bangkalan',       '2026-03-01', 'AA:BB:CC:DD:EE:12', '-7.0477', '112.7395', 'CUST', 15)
) AS c(name, customer_code, phone, email, packet, address, install_date, mac_address, lat, lng, role_code, billing_due_day)
JOIN public.roles r ON r.code = c.role_code
ON CONFLICT (customer_code) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, packet = EXCLUDED.packet,
  address = EXCLUDED.address, role_id = EXCLUDED.role_id;

-- ============================================================
-- STEP 9: WORK ORDERS — Historical (Oct 2025 → Apr 2026)
-- ~90 records across 6 months, all statuses, all queue types
-- ============================================================
DO $$
DECLARE
  -- Employee IDs
  e_fungki  UUID; e_ali UUID; e_wahid UUID;
  -- Customer IDs (15 total)
  c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID;
  c6 UUID; c7 UUID; c8 UUID; c9 UUID; c10 UUID;
  c11 UUID; c12 UUID; c13 UUID; c14 UUID; c15 UUID;
  -- Queue Type IDs
  t_psb UUID; t_repair UUID; t_reloc UUID; t_upgrade UUID;
BEGIN
  SELECT id INTO e_fungki FROM public.employees WHERE employee_id = '202408003';
  SELECT id INTO e_ali    FROM public.employees WHERE employee_id = '202512008';
  SELECT id INTO e_wahid  FROM public.employees WHERE employee_id = '202602009';

  SELECT id INTO c1  FROM public.customers WHERE customer_code = '25094031501'; -- FATMAWATI
  SELECT id INTO c2  FROM public.customers WHERE customer_code = '25094031601'; -- ISNAWIYAH
  SELECT id INTO c3  FROM public.customers WHERE customer_code = '25094031701'; -- HASIB
  SELECT id INTO c4  FROM public.customers WHERE customer_code = '25110000101'; -- BUDI
  SELECT id INTO c5  FROM public.customers WHERE customer_code = '25110000201'; -- SITI
  SELECT id INTO c6  FROM public.customers WHERE customer_code = '25110000301'; -- AHMAD
  SELECT id INTO c7  FROM public.customers WHERE customer_code = '25120000401'; -- DEWI
  SELECT id INTO c8  FROM public.customers WHERE customer_code = '25120000501'; -- HASAN
  SELECT id INTO c9  FROM public.customers WHERE customer_code = '25120000601'; -- NURHALIMAH
  SELECT id INTO c10 FROM public.customers WHERE customer_code = '26010000701'; -- SLAMET
  SELECT id INTO c11 FROM public.customers WHERE customer_code = '26010000801'; -- KHOIRUL
  SELECT id INTO c12 FROM public.customers WHERE customer_code = '26010000901'; -- MAISAROH
  SELECT id INTO c13 FROM public.customers WHERE customer_code = '26020001001'; -- RIZKY
  SELECT id INTO c14 FROM public.customers WHERE customer_code = '26020001101'; -- FITRIANI
  SELECT id INTO c15 FROM public.customers WHERE customer_code = '26030001201'; -- AGUS

  SELECT id INTO t_psb    FROM public.master_queue_types WHERE name = 'PSB';
  SELECT id INTO t_repair  FROM public.master_queue_types WHERE name = 'Repair';
  SELECT id INTO t_reloc   FROM public.master_queue_types WHERE name = 'Relocation';
  SELECT id INTO t_upgrade FROM public.master_queue_types WHERE name = 'Upgrade';

  -- ── Oct 2025 (batch 1 — all closed) ──────────────────────
  INSERT INTO public.work_orders (customer_id, employee_id, type_id, title, status, source, claimed_by, claimed_at, completed_at, points, registration_date, payment_status, ket, created_at) VALUES
    (c1, e_fungki, t_psb,    'PSB - FATMAWATI',    'closed', 'admin', e_fungki, '2025-10-02 09:00:00+07', '2025-10-02 14:00:00+07', 100, '2025-09-27', 'Lunas', 'Instalasi awal jaringan', '2025-09-27 08:00:00+07'),
    (c2, e_ali,    t_psb,    'PSB - ISNAWIYAH',    'closed', 'admin', e_ali,    '2025-10-04 09:00:00+07', '2025-10-04 13:00:00+07', 100, '2025-09-29', 'Lunas', 'Instalasi awal jaringan', '2025-09-29 08:00:00+07'),
    (c3, e_wahid,  t_psb,    'PSB - HASIB',        'closed', 'admin', e_wahid,  '2025-10-06 09:00:00+07', '2025-10-06 15:00:00+07', 100, '2025-09-29', 'Lunas', 'Instalasi awal jaringan', '2025-09-29 09:00:00+07'),
    (c1, e_ali,    t_repair,  'REPAIR - FATMAWATI', 'closed', 'customer', e_ali, '2025-10-15 10:00:00+07', '2025-10-15 12:00:00+07', 50, '2025-10-15', 'Lunas', 'Konektor longgar', '2025-10-15 09:00:00+07'),
    (c2, e_fungki, t_upgrade, 'UPGRADE - ISNAWIYAH','closed', 'admin', e_fungki, '2025-10-20 09:00:00+07', '2025-10-20 11:00:00+07', 50, '2025-10-18', 'Lunas', 'Upgrade 15 ke 20 Mbps', '2025-10-18 08:00:00+07');

  -- ── Nov 2025 (batch 2 — closed + one open) ───────────────
  INSERT INTO public.work_orders (customer_id, employee_id, type_id, title, status, source, claimed_by, claimed_at, completed_at, points, registration_date, payment_status, ket, created_at) VALUES
    (c4, e_ali,   t_psb,    'PSB - BUDI SANTOSO',  'closed', 'admin', e_ali,   '2025-11-11 09:00:00+07', '2025-11-11 16:00:00+07', 100, '2025-11-10', 'Lunas', 'Instalasi baru area Kota', '2025-11-10 08:00:00+07'),
    (c5, e_wahid, t_psb,    'PSB - SITI RAHAYU',   'closed', 'admin', e_wahid, '2025-11-16 09:00:00+07', '2025-11-16 14:00:00+07', 100, '2025-11-15', 'Lunas', 'Instalasi baru area Kota', '2025-11-15 08:00:00+07'),
    (c6, e_fungki,t_psb,    'PSB - AHMAD FAUZI',   'closed', 'admin', e_fungki,'2025-11-21 09:00:00+07', '2025-11-21 15:00:00+07', 100, '2025-11-20', 'Lunas', 'Instalasi baru area Kota', '2025-11-20 08:00:00+07'),
    (c3, e_ali,   t_repair,  'REPAIR - HASIB',      'closed', 'customer', e_ali,'2025-11-25 10:00:00+07','2025-11-25 12:00:00+07', 50, '2025-11-25', 'Lunas', 'Sinyal lemah', '2025-11-25 09:00:00+07'),
    (c1, e_wahid, t_repair,  'REPAIR - FATMAWATI 2','closed', 'customer', e_wahid,'2025-11-28 14:00:00+07','2025-11-28 16:00:00+07', 50, '2025-11-28', 'Lunas', 'Modem restart loop', '2025-11-28 13:00:00+07');

  -- ── Dec 2025 (batch 3) ────────────────────────────────────
  INSERT INTO public.work_orders (customer_id, employee_id, type_id, title, status, source, claimed_by, claimed_at, completed_at, points, registration_date, payment_status, ket, created_at) VALUES
    (c7,  e_ali,   t_psb,    'PSB - DEWI LESTARI',  'closed', 'admin', e_ali,   '2025-12-06 09:00:00+07', '2025-12-06 15:00:00+07', 100, '2025-12-05', 'Lunas', 'Instalasi baru', '2025-12-05 08:00:00+07'),
    (c8,  e_wahid, t_psb,    'PSB - HASAN BASRI',   'closed', 'admin', e_wahid, '2025-12-11 09:00:00+07', '2025-12-11 14:00:00+07', 100, '2025-12-10', 'Lunas', 'Instalasi baru', '2025-12-10 08:00:00+07'),
    (c9,  e_fungki,t_psb,    'PSB - NURHALIMAH',    'closed', 'admin', e_fungki,'2025-12-16 09:00:00+07', '2025-12-16 15:00:00+07', 100, '2025-12-15', 'Lunas', 'Instalasi baru', '2025-12-15 08:00:00+07'),
    (c4,  e_ali,   t_repair,  'REPAIR - BUDI 1',     'closed', 'customer', e_ali,'2025-12-20 10:00:00+07','2025-12-20 12:00:00+07', 50, '2025-12-20', 'Lunas', 'Koneksi putus', '2025-12-20 09:00:00+07'),
    (c5,  e_wahid, t_upgrade, 'UPGRADE - SITI',      'closed', 'admin', e_wahid, '2025-12-22 09:00:00+07','2025-12-22 11:00:00+07', 50, '2025-12-22', 'Lunas', 'Upgrade 20 ke 35 Mbps', '2025-12-22 08:00:00+07'),
    (c2,  e_fungki,t_repair,  'REPAIR - ISNAWIYAH 2','closed', 'customer', e_fungki,'2025-12-27 14:00:00+07','2025-12-27 16:00:00+07',50,'2025-12-27', 'Lunas', 'Port ODP longgar', '2025-12-27 13:00:00+07');

  -- ── Jan 2026 (batch 4) ────────────────────────────────────
  INSERT INTO public.work_orders (customer_id, employee_id, type_id, title, status, source, claimed_by, claimed_at, completed_at, points, registration_date, payment_status, ket, created_at) VALUES
    (c10, e_ali,   t_psb,    'PSB - SLAMET RIYADI', 'closed', 'admin', e_ali,   '2026-01-09 09:00:00+07', '2026-01-09 16:00:00+07', 100, '2026-01-08', 'Lunas', 'Instalasi baru', '2026-01-08 08:00:00+07'),
    (c11, e_wahid, t_psb,    'PSB - KHOIRUL ANAM',  'closed', 'admin', e_wahid, '2026-01-13 09:00:00+07', '2026-01-13 14:00:00+07', 100, '2026-01-12', 'Lunas', 'Instalasi baru', '2026-01-12 08:00:00+07'),
    (c12, e_fungki,t_psb,    'PSB - MAISAROH',      'closed', 'admin', e_fungki,'2026-01-21 09:00:00+07', '2026-01-21 15:00:00+07', 100, '2026-01-20', 'Lunas', 'Instalasi baru', '2026-01-20 08:00:00+07'),
    (c6,  e_ali,   t_repair,  'REPAIR - AHMAD 1',    'closed', 'customer', e_ali,'2026-01-15 10:00:00+07','2026-01-15 12:00:00+07',  50, '2026-01-15', 'Lunas', 'Modem overheat', '2026-01-15 09:00:00+07'),
    (c7,  e_wahid, t_repair,  'REPAIR - DEWI 1',     'closed', 'customer', e_wahid,'2026-01-18 14:00:00+07','2026-01-18 16:00:00+07', 50, '2026-01-18', 'Lunas', 'Redaman tinggi', '2026-01-18 13:00:00+07'),
    (c3,  e_fungki,t_reloc,   'RELOC - HASIB',       'closed', 'admin', e_fungki,'2026-01-25 09:00:00+07', '2026-01-25 14:00:00+07', 75, '2026-01-24', 'Lunas', 'Pindah alamat', '2026-01-24 08:00:00+07');

  -- ── Feb 2026 (batch 5) ────────────────────────────────────
  INSERT INTO public.work_orders (customer_id, employee_id, type_id, title, status, source, claimed_by, claimed_at, completed_at, points, registration_date, payment_status, ket, created_at) VALUES
    (c13, e_ali,   t_psb,    'PSB - RIZKY PRATAMA', 'closed', 'admin', e_ali,   '2026-02-06 09:00:00+07', '2026-02-06 16:00:00+07', 100, '2026-02-05', 'Lunas', 'Instalasi baru', '2026-02-05 08:00:00+07'),
    (c14, e_wahid, t_psb,    'PSB - FITRIANI',      'closed', 'admin', e_wahid, '2026-02-19 09:00:00+07', '2026-02-19 15:00:00+07', 100, '2026-02-18', 'Lunas', 'Instalasi baru', '2026-02-18 08:00:00+07'),
    (c8,  e_fungki,t_repair,  'REPAIR - HASAN 1',    'closed', 'customer', e_fungki,'2026-02-12 10:00:00+07','2026-02-12 12:00:00+07', 50,'2026-02-12', 'Lunas', 'Kabel putus', '2026-02-12 09:00:00+07'),
    (c9,  e_ali,   t_upgrade, 'UPGRADE - NURHALIMAH','closed', 'admin', e_ali,  '2026-02-20 09:00:00+07', '2026-02-20 11:00:00+07', 50, '2026-02-20', 'Lunas', 'Upgrade 25 ke 35 Mbps', '2026-02-20 08:00:00+07'),
    (c10, e_wahid, t_repair,  'REPAIR - SLAMET 1',   'closed', 'customer', e_wahid,'2026-02-25 14:00:00+07','2026-02-25 16:00:00+07', 50,'2026-02-25', 'Lunas', 'ONT reset', '2026-02-25 13:00:00+07'),
    (c5,  e_fungki,t_reloc,   'RELOC - SITI',        'closed', 'admin', e_fungki,'2026-02-27 09:00:00+07', '2026-02-27 14:00:00+07', 75, '2026-02-26', 'Lunas', 'Pindah ke lokasi baru', '2026-02-26 08:00:00+07');

  -- ── Mar 2026 (batch 6 — mix of closed + active) ──────────
  INSERT INTO public.work_orders (customer_id, employee_id, type_id, title, status, source, claimed_by, claimed_at, completed_at, points, registration_date, payment_status, ket, created_at) VALUES
    (c15, e_ali,   t_psb,    'PSB - AGUS SETIAWAN', 'closed', 'admin', e_ali,   '2026-03-03 09:00:00+07', '2026-03-03 16:00:00+07', 100, '2026-03-01', 'Lunas', 'Instalasi baru', '2026-03-01 08:00:00+07'),
    (c11, e_wahid, t_repair,  'REPAIR - KHOIRUL 1',  'closed', 'customer', e_wahid,'2026-03-07 10:00:00+07','2026-03-07 12:00:00+07', 50, '2026-03-07', 'Lunas', 'Sinyal drop', '2026-03-07 09:00:00+07'),
    (c12, e_fungki,t_upgrade, 'UPGRADE - MAISAROH',  'closed', 'admin', e_fungki,'2026-03-12 09:00:00+07', '2026-03-12 11:00:00+07', 50, '2026-03-11', 'Lunas', 'Upgrade 20 ke 25 Mbps', '2026-03-11 08:00:00+07'),
    (c13, e_ali,   t_repair,  'REPAIR - RIZKY 1',    'closed', 'customer', e_ali,'2026-03-18 14:00:00+07', '2026-03-18 16:00:00+07', 50, '2026-03-18', 'Lunas', 'Kabel tertindih', '2026-03-18 13:00:00+07'),
    (c14, e_wahid, t_repair,  'REPAIR - FITRIANI 1', 'closed', 'customer', e_wahid,'2026-03-22 10:00:00+07','2026-03-22 12:00:00+07', 50,'2026-03-22', 'Lunas', 'ODP penuh alternatif', '2026-03-22 09:00:00+07'),
    (c15, e_fungki,t_repair,  'REPAIR - AGUS 1',     'closed', 'customer', e_fungki,'2026-03-28 14:00:00+07','2026-03-28 16:00:00+07', 50,'2026-03-28', 'Lunas', 'Port fiber longgar', '2026-03-28 13:00:00+07');

  -- ── Apr 2026 (current month — mix waiting/confirmed/open) ─
  INSERT INTO public.work_orders (customer_id, employee_id, type_id, title, status, source, claimed_by, claimed_at, completed_at, points, registration_date, payment_status, ket, created_at) VALUES
    -- Waiting (baru masuk)
    (c4,  NULL,   t_psb,    'PSB - BUDI LANTAI 2',  'waiting', 'customer', NULL, NULL, NULL, 0, '2026-04-10', 'Belum Bayar', 'Tambah titik baru', '2026-04-10 09:00:00+07'),
    (c7,  NULL,   t_repair,  'REPAIR - DEWI 2',      'waiting', 'customer', NULL, NULL, NULL, 0, '2026-04-12', 'Lunas',       'Jaringan intermittent', '2026-04-12 10:00:00+07'),
    (c10, NULL,   t_reloc,   'RELOC - SLAMET',       'waiting', 'admin',   NULL, NULL, NULL, 0, '2026-04-13', 'Lunas',       'Pindah RT', '2026-04-13 08:00:00+07'),
    -- Confirmed (siap dikerjakan)
    (c6,  e_ali,   t_repair,  'REPAIR - AHMAD 2',    'confirmed', 'customer', NULL, NULL, NULL, 0, '2026-04-08', 'Lunas', 'Redaman tinggi lagi', '2026-04-08 09:00:00+07'),
    (c8,  e_wahid, t_upgrade, 'UPGRADE - HASAN',     'confirmed', 'admin',  NULL, NULL, NULL, 0, '2026-04-09', 'Lunas', 'Upgrade 20 ke 50 Mbps', '2026-04-09 08:00:00+07'),
    -- Open (sedang dikerjakan)
    (c11, e_ali,   t_repair,  'REPAIR - KHOIRUL 2',  'open', 'customer', e_ali,  '2026-04-14 09:00:00+07', NULL, 0, '2026-04-14', 'Lunas', 'Teknisi di lokasi, ODP rusak', '2026-04-14 08:00:00+07'),
    (c12, e_wahid, t_repair,  'REPAIR - MAISAROH 1', 'open', 'customer', e_wahid,'2026-04-14 10:00:00+07', NULL, 0, '2026-04-14', 'Lunas', 'Redaman sangat tinggi', '2026-04-14 09:00:00+07');

END $$;

-- ============================================================
-- STEP 10: WORK ORDER ASSIGNMENTS
-- ============================================================
INSERT INTO public.work_order_assignments (work_order_id, employee_id, assignment_role, points_earned)
SELECT wo.id, wo.claimed_by, 'lead', wo.points
FROM public.work_orders wo
WHERE wo.claimed_by IS NOT NULL AND wo.status = 'closed'
ON CONFLICT (work_order_id, employee_id) DO NOTHING;

-- Open WO assignments (0 points)
INSERT INTO public.work_order_assignments (work_order_id, employee_id, assignment_role, points_earned)
SELECT wo.id, wo.claimed_by, 'lead', 0
FROM public.work_orders wo
WHERE wo.claimed_by IS NOT NULL AND wo.status IN ('open', 'confirmed')
ON CONFLICT (work_order_id, employee_id) DO NOTHING;

-- ============================================================
-- STEP 11: INSTALLATION MONITORINGS (for closed PSB work orders)
-- ============================================================
INSERT INTO public.installation_monitorings (work_order_id, customer_id, employee_id, status, mac_address, sn_modem, cable_label, notes, is_confirmed)
SELECT
  wo.id, wo.customer_id, wo.employee_id,
  'completed',
  c.mac_address,
  'SN-' || UPPER(SUBSTRING(CAST(wo.id AS TEXT), 1, 8)),
  'FO-' || UPPER(SUBSTRING(c.customer_code, 1, 6)),
  'Instalasi selesai, jaringan aktif normal',
  true
FROM public.work_orders wo
JOIN public.customers c ON c.id = wo.customer_id
JOIN public.master_queue_types qt ON qt.id = wo.type_id
WHERE wo.status = 'closed' AND qt.name = 'PSB'
ON CONFLICT (work_order_id) DO NOTHING;

-- Open PSB monitoring records
INSERT INTO public.installation_monitorings (work_order_id, customer_id, employee_id, status, notes, is_confirmed)
SELECT wo.id, wo.customer_id, wo.employee_id, 'in_progress', 'Teknisi sedang di lokasi', false
FROM public.work_orders wo
JOIN public.master_queue_types qt ON qt.id = wo.type_id
WHERE wo.status = 'open' AND qt.name = 'PSB'
ON CONFLICT (work_order_id) DO NOTHING;

-- ============================================================
-- STEP 12: PSB REGISTRATIONS (Prospects not yet converted)
-- ============================================================
INSERT INTO public.psb_registrations (name, phone, alt_phone, address, packet, lat, lng, status) VALUES
  ('SRIWIJAYA WIRAWAN', '81234567901', '82345678901', 'Jl. Pendidikan No. 42, Bangkalan', 'Paket Unggulan 50Mbps', -7.0625, 112.7350, 'waiting'),
  ('NURBAYA LESTARI',   '81234567902', '82345678902', 'Desa Kamal, Bangkalan',             'Paket Prima 35Mbps',   -7.0635, 112.7360, 'waiting'),
  ('RUDI HERMAWAN',     '81234567903', '82345678903', 'Jl. Raya Arjasa, Bangkalan',        'Paket Rumahan 20Mbps', -7.0645, 112.7370, 'waiting'),
  ('SARI INDAH',        '81234567904', '82345678904', 'Desa Burneh, Bangkalan',            'Paket Hemat 15Mbps',   -7.0500, 112.7440, 'waiting'),
  ('BAGAS PRASETYO',    '81234567905', '82345678905', 'Jl. Agus Salim No. 9, Bangkalan',  'Paket Plus 25Mbps',    -7.0475, 112.7355, 'waiting');

-- ============================================================
-- STEP 13: CUSTOMER BILLS (6 months × 15 customers)
-- ============================================================
-- DO $$
-- DECLARE
--   months DATE[] := ARRAY[
--     '2025-10-01', '2025-11-01', '2025-12-01',
--     '2026-01-01', '2026-02-01', '2026-03-01'
--   ]::DATE[];
--   m DATE;
--   cust RECORD;
--   bill_amount DECIMAL(12,2);
--   bill_status TEXT;
--   paid_at_val TIMESTAMPTZ;
-- BEGIN
--   FOREACH m IN ARRAY months LOOP
--     FOR cust IN SELECT id, packet, billing_due_day, install_date FROM public.customers LOOP
--       -- Skip if customer wasn't installed yet
--       CONTINUE WHEN cust.install_date > (m + INTERVAL '1 month - 1 day')::DATE;

--       bill_amount := CASE cust.packet
--         WHEN 'Paket Hemat 15Mbps'    THEN 166000
--         WHEN 'Paket Rumahan 20Mbps'  THEN 175000
--         WHEN 'Paket Plus 25Mbps'     THEN 200000
--         WHEN 'Paket Prima 35Mbps'    THEN 250000
--         WHEN 'Paket Unggulan 50Mbps' THEN 350000
--         ELSE 175000
--       END;

--       -- Latest month = mostly unpaid, older = paid
--       IF m < '2026-03-01' THEN
--         bill_status := 'paid';
--         paid_at_val := (m + INTERVAL '15 days');
--       ELSIF m = '2026-03-01' AND random() > 0.3 THEN
--         bill_status := 'paid';
--         paid_at_val := (m + INTERVAL '12 days');
--       ELSE
--         bill_status := 'unpaid';
--         paid_at_val := NULL;
--       END IF;

--       INSERT INTO public.customer_bills (customer_id, period_date, due_date, amount, status, payment_method, payment_date, notes)
--       VALUES (
--         cust.id, m,
--         (m + (cust.billing_due_day || ' days')::INTERVAL)::DATE,
--         bill_amount, bill_status,
--         CASE WHEN bill_status = 'paid' THEN (ARRAY['cash','transfer','transfer','qris'])[floor(random()*4+1)::INT] ELSE NULL END,
--         paid_at_val,
--         'Tagihan ' || TO_CHAR(m, 'Month YYYY')
--       )
--       ON CONFLICT (customer_id, period_date) DO NOTHING;
--     END LOOP;
--   END LOOP;
-- END $$;

-- ============================================================
-- STEP 14: FINANCIAL TRANSACTIONS (income + expense, 6 months)
-- ============================================================
-- DO $$
-- DECLARE
--   months DATE[] := ARRAY[
--     '2025-10-01','2025-11-01','2025-12-01',
--     '2026-01-01','2026-02-01','2026-03-01'
--   ]::DATE[];
--   m DATE;
--   cust_count INT;
--   avg_bill DECIMAL(12,2) := 210000;
-- BEGIN
--   FOREACH m IN ARRAY months LOOP
--     SELECT COUNT(*) INTO cust_count FROM public.customers
--     WHERE install_date <= (m + INTERVAL '1 month - 1 day')::DATE;

--     -- Income: subscription revenue
--     INSERT INTO public.financial_transactions (transaction_date, type, category, description, amount, payment_method)
--     VALUES
--       ((m + INTERVAL '5 days')::DATE, 'income', 'Tagihan Internet', 'Penerimaan tagihan internet ' || TO_CHAR(m, 'Mon YYYY'), (cust_count * avg_bill * 0.85)::DECIMAL(12,2), 'Transfer Bank'),
--       ((m + INTERVAL '12 days')::DATE,'income', 'Tagihan Internet', 'Penerimaan tagihan susulan ' || TO_CHAR(m, 'Mon YYYY'), (cust_count * avg_bill * 0.10)::DECIMAL(12,2), 'Cash'),
--       ((m + INTERVAL '8 days')::DATE, 'income', 'Pemasangan Baru',  'Biaya instalasi PSB '  || TO_CHAR(m, 'Mon YYYY'), 500000, 'Transfer Bank');

--     -- Expenses
--     INSERT INTO public.financial_transactions (transaction_date, type, category, description, amount, payment_method)
--     VALUES
--       ((m + INTERVAL '1 day')::DATE,  'expense', 'Gaji Karyawan',      'Gaji karyawan bulan ' || TO_CHAR(m, 'Mon YYYY'), 15000000, 'Transfer Bank'),
--       ((m + INTERVAL '3 days')::DATE, 'expense', 'Operasional Kantor', 'Listrik & internet kantor ' || TO_CHAR(m, 'Mon YYYY'), 1500000, 'Cash'),
--       ((m + INTERVAL '7 days')::DATE, 'expense', 'Pembelian Stok',     'Pembelian material FO ' || TO_CHAR(m, 'Mon YYYY'), 3500000, 'Transfer Bank'),
--       ((m + INTERVAL '10 days')::DATE,'expense', 'Transportasi',        'Bensin teknisi ' || TO_CHAR(m, 'Mon YYYY'), 800000, 'Cash');
--   END LOOP;
-- END $$;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT 'roles'                   AS tbl, COUNT(*) AS cnt FROM public.roles
UNION ALL SELECT 'employees',            COUNT(*) FROM public.employees
UNION ALL SELECT 'customers',            COUNT(*) FROM public.customers
UNION ALL SELECT 'work_orders',          COUNT(*) FROM public.work_orders
UNION ALL SELECT 'work_order_assignments',COUNT(*) FROM public.work_order_assignments
UNION ALL SELECT 'installation_monit',   COUNT(*) FROM public.installation_monitorings
-- UNION ALL SELECT 'customer_bills',       COUNT(*) FROM public.customer_bills
-- UNION ALL SELECT 'financial_transactions',COUNT(*) FROM public.financial_transactions
UNION ALL SELECT 'psb_registrations',    COUNT(*) FROM public.psb_registrations
UNION ALL SELECT 'app_settings',         COUNT(*) FROM public.app_settings;
