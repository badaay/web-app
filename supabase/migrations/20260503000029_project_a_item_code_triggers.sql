-- Migration: 029_item_code_triggers.sql
-- Story 5.3: Auto-generation Triggers for Item Code System

-- 1. Work Order Trigger Function
CREATE OR REPLACE FUNCTION public.trg_fn_generate_work_order_item_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if item_code is NOT provided in the INSERT
    IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
        BEGIN
            NEW.item_code := public.generate_work_order_code(NEW.type_id);
        EXCEPTION WHEN OTHERS THEN
            -- Log error and proceed with NULL to avoid blocking the INSERT
            RAISE WARNING 'Item code generation failed for work_order: %', SQLERRM;
            NEW.item_code := NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Work Order Trigger
DROP TRIGGER IF EXISTS trg_work_orders_item_code ON public.work_orders;
CREATE TRIGGER trg_work_orders_item_code
    BEFORE INSERT ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.trg_fn_generate_work_order_item_code();

-- 3. Inventory Item Trigger Function
CREATE OR REPLACE FUNCTION public.trg_fn_generate_inventory_item_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if item_code is NOT provided in the INSERT
    IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
        BEGIN
            NEW.item_code := public.generate_inventory_code(NEW.category);
        EXCEPTION WHEN OTHERS THEN
            -- Log error and proceed with NULL
            RAISE WARNING 'Item code generation failed for inventory_item: %', SQLERRM;
            NEW.item_code := NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Inventory Item Trigger
DROP TRIGGER IF EXISTS trg_inventory_items_item_code ON public.inventory_items;
CREATE TRIGGER trg_inventory_items_item_code
    BEFORE INSERT ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.trg_fn_generate_inventory_item_code();

-- Rollback Instructions:
-- DROP TRIGGER IF EXISTS trg_inventory_items_item_code ON public.inventory_items;
-- DROP FUNCTION IF EXISTS public.trg_fn_generate_inventory_item_code();
-- DROP TRIGGER IF EXISTS trg_work_orders_item_code ON public.work_orders;
-- DROP FUNCTION IF EXISTS public.trg_fn_generate_work_order_item_code();
