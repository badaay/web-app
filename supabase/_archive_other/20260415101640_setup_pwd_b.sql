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