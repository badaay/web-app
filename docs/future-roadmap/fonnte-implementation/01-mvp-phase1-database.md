# MVP Phase 1 — Database Migration

**Deliverable**: `src/api/migrations/012_fonnte_notification_queue.sql`
**Dependency**: None — run this before any code changes.
**Run in**: Supabase SQL Editor as postgres / service role.

---

## Tasks

### Task 1.1 — Create `notification_queue` Table

| Column         | Type              | Default           | Notes                                                                                |
|----------------|-------------------|-------------------|--------------------------------------------------------------------------------------|
| `id`           | UUID PK           | gen_random_uuid() |                                                                                      |
| `recipient`    | TEXT NOT NULL     |                   | Phone number, Indonesian format: `628xxxxxxxxxx`                                     |
| `message_type` | TEXT NOT NULL     |                   | wo_created \| wo_confirmed \| wo_open \| wo_closed \| welcome_installed \| payment_due_soon \| payment_overdue |
| `payload`      | JSONB             | '{}'              | Template variables e.g. `{ "name": "Budi", "wo_id": "abc" }`                        |
| `priority`     | INTEGER NOT NULL  | 2                 | 1=urgent/direct, 2=normal queue, 3=bulk/later                                        |
| `status`       | TEXT NOT NULL     | 'pending'         | pending \| processing \| sent \| failed                                              |
| `dedup_hash`   | TEXT UNIQUE       |                   | Fingerprint to prevent duplicate sends                                               |
| `scheduled_at` | TIMESTAMPTZ       | now()             | When message is eligible for dispatch                                                |
| `sent_at`      | TIMESTAMPTZ       | NULL              | Populated on successful send                                                         |
| `error_msg`    | TEXT              | NULL              | Populated on failed send for debugging                                               |
| `created_at`   | TIMESTAMPTZ       | now()             |                                                                                      |

---

### Task 1.2 — Create Performance Index

Partial index covering only `pending` rows — keeps the index small as the table grows:

```sql
CREATE INDEX idx_notif_queue_dispatch
  ON public.notification_queue (status, priority, scheduled_at)
  WHERE status = 'pending';
```

---

### Task 1.3 — Seed `app_settings` Rows for Fonnte Config

Insert 5 rows. Safe to re-run — uses `ON CONFLICT (setting_key) DO NOTHING`:

| setting_key           | value   | group  | description                                    |
|-----------------------|---------|--------|------------------------------------------------|
| FONNTE_TOKEN          | (blank) | fonnte | API token from fonnte.com dashboard            |
| FONNTE_DAILY_LIMIT    | 500     | fonnte | Max WhatsApp messages allowed per day          |
| FONNTE_WARN_THRESHOLD | 0.80    | fonnte | Warning fraction (0.0–1.0)                     |
| FONNTE_SENT_TODAY     | 0       | fonnte | Rolling daily counter, reset each day          |
| FONNTE_LAST_RESET     | now()   | fonnte | ISO timestamp of last daily counter reset      |

---

### Task 1.4 — Enable RLS on `notification_queue`

Admin-class (S_ADM, OWNER, ADM) can read and write.
Service role (`supabaseAdmin`) bypasses RLS automatically — no extra policy needed for server-side code.

---

### Task 1.5 — Add `billing_due_day` to Customers

Prerequisite for Phase 6 payment reminders.
If `billing_due_day` is NULL, Phase 6 falls back to `EXTRACT(DAY FROM install_date)`, then to `1` if `install_date` is also null.

```sql
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS billing_due_day INTEGER
    CHECK (billing_due_day >= 1 AND billing_due_day <= 28);
```

---

## Full Migration Script (Copy-Paste Ready)

```sql
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
    USING (is_admin_class())
    WITH CHECK (is_admin_class());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Fonnte config settings (safe to re-run)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.app_settings (setting_key, setting_value, setting_group, description)
VALUES
    ('FONNTE_TOKEN',          '',          'fonnte', 'API token from fonnte.com dashboard'),
    ('FONNTE_DAILY_LIMIT',    '500',       'fonnte', 'Max WhatsApp messages allowed per day'),
    ('FONNTE_WARN_THRESHOLD', '0.80',      'fonnte', 'Fraction of daily limit that triggers admin warning (0.0–1.0)'),
    ('FONNTE_SENT_TODAY',     '0',         'fonnte', 'Rolling daily message counter, reset each day'),
    ('FONNTE_LAST_RESET',     NOW()::TEXT, 'fonnte', 'ISO timestamp of last daily counter reset')
ON CONFLICT (setting_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. billing_due_day on customers (prerequisite for payment reminders)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS billing_due_day INTEGER
        CHECK (billing_due_day >= 1 AND billing_due_day <= 28);
```

---

## Verification Checklist

- [ ] `SELECT * FROM notification_queue LIMIT 1;` — returns empty result, no error
- [ ] `SELECT setting_key, setting_value FROM app_settings WHERE setting_group = 'fonnte';` — returns 5 rows
- [ ] `\d notification_queue` — all columns visible; `dedup_hash` shows UNIQUE constraint
- [ ] Insert two rows with same `dedup_hash` → second insert fails with Postgres error code `23505`
- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='customers' AND column_name='billing_due_day';` — 1 row
- [ ] `INSERT INTO customers (..., billing_due_day) VALUES (..., 29)` — fails with check constraint
