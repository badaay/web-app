# Phase 4 — Queue Dispatcher Endpoint

**Deliverable**: `api/notifications/dispatch.js`
**Dependency**: Phase 2 (`api/_lib/fonnte.js`), Phase 1 (`notification_queue` table).
**Purpose**: Processes the pending `notification_queue` in batches.
Called by Vercel/pg_cron every 5 minutes (Phase 8), or triggered manually from the admin UI.

---

## Tasks

### Task 4.1 — Auth Strategy (Dual)

Accept **either** — reject both absent with `401`:

| Method | Header | Validation |
|--------|--------|------------|
| Cron secret | `x-cron-secret: <value>` | Exact match against `process.env.CRON_SECRET` |
| Admin JWT | `Authorization: Bearer <jwt>` | `verifyAuth(req)` + `isAdmin(user.id)` |

Check cron secret first (no DB round-trip):
```js
const cronSecret = req.headers.get('x-cron-secret');
if (cronSecret) {
  if (cronSecret !== process.env.CRON_SECRET) return errorResponse('Unauthorized', 401);
} else {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);
  if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);
}
```

---

### Task 4.2 — Daily Counter Reset

Edge runtime runs UTC — offset to WIB (UTC+7) for day comparison:
```js
const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000);
const todayWIB = nowWIB.toISOString().slice(0, 10);  // 'YYYY-MM-DD'
const lastReset = cfg.lastReset?.slice(0, 10);

if (lastReset < todayWIB) {
  await supabaseAdmin.from('app_settings')
    .update({ setting_value: '0' }).eq('setting_key', 'FONNTE_SENT_TODAY');
  await supabaseAdmin.from('app_settings')
    .update({ setting_value: new Date().toISOString() }).eq('setting_key', 'FONNTE_LAST_RESET');
  cfg.sentToday = 0;
}
```

---

### Task 4.3 — Pre-Flight Guards

Run in order after daily reset:

```
1. FONNTE_TOKEN blank?
   → return jsonResponse({ skipped: true, reason: 'token not configured' })

2. Compute usageRatio = cfg.sentToday / cfg.dailyLimit
   If usageRatio >= cfg.warnThreshold:
   → console.warn('[Fonnte] ⚠️ Daily limit approaching:', Math.round(usageRatio*100) + '%')

3. If usageRatio >= 0.95:
   → return jsonResponse({ paused: true, reason: 'daily limit critical', usage_ratio: usageRatio })
```

---

### Task 4.4 — Night Window Enforcement

Priority-3 (bulk/later) messages are held during night hours to avoid disturbing users.

```js
const wibHour = new Date(Date.now() + 7 * 60 * 60 * 1000).getUTCHours();
const isNightWindow = wibHour >= 21 || wibHour < 7;  // 21:00–06:59 WIB
```

If `isNightWindow === true` → add `.neq('priority', 3)` to the batch query.
Priority 1 and 2 always send regardless of time.

---

### Task 4.5 — Batch Fetch Query

```js
let query = supabaseAdmin
  .from('notification_queue')
  .select('*')
  .eq('status', 'pending')
  .lte('scheduled_at', new Date().toISOString())
  .order('priority', { ascending: true })
  .order('scheduled_at', { ascending: true })
  .limit(10);

if (isNightWindow) {
  query = query.neq('priority', 3);
}

const { data: jobs } = await query;
```

**Batch size = 10** per run. At 5-min intervals → up to 120 messages/hour.
This is well within the 500/day default limit.

---

### Task 4.6 — Processing Loop

For each job in `jobs`:

```
1. Mark as 'processing' (prevents parallel double-send if cron overlaps)
   UPDATE notification_queue SET status = 'processing' WHERE id = job.id

2. Look up template:
   If TEMPLATES[job.message_type] does not exist:
   → UPDATE SET status='failed', error_msg='Unknown message_type'
   → continue to next job

3. Format message:
   const text = formatMessage(TEMPLATES[job.message_type], job.payload)

4. Send:
   const result = await sendWhatsApp({ token, target: job.recipient, message: text,
                                        delay: '30-120', typingDuration: 5 })

5a. On success:
    UPDATE SET status='sent', sent_at=now() WHERE id=job.id
    Atomic counter increment:
    UPDATE app_settings
      SET setting_value = (setting_value::int + 1)
      WHERE setting_key = 'FONNTE_SENT_TODAY'
    dispatched++

5b. On failure:
    UPDATE SET status='failed', error_msg=result.error WHERE id=job.id
    Do NOT increment counter (message not consumed from Fonnte's quota)
    failed++
```

---

### Task 4.7 — Response Payload

```json
{
  "dispatched": 8,
  "failed": 1,
  "usage_ratio": 0.43,
  "daily_remaining": 285
}
```

---

## Full File Structure

```js
// api/notifications/dispatch.js
/**
 * POST /api/notifications/dispatch
 * GET  /api/notifications/dispatch   ← Vercel cron sends GET
 *
 * Processes pending notification_queue in batches of 10.
 * Auth: Admin JWT  OR  x-cron-secret header.
 */

import {
  supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse
} from '../_lib/supabase.js';
import { getTokenConfig, sendWhatsApp, formatMessage, TEMPLATES } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  // Task 4.1 — Auth
  // Task 4.2 — Daily reset
  // Task 4.3 — Pre-flight guards
  // Task 4.4 — Night window
  // Task 4.5 — Batch fetch
  // Task 4.6 — Processing loop
  // Task 4.7 — Return response
});
```

---

## Verification Checklist

- [ ] Insert 3 `pending` rows into `notification_queue` manually
- [ ] POST `/api/notifications/dispatch` with admin JWT → all 3 rows become `status='sent'`
- [ ] `FONNTE_SENT_TODAY` in `app_settings` increments by 3
- [ ] Insert a row with unknown `message_type` → row becomes `status='failed'` with error_msg; dispatcher does not crash
- [ ] POST at 22:00 WIB with priority-3 pending items → those items stay `pending`; priority-1/2 items process normally
- [ ] Set `FONNTE_SENT_TODAY = 476`, `FONNTE_DAILY_LIMIT = 500` → dispatch returns `{ paused: true }` (usageRatio = 0.952)
- [ ] Call with wrong cron secret → `401 Unauthorized`
- [ ] Call at start of a new day → `FONNTE_SENT_TODAY` resets to 0 before processing begins
