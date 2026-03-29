# MVP Phase 3 — Work Order Endpoint Hooks (Direct WA Send)

**Deliverables**: 4 modified files under `api/work-orders/`
**Dependency**: Phase 2 (`api/_lib/fonnte.js` must exist and export all functions).
**Goal**: Every WO status transition sends a WhatsApp to the customer automatically.

> ⚠️ **Non-blocking rule**: WA send failures MUST NEVER cause the API endpoint to fail. Customer DAta ALWAYS returned successfully regardless of WA outcome.

---

## Universal Hook Pattern

Apply consistently across all 4 files:

```js
// ── Step 1: Add import at top of file ─────────────────────────────────────
import { getTokenConfig, sendWhatsApp, formatMessage, TEMPLATES } from '../_lib/fonnte.js';

// ── Step 2: Insert AFTER successful DB operation, BEFORE return jsonResponse ─
try {
  const cfg = await getTokenConfig();
  if (cfg?.token && customer?.phone) {
    const message = formatMessage(TEMPLATES['<template_key>'], {
      name: customer.name,
      // ...template-specific variables
    });
    await sendWhatsApp({
      token: cfg.token,
      target: customer.phone,
      message,
      delay: '5-15',       // shorter delay for Priority 1 direct sends
      typingDuration: 3,
    });
  }
} catch (_err) {
  console.error('[Fonnte] WA send failed (non-blocking):', _err?.message);
  // intentionally swallowed — WA never blocks the API response
}

return jsonResponse({ success: true, data: ... }); // unchanged
```

---

## Task 3.1 — `api/work-orders/index.js` (POST handler)

**Event**: New work order created
**Template**: `wo_created`
**Variables**: `name`, `queue_number`

**Where to insert**: After the `supabaseAdmin.from('work_orders').insert(...)` succeeds and `data` is confirmed.

**Customer lookup**: Insert response gives `customer_id`. Do a secondary query:
```js
const { data: customer } = await supabaseAdmin
  .from('customers')
  .select('name, phone')
  .eq('id', data.customer_id)
  .single();
```

**queue_number**: First 8 chars of the new WO UUID uppercased — human-readable short reference:
```js
queue_number: data.id.slice(0, 8).toUpperCase()
```

**Full hook block** (insert after the existing `if (error) return errorResponse(...)` check):
```js
// [FONNTE] Notify customer — Priority 1, non-blocking
try {
  const cfg = await getTokenConfig();
  const { data: customer } = await supabaseAdmin
    .from('customers').select('name, phone').eq('id', data.customer_id).single();
  if (cfg?.token && customer?.phone) {
    await sendWhatsApp({
      token: cfg.token,
      target: customer.phone,
      message: formatMessage(TEMPLATES.wo_created, {
        name: customer.name,
        queue_number: data.id.slice(0, 8).toUpperCase(),
      }),
      delay: '5-15',
      typingDuration: 3,
    });
  }
} catch (_err) {
  console.error('[Fonnte] wo_created send failed:', _err?.message);
}
```

---

## Task 3.2 — `api/work-orders/confirm.js`

**Event**: WO transitions `waiting` → `confirmed`
**Template**: `wo_confirmed`
**Variables**: `name`, `technician_name`

**Where to insert**: After `updatedWO` is returned from the PATCH update.

**Data fetch** (parallel for performance):
```js
const [custRes, empRes] = await Promise.all([
  supabaseAdmin.from('customers').select('name, phone').eq('id', updatedWO.customer_id).single(),
  employeeId
    ? supabaseAdmin.from('employees').select('name').eq('id', employeeId).single()
    : Promise.resolve({ data: null }),
]);
```

**Full hook block**:
```js
// [FONNTE] Notify customer — Priority 1, non-blocking
try {
  const cfg = await getTokenConfig();
  const [custRes, empRes] = await Promise.all([
    supabaseAdmin.from('customers').select('name, phone').eq('id', updatedWO.customer_id).single(),
    employeeId
      ? supabaseAdmin.from('employees').select('name').eq('id', employeeId).single()
      : Promise.resolve({ data: null }),
  ]);
  if (cfg?.token && custRes.data?.phone) {
    await sendWhatsApp({
      token: cfg.token,
      target: custRes.data.phone,
      message: formatMessage(TEMPLATES.wo_confirmed, {
        name: custRes.data.name,
        technician_name: empRes.data?.name ?? 'Tim Teknisi',
      }),
      delay: '5-15',
      typingDuration: 3,
    });
  }
} catch (_err) {
  console.error('[Fonnte] wo_confirmed send failed:', _err?.message);
}
```

---

## Task 3.3 — `api/work-orders/claim.js`

**Event**: Technician claims WO → status `open`
**Template**: `wo_open`
**Variables**: `name`, `technician_name`

**Where to insert**: After the atomic claim update succeeds (after the optimistic-lock update returns `claimedWO`).

**Data fetch**: `technicianId` is already in the request body. `customer_id` comes from the claimed WO result.
```js
const [custRes, techRes] = await Promise.all([
  supabaseAdmin.from('customers').select('name, phone').eq('id', claimedWO.customer_id).single(),
  supabaseAdmin.from('employees').select('name').eq('id', technicianId).single(),
]);
```

**Full hook block**:
```js
// [FONNTE] Notify customer — Priority 1, non-blocking
try {
  const cfg = await getTokenConfig();
  const [custRes, techRes] = await Promise.all([
    supabaseAdmin.from('customers').select('name, phone').eq('id', claimedWO.customer_id).single(),
    supabaseAdmin.from('employees').select('name').eq('id', technicianId).single(),
  ]);
  if (cfg?.token && custRes.data?.phone) {
    await sendWhatsApp({
      token: cfg.token,
      target: custRes.data.phone,
      message: formatMessage(TEMPLATES.wo_open, {
        name: custRes.data.name,
        technician_name: techRes.data?.name ?? 'Teknisi',
      }),
      delay: '5-15',
      typingDuration: 3,
    });
  }
} catch (_err) {
  console.error('[Fonnte] wo_open send failed:', _err?.message);
}
```

---

## Task 3.4 — `api/work-orders/close.js`

**Event**: WO closed
**Templates**: `wo_closed` THEN `welcome_installed` (two messages, sequential to preserve order)
**Variables for `wo_closed`**: `name`
**Variables for `welcome_installed`**: `name`, `package_name`

**Where to insert**: After WO close update succeeds.

**Customer data**: `close.js` already fetches `wo` with `customers(*)` — available as `wo.customers`.

**Package name**: Add `internet_packages(name)` to the existing select query in `close.js`:
```js
// Update the existing .select() in close.js:
.select('*, customers(*), master_queue_types(base_point), internet_packages(name)')
```

**Full hook block** (two sequential sends — do NOT use `Promise.all` for ordering guarantee):
```js
// [FONNTE] Notify customer — Priority 1, two messages, non-blocking
try {
  const cfg = await getTokenConfig();
  const customer = wo.customers;
  if (cfg?.token && customer?.phone) {
    // Message 1: Installation complete
    await sendWhatsApp({
      token: cfg.token,
      target: customer.phone,
      message: formatMessage(TEMPLATES.wo_closed, { name: customer.name }),
      delay: '3-8',
      typingDuration: 3,
    });
    // Message 2: Welcome (sequential to preserve message order)
    await sendWhatsApp({
      token: cfg.token,
      target: customer.phone,
      message: formatMessage(TEMPLATES.welcome_installed, {
        name: customer.name,
        package_name: wo.internet_packages?.name ?? 'Internet',
      }),
      delay: '10-20',
      typingDuration: 4,
    });
  }
} catch (_err) {
  console.error('[Fonnte] wo_closed/welcome send failed:', _err?.message);
}
```

---

## What NOT to Change

- Do not modify existing DB operation logic
- Do not change the final `return jsonResponse(...)` call
- Do not add new request validation
- Do not alter error response paths — WA hooks only run AFTER a successful DB result

---

## Verification Checklist

- [ ] Create WO via admin UI → customer phone receives `wo_created` WA within ~15 seconds
- [ ] Confirm WO → customer receives `wo_confirmed` WA with correct technician name (or "Tim Teknisi")
- [ ] Claim WO as TECH-role user → customer receives `wo_open` WA with technician name
- [ ] Close WO → customer receives `wo_closed` first, then `welcome_installed` (two messages in order)
- [ ] Set `FONNTE_TOKEN` to blank in admin settings → repeat any step → endpoint returns `200 OK`, no WA, no error
- [ ] Check Vercel function logs → WA send result logged to `console.error` on failure (never in response body)
- [ ] Simulate Fonnte API down (wrong token) → API endpoint still returns correct success response
