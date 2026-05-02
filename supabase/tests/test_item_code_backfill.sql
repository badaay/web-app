-- Validation Script for Item Code Backfill
-- Story 5.4 Verification

DO $$
DECLARE
    v_missing_wo INTEGER;
    v_missing_inv INTEGER;
    v_dup_wo INTEGER;
    v_dup_inv INTEGER;
BEGIN
    -- 1. Check for missing codes
    SELECT COUNT(*) INTO v_missing_wo FROM public.work_orders WHERE item_code IS NULL;
    SELECT COUNT(*) INTO v_missing_inv FROM public.inventory_items WHERE item_code IS NULL;
    
    IF v_missing_wo > 0 THEN
        RAISE WARNING '% work orders are still missing item_codes', v_missing_wo;
    END IF;
    
    IF v_missing_inv > 0 THEN
        RAISE WARNING '% inventory items are still missing item_codes', v_missing_inv;
    END IF;

    -- 2. Check for duplicates
    SELECT COUNT(*) INTO v_dup_wo FROM (
        SELECT item_code FROM public.work_orders 
        WHERE item_code IS NOT NULL 
        GROUP BY item_code HAVING COUNT(*) > 1
    ) s;
    
    SELECT COUNT(*) INTO v_dup_inv FROM (
        SELECT item_code FROM public.inventory_items 
        WHERE item_code IS NOT NULL 
        GROUP BY item_code HAVING COUNT(*) > 1
    ) s;

    IF v_dup_wo > 0 THEN
        RAISE EXCEPTION 'Found % duplicate item_codes in work_orders', v_dup_wo;
    END IF;
    
    IF v_dup_inv > 0 THEN
        RAISE EXCEPTION 'Found % duplicate item_codes in inventory_items', v_dup_inv;
    END IF;

    RAISE NOTICE 'Item Code Backfill Verification: PASSED';
END $$;
