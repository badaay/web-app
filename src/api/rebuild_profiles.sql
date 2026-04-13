-- recovery/rebuild_profiles.sql
-- Purpose: Syncs public.profiles with auth.users if profiles are missing.
-- Usage: Run in Supabase SQL Editor.

DO $$
DECLARE
    default_role_id UUID;
    user_record RECORD;
    target_role_id UUID;
    processed_count INTEGER := 0;
    skipped_count INTEGER := 0;
BEGIN
    -- 1. Get default role (CUST)
    SELECT id INTO default_role_id FROM public.roles WHERE code = 'CUST' LIMIT 1;

    IF default_role_id IS NULL THEN
        RAISE EXCEPTION 'Default role CUST not found in public.roles table. Please ensure roles are seeded first.';
    END IF;

    RAISE NOTICE 'Starting profile rebuild. Default role ID: %', default_role_id;

    -- 2. Iterate through all auth users
    FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
        -- Attempt to find role from metadata
        SELECT id INTO target_role_id FROM public.roles WHERE code = UPPER(user_record.raw_user_meta_data->>'role') LIMIT 1;
        
        -- Fallback to default role
        IF target_role_id IS NULL THEN
            target_role_id := default_role_id;
        END IF;

        -- Insert or sync profile
        INSERT INTO public.profiles (id, email, role_id)
        VALUES (
            user_record.id, 
            user_record.email, 
            target_role_id
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            role_id = EXCLUDED.role_id,
            updated_at = NOW();
            
        processed_count := processed_count + 1;
        RAISE NOTICE 'Sync: [%] % (Role id: %)', processed_count, user_record.email, target_role_id;
    END LOOP;

    RAISE NOTICE 'Rebuild complete. Total processed: %, Total skipped: %', processed_count, skipped_count;

END $$;
