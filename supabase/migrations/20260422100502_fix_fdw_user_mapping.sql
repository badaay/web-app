-- Fix User Mapping for FDW in Project B
-- This allows the Supabase API (service_role) to access Project A tables via FDW.

-- 1. Create mapping for service_role
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_user_mappings WHERE srvname = 'project_a_server' AND usename = 'service_role') THEN
        CREATE USER MAPPING FOR service_role
        SERVER project_a_server
        OPTIONS (user 'postgres', password 'PtL5*kf@9&kLMek');
    END IF;
END $$;

-- 2. Create mapping for authenticated (useful for RLS-based foreign table access)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_user_mappings WHERE srvname = 'project_a_server' AND usename = 'authenticated') THEN
        CREATE USER MAPPING FOR authenticated
        SERVER project_a_server
        OPTIONS (user 'postgres', password 'PtL5*kf@9&kLMek');
    END IF;
END $$;
