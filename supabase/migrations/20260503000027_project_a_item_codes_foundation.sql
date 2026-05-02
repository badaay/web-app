-- Migration: 027_item_codes_foundation.sql
-- Story 5.1: Database Schema Setup for Item Code System
-- Adds item_code and short_code columns to work_orders, inventory_items, and master_queue_types.

-- 1. work_orders table
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS item_code TEXT;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_item_code_key') THEN
        ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_item_code_key UNIQUE (item_code);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_work_orders_item_code ON public.work_orders(item_code);

-- 2. inventory_items table
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS item_code TEXT;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_items_item_code_key') THEN
        ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_item_code_key UNIQUE (item_code);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_inventory_items_item_code ON public.inventory_items(item_code);

-- 3. master_queue_types table (for prefix mapping)
ALTER TABLE public.master_queue_types ADD COLUMN IF NOT EXISTS short_code TEXT;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'master_queue_types_short_code_key') THEN
        ALTER TABLE public.master_queue_types ADD CONSTRAINT master_queue_types_short_code_key UNIQUE (short_code);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_master_queue_types_short_code ON public.master_queue_types(short_code);

-- Comments for Rollback:
-- ALTER TABLE public.work_orders DROP COLUMN IF EXISTS item_code;
-- ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS item_code;
-- ALTER TABLE public.master_queue_types DROP COLUMN IF EXISTS short_code;
-- DROP INDEX IF EXISTS idx_work_orders_item_code;
-- DROP INDEX IF EXISTS idx_inventory_items_item_code;
-- DROP INDEX IF EXISTS idx_master_queue_types_short_code;
