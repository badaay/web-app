-- Migration: Inventory Usage Financial Tracking (Story 2.3)
-- Created: 2026-05-02

-- 1. Update inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12, 2) DEFAULT 0.00;

-- 2. Update work_orders table
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS material_cost DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS inventory_used JSONB DEFAULT '[]'::jsonb;

-- 3. Create function to decrement inventory stock safely
CREATE OR REPLACE FUNCTION public.decrement_inventory_stock(item_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.inventory_items
    SET stock = stock - amount
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Comment on columns for clarity
COMMENT ON COLUMN public.inventory_items.unit_cost IS 'Internal purchase cost per unit for financial tracking.';
COMMENT ON COLUMN public.work_orders.material_cost IS 'Total calculated cost of materials used for this job.';
COMMENT ON COLUMN public.work_orders.inventory_used IS 'Snapshot of inventory items used: [{item_id, name, unit, quantity, unit_cost, subtotal}].';
