-- Migration: 010_points_trigger.sql
-- Description: Automatically populate work_orders.points from master_queue_types.base_point
--              when a work order is closed. Prevents client-side manipulation of point values.
-- Date: 2026-03-19
-- Run in: Supabase SQL Editor (as postgres / service role)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Trigger function
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_work_order_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when transitioning INTO 'closed' status
  IF NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' THEN
    -- Stamp the completion timestamp if not already set
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;

    -- Look up the canonical base_point from the queue type
    IF NEW.type_id IS NOT NULL THEN
      SELECT base_point
        INTO NEW.points
        FROM public.master_queue_types
       WHERE id = NEW.type_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Drop existing trigger if any, then recreate
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_work_order_closed ON public.work_orders;

CREATE TRIGGER trg_work_order_closed
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_work_order_closed();
