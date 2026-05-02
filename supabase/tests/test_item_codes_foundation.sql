-- Validation Script for Item Code System Foundation
-- Story 5.1 Verification

DO $$
DECLARE
    v_col_exists BOOLEAN;
    v_idx_exists BOOLEAN;
BEGIN
    -- Check work_orders
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_orders' AND column_name='item_code') INTO v_col_exists;
    IF NOT v_col_exists THEN RAISE EXCEPTION 'Column work_orders.item_code missing'; END IF;
    
    -- Check inventory_items
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='item_code') INTO v_col_exists;
    IF NOT v_col_exists THEN RAISE EXCEPTION 'Column inventory_items.item_code missing'; END IF;
    
    -- Check master_queue_types
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='master_queue_types' AND column_name='short_code') INTO v_col_exists;
    IF NOT v_col_exists THEN RAISE EXCEPTION 'Column master_queue_types.short_code missing'; END IF;

    -- Check Indexes
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_work_orders_item_code') INTO v_idx_exists;
    IF NOT v_idx_exists THEN RAISE EXCEPTION 'Index idx_work_orders_item_code missing'; END IF;

    RAISE NOTICE 'Item Code Foundation Schema Verification: PASSED';
END $$;
