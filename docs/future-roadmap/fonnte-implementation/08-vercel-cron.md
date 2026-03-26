# Phase 8 — Vercel Cron Wiring

**Deliverable**: Modified `vercel.json` + `CRON_SECRET` environment variable.
**Dependency**: Phase 4 (`dispatch.js`) and Phase 6 (`payment-reminder.js`) deployed and accepting `GET`.
**Requirement**: Vercel Pro plan for native cron. See alternatives below for free tiers.

---

## Tasks

### Task 8.1 — Add `crons` Array to `vercel.json`

Append to the root JSON object:

```json
"crons": [
  {
    "path": "/api/notifications/dispatch",
    "schedule": "*/5 * * * *"
  },
  {
    "path": "/api/notifications/payment-reminder",
    "schedule": "0 1 * * *"
  }
]
```

**Schedule details**:

| Job              | Cron Expression | Meaning                  | WIB Equivalent    |
|------------------|-----------------|--------------------------|-------------------|
| dispatch         | `*/5 * * * *`   | Every 5 minutes, all day | All day           |
| payment-reminder | `0 1 * * *`     | Daily at 01:00 UTC       | 08:00 WIB daily   |

> Vercel sends **GET** requests for cron jobs — both endpoints must handle `GET` (already covered in Phases 4 & 6 by accepting `req.method !== 'POST' && req.method !== 'GET'`).

---

### Task 8.2 — `CRON_SECRET` Environment Variable

**Location**: Vercel Dashboard → Project Settings → Environment Variables

| Key           | Value                  | Environments            |
|---------------|------------------------|-------------------------|
| `CRON_SECRET` | Random 32+ char string | Production + Preview    |

Generate a secure value:
```bash
openssl rand -hex 32
```

This secret is:
- Validated by `dispatch.js` and `payment-reminder.js` on `x-cron-secret` header
- Used in Supabase pg_cron and GitHub Actions alternatives below
- Can be used for manual admin triggers from the UI in future

---

### Task 8.3 — Vercel Cron Authentication

Vercel sends GET with `Authorization: Bearer <VERCEL_AUTOMATION_BYPASS_SECRET>`.
Our endpoints use `x-cron-secret` header instead (simpler, no Vercel-specific dependency).

**Workaround**: Since Vercel cron cannot send custom headers natively, use the **Supabase pg_cron** or **GitHub Actions** alternatives listed below — both can pass the `x-cron-secret` header precisely.

If using Vercel native cron without custom headers, add this fallback to both endpoints:
```js
// Accept Vercel's VERCEL_AUTOMATION_BYPASS_SECRET as alternative
const vercelAutoHeader = req.headers.get('authorization');
if (vercelAutoHeader === `Bearer ${process.env.VERCEL_AUTOMATION_BYPASS_SECRET}`) {
  // proceed
}
```

---

### Task 8.4 — Verify in Vercel Dashboard

After deploying to Vercel Pro:
1. Open Project → **Cron Jobs** tab
2. Both jobs listed with their schedules
3. Click "**Run Now**" → check **Function Logs** for dispatcher output
4. Confirm `FONNTE_SENT_TODAY` increments in `app_settings` after a run

---

## Alternative A — Supabase pg_cron (Pro plan compatible)

Uses Supabase's built-in `pg_cron` + `pg_net` to HTTP-call the endpoints from within the database.

### Step 1: Enable extensions (run once in SQL Editor)
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Step 2: Schedule dispatcher (every 5 minutes)
```sql
SELECT cron.schedule(
  'fonnte-dispatch',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://<your-vercel-domain>/api/notifications/dispatch',
      headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET>'),
      body    := '{}'::jsonb
    );
  $$
);
```

### Step 3: Schedule payment reminder (daily 01:00 UTC = 08:00 WIB)
```sql
SELECT cron.schedule(
  'fonnte-payment-reminder',
  '0 1 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://<your-vercel-domain>/api/notifications/payment-reminder',
      headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET>'),
      body    := '{}'::jsonb
    );
  $$
);
```

### Step 4: Verify and manage
```sql
-- List all scheduled jobs
SELECT * FROM cron.job;

-- View execution history (last 20 runs)
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Remove a job if needed
SELECT cron.unschedule('fonnte-dispatch');
```

---

## Alternative B — GitHub Actions (100% Free)

For teams on both Vercel Free and Supabase Free tiers.

### Create `.github/workflows/fonnte-cron.yml`

```yaml
name: Fonnte Notification Cron

on:
  schedule:
    - cron: '*/5 * * * *'   # dispatch every 5 minutes
    - cron: '0 1 * * *'      # payment reminder daily 01:00 UTC
  workflow_dispatch:          # allow manual trigger from GitHub UI

jobs:
  dispatch:
    runs-on: ubuntu-latest
    if: github.event.schedule == '*/5 * * * *' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Trigger Fonnte Queue Dispatcher
        run: |
          curl -s -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://<your-vercel-domain>/api/notifications/dispatch

  payment-reminder:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 1 * * *' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Trigger Payment Reminder
        run: |
          curl -s -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://<your-vercel-domain>/api/notifications/payment-reminder
```

**Add the secret**: GitHub repo → Settings → Secrets → Actions → `CRON_SECRET`

**Free tier budget**: GitHub Actions free = 2000 min/month.
At 5-min intervals = ~288 runs/day × ~0.3s each ≈ 87 min/day. Well within limits.

---

## Comparison Table

| Option              | Dispatch freq | Cost      | Custom headers | Complexity |
|---------------------|---------------|-----------|----------------|------------|
| Vercel Cron (Pro)   | Every 1 min   | ~$20/mo   | Via workaround | Low        |
| Supabase pg_cron    | Every 1 min   | Pro plan  | ✅ Yes          | Medium     |
| GitHub Actions      | Every 5 min   | Free      | ✅ Yes          | Low        |
| Manual (admin UI)   | On-demand     | Free      | N/A            | None       |

**Recommended for most projects**: GitHub Actions (free, reliable, full header control).

---

## Verification Checklist

- [ ] `vercel.json` parses without errors (`npx vercel --help` or check deploy logs)
- [ ] Vercel Cron Jobs tab shows both jobs listed (if on Pro plan)
- [ ] "Run Now" on dispatch → function logs show `{ dispatched: N, failed: M }`
- [ ] "Run Now" on payment-reminder → function logs show `{ processed: N }`
- [ ] `FONNTE_SENT_TODAY` increments in `app_settings` across multiple cron runs
- [ ] Old `pending` queue items from previous day still process after midnight (daily reset doesn't delete them)
- [ ] Request with wrong `CRON_SECRET` → `401 Unauthorized`
- [ ] GitHub Actions workflow triggers on schedule (check Actions tab in repo)
