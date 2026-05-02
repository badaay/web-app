-- Temporary debug function to test FDW connectivity
CREATE OR REPLACE FUNCTION public.check_remote_vault_connection()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM remote_vault.notification_queue;
    RETURN 'Connection OK, count: ' || v_count;
EXCEPTION WHEN OTHERS THEN
    RETURN 'Connection FAILED: ' || SQLERRM;
END;
$$;
