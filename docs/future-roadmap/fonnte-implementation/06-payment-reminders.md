# Phase 6 — Payment Reminder Endpoint

**Deliverable**: `api/notifications/payment-reminder.js`
**Dependency**: Phase 2 (`api/_lib/fonnte.js` — `enqueueNotification`), Phase 4 (queue infrastructure).
**Trigger**: Vercel/pg_cron daily at 08:00 WIB (01:00 UTC), OR manually via admin POST.

---

## Tasks

### Task 6.1 — Auth (Same Dual Strategy as Dispatcher)

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

### Task 6.2 — Fetch Active Customers with Phone Numbers

```js
const { data: customers } = await supabaseAdmin
  .from('customers')
  .select('id, name, phone, install_date, billing_due_day')
  .not('phone', 'is', null);
```

Track customers skipped due to missing phone: `noPhoneSkipped`.

> When a customer `status` column is added to the schema in the future, add `.eq('status', 'Aktif')` to this query.

---

### Task 6.3 — Due Date Calculation Utilities

```js
/** Determine billing due day for a customer (1–28). */
function getBillingDueDay(customer) {
  if (customer.billing_due_day) return customer.billing_due_day;
  if (customer.install_date) {
    return Math.min(new Date(customer.install_date).getDate(), 28);
  }
  return 1; // safe fallback
}

/** Build the next upcoming due date for a customer. */
function getNextDueDate(customer) {
  // Use WIB-offset "today" so day comparison is accurate
  const todayWIB = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const dueDay = getBillingDueDay(customer);
  let due = new Date(todayWIB.getFullYear(), todayWIB.getMonth(), dueDay);
  // If this month's due date is already past, use next month
  if (due < todayWIB) {
    due = new Date(todayWIB.getFullYear(), todayWIB.getMonth() + 1, dueDay);
  }
  return due;
}

/** How many days until (or since) the due date. Negative = past due. */
function getDaysDiff(dueDate) {
  const todayWIB = new Date(Date.now() + 7 * 60 * 60 * 1000);
  todayWIB.setUTCHours(0, 0, 0, 0);
  dueDate.setUTCHours(0, 0, 0, 0);
  return Math.round((dueDate - todayWIB) / (1000 * 60 * 60 * 24));
}
```

---

### Task 6.4 — Enqueue `payment_due_soon` (Priority 2)

**Condition**: `daysDiff === 3` (exactly 3 days before due date)

```js
const yearMonth = todayWIB.toISOString().slice(0, 7); // 'YYYY-MM'

if (daysDiff === 3) {
  const result = await enqueueNotification({
    recipient: customer.phone,
    messageType: 'payment_due_soon',
    payload: {
      name: customer.name,
      due_date: dueDate.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      }),
      amount: '—',  // placeholder until billing module exists
    },
    priority: 2,
    refId: `${customer.id}-${yearMonth}-due_soon`,
  });
  if (result.queued) queuedDueSoon++;
  else if (result.reason === 'duplicate') duplicatesSkipped++;
}
```

---

### Task 6.5 — Enqueue `payment_overdue` (Priority 1)

**Condition**: `daysDiff === -1` (1 day past the due date)

```js
if (daysDiff === -1) {
  const result = await enqueueNotification({
    recipient: customer.phone,
    messageType: 'payment_overdue',
    payload: {
      name: customer.name,
      due_date: dueDate.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      }),
      amount: '—',
    },
    priority: 1,
    refId: `${customer.id}-${yearMonth}-overdue`,
  });
  if (result.queued) queuedOverdue++;
  else if (result.reason === 'duplicate') duplicatesSkipped++;
}
```

---

### Task 6.6 — Response Payload

```json
{
  "processed": 142,
  "queued_due_soon": 7,
  "queued_overdue": 3,
  "duplicates_skipped": 2,
  "no_phone_skipped": 5
}
```

---

## Full File Structure

```js
// api/notifications/payment-reminder.js
/**
 * POST /api/notifications/payment-reminder
 * GET  /api/notifications/payment-reminder   ← for Vercel cron
 *
 * Scans all customers and enqueues payment reminders based on billing due dates.
 * Auth: Admin JWT  OR  x-cron-secret header.
 * Cron schedule: daily at 01:00 UTC (08:00 WIB).
 */
import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { enqueueNotification } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  // Task 6.1 — Auth
  // Task 6.2 — Fetch customers
  // Helper functions (Tasks 6.3)
  // Task 6.4 + 6.5 — Main loop
  // Task 6.6 — Return response
});
```

---

## Scope Notes

1. **Amount placeholder**: `amount` uses `'—'` until a billing/invoice module is built. The WA template is designed to remain meaningful without a specific Rupiah amount.

2. **Active-only filter**: Add `.eq('status', 'Aktif')` to the customer query once the `customers` table has a `status` column.

3. **WIB timezone**: All date math uses `Date.now() + 7 * 3600 * 1000` offset. Never use `new Date()` raw for day comparison in this endpoint.

4. **dedup scope**: The `refId` is scoped to `customer_id + YYYY-MM + type`, meaning if a customer's `billing_due_day` changes mid-month, a second reminder for the same month would be blocked. This is the desired behavior.

---

## Verification Checklist

- [ ] Insert a customer with `install_date` exactly 3 days from today (WIB)
- [ ] POST `/api/notifications/payment-reminder` → `notification_queue` has a `payment_due_soon` row for that customer
- [ ] Run endpoint a second time same day → returns `duplicates_skipped: 1` (dedup working)
- [ ] Check queue row: `priority = 2`, `status = 'pending'`, `scheduled_at` is today
- [ ] Dispatch endpoint processes it → customer WA received
- [ ] Insert customer with due date yesterday → `payment_overdue` row in queue with `priority = 1`
- [ ] Dispatch at night → P1 overdue message sends (not blocked by night window)
- [ ] Customer with `phone = NULL` → counted in `no_phone_skipped`, no crash
- [ ] Customer with `billing_due_day = NULL` and `install_date = NULL` → defaults to day 1, no crash
