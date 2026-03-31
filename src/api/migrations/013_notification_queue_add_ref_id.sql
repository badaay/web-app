-- Migration: 013_notification_queue_add_ref_id.sql
-- Description: Add ref_id column to notification_queue for traceability back to
--              the originating record (Work Order ID, Customer ID, etc.).
--              Safe to run even if 012 already included the column.
-- Date: 2026-03-26
-- Run in: Supabase SQL Editor (as postgres / service role)

ALTER TABLE public.notification_queue
    ADD COLUMN IF NOT EXISTS ref_id UUID;

-- Optional index for fast lookups by work order / source record
CREATE INDEX IF NOT EXISTS idx_notif_queue_ref_id
    ON public.notification_queue (ref_id)
    WHERE ref_id IS NOT NULL;
