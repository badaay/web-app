-- Migration: 030_item_code_backfill.sql
-- Story 5.4: Data Backfill for Item Code System

DO $$
DECLARE
    v_total_wo INTEGER;
    v_total_inv INTEGER;
    v_success_wo INTEGER := 0;
    v_success_inv INTEGER := 0;
    v_error_wo INTEGER := 0;
    v_error_inv INTEGER := 0;
    r RECORD;
BEGIN
    -- 1. Ensure master_queue_types short_codes are set (Safety check)
    UPDATE public.master_queue_types SET short_code = 'PSN' WHERE name = 'PSB' AND (short_code IS NULL OR short_code = '');
    UPDATE public.master_queue_types SET short_code = 'REP' WHERE name = 'Repair' AND (short_code IS NULL OR short_code = '');
    UPDATE public.master_queue_types SET short_code = 'REL' WHERE name = 'Relocation' AND (short_code IS NULL OR short_code = '');
    UPDATE public.master_queue_types SET short_code = 'UPG' WHERE name = 'Upgrade' AND (short_code IS NULL OR short_code = '');
    UPDATE public.master_queue_types SET short_code = 'CAN' WHERE name = 'Cancel' AND (short_code IS NULL OR short_code = '');

    -- 2. Backfill Work Orders
    SELECT COUNT(*) INTO v_total_wo FROM public.work_orders WHERE item_code IS NULL;
    RAISE NOTICE 'Starting backfill for % work orders...', v_total_wo;

    FOR r IN (SELECT id, type_id FROM public.work_orders WHERE item_code IS NULL) LOOP
        BEGIN
            UPDATE public.work_orders 
            SET item_code = public.generate_work_order_code(r.type_id)
            WHERE id = r.id;
            v_success_wo := v_success_wo + 1;
        EXCEPTION WHEN OTHERS THEN
            v_error_wo := v_error_wo + 1;
            RAISE WARNING 'Failed backfill for work_order %: %', r.id, SQLERRM;
        END;
    END LOOP;

    -- 3. Backfill Inventory Items
    SELECT COUNT(*) INTO v_total_inv FROM public.inventory_items WHERE item_code IS NULL;
    RAISE NOTICE 'Starting backfill for % inventory items...', v_total_inv;

    FOR r IN (SELECT id, category FROM public.inventory_items WHERE item_code IS NULL) LOOP
        BEGIN
            UPDATE public.inventory_items 
            SET item_code = public.generate_inventory_code(r.category)
            WHERE id = r.id;
            v_success_inv := v_success_inv + 1;
        EXCEPTION WHEN OTHERS THEN
            v_error_inv := v_error_inv + 1;
            RAISE WARNING 'Failed backfill for inventory_item %: %', r.id, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Backfill Completed:';
    RAISE NOTICE 'Work Orders: % success, % failed', v_success_wo, v_error_wo;
    RAISE NOTICE 'Inventory Items: % success, % failed', v_success_inv, v_error_inv;
END $$;
