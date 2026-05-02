-- Validation Script for Item Code Triggers
-- Story 5.3 Verification

DO $$
DECLARE
    v_type_id UUID;
    v_wo_id UUID;
    v_inv_id UUID;
    v_wo_code TEXT;
    v_inv_code TEXT;
BEGIN
    -- 1. Setup: Get a Type ID
    SELECT id INTO v_type_id FROM public.master_queue_types WHERE short_code = 'PSN' LIMIT 1;
    
    IF v_type_id IS NULL THEN
        RAISE NOTICE 'No PSB type found, skipping WO trigger test';
    ELSE
        -- 2. Test WO Trigger
        INSERT INTO public.work_orders (title, type_id, status)
        VALUES ('Trigger Test WO', v_type_id, 'waiting')
        RETURNING id, item_code INTO v_wo_id, v_wo_code;
        
        RAISE NOTICE 'Inserted WO ID: %, Generated Code: %', v_wo_id, v_wo_code;
        
        IF v_wo_code IS NULL THEN
            RAISE EXCEPTION 'WO Trigger failed to generate code';
        END IF;
        
        -- Cleanup
        DELETE FROM public.work_orders WHERE id = v_wo_id;
    END IF;

    -- 3. Test Inventory Trigger
    INSERT INTO public.inventory_items (name, category, unit, stock)
    VALUES ('Trigger Test Item', 'Modem', 'pcs', 10)
    RETURNING id, item_code INTO v_inv_id, v_inv_code;
    
    RAISE NOTICE 'Inserted Inv ID: %, Generated Code: %', v_inv_id, v_inv_code;
    
    IF v_inv_code IS NULL THEN
        RAISE EXCEPTION 'Inventory Trigger failed to generate code';
    END IF;
    
    -- Cleanup
    DELETE FROM public.inventory_items WHERE id = v_inv_id;

    RAISE NOTICE 'Item Code Triggers Verification: PASSED';
END $$;
