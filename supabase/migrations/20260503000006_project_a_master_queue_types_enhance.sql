-- Migration: 006_master_queue_types_enhance.sql
-- Description: Add color and icon columns to master_queue_types table
-- Date: 2026-03-17

ALTER TABLE public.master_queue_types
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6b7280',
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'bi-ticket-detailed';

-- Update existing rows with color and icon values
-- Using ON CONFLICT to handle both existing and new rows
INSERT INTO public.master_queue_types (name, base_point, color, icon) VALUES
  ('PSB',       100, '#22c55e', 'bi-house-add-fill'),
  ('Repair',     50, '#ef4444', 'bi-tools'),
  ('Relocation', 75, '#f59e0b', 'bi-arrow-left-right'),
  ('Upgrade',    50, '#3b82f6', 'bi-arrow-up-circle-fill'),
  ('Cancel',      0, '#6b7280', 'bi-x-circle-fill')
ON CONFLICT (name) DO UPDATE SET
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;
