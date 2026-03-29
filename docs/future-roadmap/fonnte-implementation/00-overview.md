# Fonnte WhatsApp Notification System — Overview

## Architecture Summary

**Hybrid Dispatch Model**:
- **Priority 1** (WO lifecycle events) → direct-send inside existing API endpoints. Fire and forget; never fails the main response.
- **Priority 2–3** (payment reminders, bulk info) → `notification_queue` DB table, dispatched by a cron-callable endpoint every 5 minutes.

## Token & Config Storage

All Fonnte settings live in the `app_settings` table — editable via admin UI without redeploy:

| setting_key           | Default | Description                                 |
|-----------------------|---------|---------------------------------------------|
| FONNTE_TOKEN          | ''      | API token from fonnte.com dashboard         |
| FONNTE_DAILY_LIMIT    | 500     | Max messages per day before hard stop       |
| FONNTE_WARN_THRESHOLD | 0.80    | Fraction of daily limit to trigger warning  |
| FONNTE_SENT_TODAY     | 0       | Rolling counter, reset daily                |
| FONNTE_LAST_RESET     | now()   | Timestamp of last daily counter reset       |

## Notification Triggers

| Event              | Priority | Template Key       | Recipient      |
|--------------------|----------|--------------------|----------------|
| WO Created         | 1        | wo_created         | Customer phone |
| WO Confirmed       | 1        | wo_confirmed       | Customer phone |
| WO Open (Claimed)  | 1        | wo_open            | Customer phone |
| WO Closed          | 1        | wo_closed          | Customer phone |
| Welcome Installed  | 1        | welcome_installed  | Customer phone |
| Payment Due Soon   | 2        | payment_due_soon   | Customer phone |
| Payment Overdue    | 1        | payment_overdue    | Customer phone |

## Phase Order

| Phase | Scope                         | Type  | Dependency   | Status  |
|-------|-------------------------------|-------|--------------|---------|
| MVP-1 | Database migration            | DB    | None         | ⬜ Todo  |
| MVP-2 | Fonnte shared library         | API   | None         | ⬜ Todo  |
| MVP-3 | WO endpoint hooks (live send) | API   | MVP-1, MVP-2 | ⬜ Todo  |
| 4     | Queue dispatcher endpoint     | API   | MVP-2        | ⬜ Todo  |
| 5     | Notification API endpoints    | API   | MVP-2        | ⬜ Todo  |
| 6     | Payment reminder endpoint     | API   | MVP-2, 4     | ⬜ Todo  |
| 7     | Admin UI module               | UI    | 5            | ⬜ Todo  |
| 8     | Vercel Cron wiring            | Infra | 4, 6         | ⬜ Todo  |

## File Map

| Action  | File                                                          |
|---------|---------------------------------------------------------------|
| CREATE  | `src/api/migrations/012_fonnte_notification_queue.sql`        |
| CREATE  | `api/_lib/fonnte.js`                                          |
| MODIFY  | `api/work-orders/index.js`                                    |
| MODIFY  | `api/work-orders/confirm.js`                                  |
| MODIFY  | `api/work-orders/claim.js`                                    |
| MODIFY  | `api/work-orders/close.js`                                    |
| CREATE  | `api/notifications/dispatch.js`                               |
| CREATE  | `api/notifications/queue.js`                                  |
| CREATE  | `api/notifications/send.js`                                   |
| CREATE  | `api/notifications/payment-reminder.js`                       |
| CREATE  | `src/admin/modules/notifications.js`                          |
| MODIFY  | `admin/index.html`                                            |
| MODIFY  | `src/admin/admin.js`                                          |
| MODIFY  | `vercel.json`                                                 |

## Recommended Build Order (MVP First)

```
MVP-1 (DB) ──┐
             ├──► MVP-3 (WO hooks) ──► DONE. WhatsApp works end-to-end.
MVP-2 (lib) ─┘

Then gradually:
Phase 4 (dispatcher) ──► Phase 5 (APIs) ──► Phase 6 (payment) ──► Phase 7 (UI) ──► Phase 8 (cron)
```

## Scope Exclusions

- Redis/cache-layer dedup (DB UNIQUE constraint is sufficient for this scale)
- Multi-token rotation / failover
- Incoming WhatsApp webhook / chat reply handling
- Fonnte device management watchdog (future phase)
