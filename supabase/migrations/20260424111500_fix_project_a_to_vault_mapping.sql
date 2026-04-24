-- Migration: Fix Cross-Project Vault Access (Project A -> B)
-- Description: Adds missing user mappings for authenticated and service_role users in Project A.
--              This ensures that when the web app queries foreign tables in the Vault (Project B),
--              it uses a valid connection that can bypass RLS on the Vault side.

-- 1. Create mapping for service_role in Project A
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_user_mappings WHERE srvname = 'remote_vault_server' AND usename = 'service_role') THEN
        CREATE USER MAPPING FOR service_role
        SERVER remote_vault_server
        OPTIONS (user 'postgres', password 'PtL5*kf@9&kLMek');
    END IF;
END $$;

-- 2. Create mapping for authenticated in Project A
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_user_mappings WHERE srvname = 'remote_vault_server' AND usename = 'authenticated') THEN
        CREATE USER MAPPING FOR authenticated
        SERVER remote_vault_server
        OPTIONS (user 'postgres', password 'PtL5*kf@9&kLMek');
    END IF;
END $$;
