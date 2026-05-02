-- Migration: 028_item_code_functions.sql
-- Story 5.2: Code Generation Functions for Item Code System

-- 1. Sequence Tracking Table
CREATE TABLE IF NOT EXISTS public.item_code_sequences (
    prefix TEXT NOT NULL,
    period TEXT NOT NULL, -- YYMM for work orders, YY for inventory
    sequence INTEGER DEFAULT 1,
    last_updated TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (prefix, period)
);

-- 2. Update Master Queue Types with short_codes if they are NULL
UPDATE public.master_queue_types SET short_code = 'PSN' WHERE name = 'PSB' AND (short_code IS NULL OR short_code = '');
UPDATE public.master_queue_types SET short_code = 'REP' WHERE name = 'Repair' AND (short_code IS NULL OR short_code = '');
UPDATE public.master_queue_types SET short_code = 'REL' WHERE name = 'Relocation' AND (short_code IS NULL OR short_code = '');
UPDATE public.master_queue_types SET short_code = 'UPG' WHERE name = 'Upgrade' AND (short_code IS NULL OR short_code = '');
UPDATE public.master_queue_types SET short_code = 'CAN' WHERE name = 'Cancel' AND (short_code IS NULL OR short_code = '');

-- 3. Inventory Prefix Helper
CREATE OR REPLACE FUNCTION public.get_inventory_prefix(p_category TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE p_category
        WHEN 'Modem' THEN 'MOD'
        WHEN 'Cable' THEN 'CAB'
        WHEN 'Antenna' THEN 'ANT'
        WHEN 'Connector' THEN 'CON'
        WHEN 'Power' THEN 'PWR'
        WHEN 'Tools' THEN 'TLS'
        WHEN 'Accessories' THEN 'ACC'
        WHEN 'Materials' THEN 'MAT'
        ELSE 'OTH'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 4. Work Order Code Generator
-- Format: {PREFIX}{YY}{MM}{SEQUENCE:3d} (e.g., PSN2605001)
CREATE OR REPLACE FUNCTION public.generate_work_order_code(p_type_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_period TEXT;
    v_seq INTEGER;
BEGIN
    -- Get prefix from master_queue_types
    SELECT short_code INTO v_prefix FROM public.master_queue_types WHERE id = p_type_id;
    
    -- Fallback prefix if not found
    IF v_prefix IS NULL OR v_prefix = '' THEN 
        v_prefix := 'WO'; 
    END IF;

    -- Period format: YYMM (Monthly reset)
    v_period := to_char(now(), 'YYMM');

    -- Atomic sequence increment
    INSERT INTO public.item_code_sequences (prefix, period, sequence)
    VALUES (v_prefix, v_period, 1)
    ON CONFLICT (prefix, period)
    DO UPDATE SET sequence = item_code_sequences.sequence + 1, last_updated = now()
    RETURNING sequence INTO v_seq;

    -- Format result
    RETURN v_prefix || v_period || lpad(v_seq::text, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Inventory Item Code Generator
-- Format: {PREFIX}{YY}{SEQUENCE:4d} (e.g., MOD260001)
CREATE OR REPLACE FUNCTION public.generate_inventory_code(p_category TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_period TEXT;
    v_seq INTEGER;
BEGIN
    -- Map category to prefix
    v_prefix := public.get_inventory_prefix(p_category);

    -- Period format: YY (Yearly reset)
    v_period := to_char(now(), 'YY');

    -- Atomic sequence increment
    INSERT INTO public.item_code_sequences (prefix, period, sequence)
    VALUES (v_prefix, v_period, 1)
    ON CONFLICT (prefix, period)
    DO UPDATE SET sequence = item_code_sequences.sequence + 1, last_updated = now()
    RETURNING sequence INTO v_seq;

    -- Format result
    RETURN v_prefix || v_period || lpad(v_seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rollback Instructions:
-- DROP FUNCTION IF EXISTS public.generate_inventory_code(TEXT);
-- DROP FUNCTION IF EXISTS public.generate_work_order_code(UUID);
-- DROP FUNCTION IF EXISTS public.get_inventory_prefix(TEXT);
-- DROP TABLE IF EXISTS public.item_code_sequences;
