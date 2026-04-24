DROP SERVER IF EXISTS project_a_server CASCADE;

-- 1. Enable FDW Extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 2. Define the Remote Server (Project A)
CREATE SERVER project_a_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'db.xtoripjjcyqkmezweaxy.supabase.co', port '5432', dbname 'postgres');

-- 3. Create User Mapping
-- Use the password you recently reset for Project A
CREATE USER MAPPING FOR postgres
SERVER project_a_server
OPTIONS (user 'postgres', password 'PtL5*kf@9&kLMek');

-- 4. Import the missing tables into Project B's public schema
-- This solves the "Could not find relationship" error
IMPORT FOREIGN SCHEMA public 
LIMIT TO (employees, bank_accounts) 
FROM SERVER project_a_server 
INTO public;




DROP SERVER IF EXISTS remote_vault_server CASCADE;

-- KODE UNTUK PROYEK A (MAIN)
-- 1. Aktifkan ekstensi FDW
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 2. Buat koneksi ke server Proyek B (Vault)
-- Ganti <project-b-ref> dengan ID proyek kedua kamu
CREATE SERVER remote_vault_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'db.rxvauycedkhpgsgqvrzy.supabase.co', port '5432', dbname 'postgres');

-- 3. Mapping user postgres lokal ke remote (Ganti dengan password DB Proyek B)
CREATE USER MAPPING FOR postgres
SERVER remote_vault_server
OPTIONS (user 'postgres', password 'CppJu1hpoegdmQw2');

-- 4. Buat schema khusus untuk tabel dari Proyek B agar tidak campur
CREATE SCHEMA IF NOT EXISTS remote_vault;

-- 5. Impor tabel spesifik dari Proyek B (misal tabel logs)
-- Kamu bisa mengganti 'public' dengan schema di Proyek B yang ingin diimpor
IMPORT FOREIGN SCHEMA public 
FROM SERVER remote_vault_server 
INTO remote_vault;