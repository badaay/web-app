-- SiFatih Project A: FDW Setup & Cross-Project Connectivity
-- Description: Establishes the bridge between Project A (Core) and Project B (Vault).
-- Date: 2026-04-11
-- Target: Run on Project A (Core)

-- 1. Enable FDW Extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 2. Create Server to Project B
-- REPLACE 'db.project-b-ref.supabase.co' with your Project B host
CREATE SERVER remote_vault_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'db.qkaimjdzygimabstdgno.supabase.co', port '5432', dbname 'postgres');

-- 3. Create User Mapping
-- REPLACE '{{VAULT_PASSWORD}}' with the database password of Project B
CREATE USER MAPPING FOR postgres
SERVER remote_vault_server
OPTIONS (user 'postgres', password 'PtL5*kf@9&kLMek');

-- 4. Create Remote Schema
CREATE SCHEMA IF NOT EXISTS remote_vault;

-- 5. Import Foreign Tables from Project B
-- This imports all public tables from Project B into the 'remote_vault' schema in Project A.
IMPORT FOREIGN SCHEMA public 
FROM SERVER remote_vault_server 
INTO remote_vault;

-- 6. Verification View
CREATE OR REPLACE VIEW public.vault_connection_status AS
SELECT 
    srvname as server_name,
    CASE WHEN has_schema_privilege('remote_vault', 'usage') THEN 'Connected' ELSE 'Failed' END as status
FROM pg_foreign_server;
