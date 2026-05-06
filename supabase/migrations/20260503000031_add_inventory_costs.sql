-- Migration: Add Inventory Costs
-- Description: Adds purchase_price and unit_price to inventory_items for financial tracking.
-- Date: 2026-05-03

ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12, 2) DEFAULT 0;

-- Comments for documentation
COMMENT ON COLUMN public.inventory_items.purchase_price IS 'Harga beli barang per unit';
COMMENT ON COLUMN public.inventory_items.unit_price IS 'Harga jual/standar barang per unit';
