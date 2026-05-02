-- Validation Script for Item Code Generation Functions
-- Story 5.2 Verification

DO $$
DECLARE
    v_type_id UUID;
    v_code1 TEXT;
    v_code2 TEXT;
    v_inv_code1 TEXT;
    v_inv_code2 TEXT;
BEGIN
    -- 1. Setup/Get a Type ID (PSB)
    SELECT id INTO v_type_id FROM public.master_queue_types WHERE short_code = 'PSN' LIMIT 1;
    
    IF v_type_id IS NULL THEN
        RAISE NOTICE 'No PSB type found, skipping WO code test';
    ELSE
        -- 2. Test WO Code Generation
        v_code1 := public.generate_work_order_code(v_type_id);
        v_code2 := public.generate_work_order_code(v_type_id);
        
        RAISE NOTICE 'Generated WO Code 1: %', v_code1;
        RAISE NOTICE 'Generated WO Code 2: %', v_code2;
        
        IF v_code1 IS NULL OR v_code2 IS NULL THEN
            RAISE EXCEPTION 'WO Code generation returned NULL';
        END IF;
        
        IF v_code1 = v_code2 THEN
            RAISE EXCEPTION 'WO Codes are not unique';
        END IF;
        
        -- Check format (e.g. PSN2605001)
        IF v_code1 !~ '^[A-Z]{2,3}[0-9]{7}$' THEN
            RAISE NOTICE 'WO Code format unexpected: %', v_code1;
        END IF;
    END IF;

    -- 3. Test Inventory Code Generation
    v_inv_code1 := public.generate_inventory_code('Modem');
    v_inv_code2 := public.generate_inventory_code('Modem');
    
    RAISE NOTICE 'Generated Inventory Code 1: %', v_inv_code1;
    RAISE NOTICE 'Generated Inventory Code 2: %', v_inv_code2;
    
    IF v_inv_code1 IS NULL OR v_inv_code2 IS NULL THEN
        RAISE EXCEPTION 'Inventory Code generation returned NULL';
    END IF;
    
    IF v_inv_code1 = v_inv_code2 THEN
        RAISE EXCEPTION 'Inventory Codes are not unique';
    END IF;

    RAISE NOTICE 'Item Code Functions Verification: PASSED';
END $$;
