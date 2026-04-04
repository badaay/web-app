-- Migration: 012_fonnte_notification_queue.sql
-- Description: Notification queue table, Fonnte config settings,
--              and billing_due_day for customers.
-- Date: 2026-03-24
-- Run in: Supabase SQL Editor (as postgres / service role)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Notification Queue Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient    TEXT        NOT NULL,
    message_type TEXT        NOT NULL,
    payload      JSONB       DEFAULT '{}',
    priority     INTEGER     NOT NULL DEFAULT 2,
    status       TEXT        NOT NULL DEFAULT 'pending',
    dedup_hash   TEXT        UNIQUE,
    scheduled_at TIMESTAMPTZ DEFAULT now(),
    sent_at      TIMESTAMPTZ,
    error_msg    TEXT,
    ref_id       UUID,       -- Traceability (e.g. Work Order ID)
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Performance index (partial — only pending rows)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_queue_dispatch
    ON public.notification_queue (status, priority, scheduled_at)
    WHERE status = 'pending';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_queue_admin_all" ON public.notification_queue
    FOR ALL
    USING (is_admin_class())
    WITH CHECK (is_admin_class());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Fonnte config settings (safe to re-run)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.app_settings (setting_key, setting_value, setting_group, description)
VALUES
    ('FONNTE_TOKEN',          '',          'whatsapp', 'API token from fonnte.com dashboard'),
    ('FONNTE_DAILY_LIMIT',    '500',       'whatsapp', 'Max WhatsApp messages allowed per day'),
    ('FONNTE_WARN_THRESHOLD', '0.80',      'whatsapp', 'Fraction of daily limit that triggers admin warning (0.0–1.0)'),
    ('FONNTE_SENT_TODAY',     '0',         'whatsapp', 'Rolling daily message counter, reset each day'),
    ('FONNTE_LAST_RESET',     NOW()::TEXT, 'whatsapp', 'ISO timestamp of last daily counter reset')
ON CONFLICT (setting_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. billing_due_day on customers (prerequisite for payment reminders)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS billing_due_day INTEGER
        CHECK (billing_due_day >= 1 AND billing_due_day <= 28);
