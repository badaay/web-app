# Phase 5 — Notification API Endpoints

**Deliverables**: `api/notifications/queue.js` and `api/notifications/send.js`
**Dependency**: Phase 2 (`api/_lib/fonnte.js`), Phase 1 (`notification_queue` table).
**Pattern**: Same structure as `api/packages/index.js` — `withCors`, `verifyAuth`, `isAdmin`.

---

## Task 5.1 — `api/notifications/queue.js` (GET)

Paginated list of `notification_queue` items for the admin UI (Phase 7 Section D).

### Auth
Admin only — `verifyAuth` + `isAdmin`. Returns `403` if not admin.

### Method & Route
`GET /api/notifications/queue`

### Query Parameters

| Param          | Type   | Default | Description                                           |
|----------------|--------|---------|-------------------------------------------------------|
| `status`       | string | `all`   | `pending` \| `processing` \| `sent` \| `failed` \| `all` |
| `message_type` | string | —       | Optional filter by template key                       |
| `limit`        | int    | 50      | Max rows, capped at 100                               |
| `offset`       | int    | 0       | Pagination offset                                     |

### SELECT Columns

```
id, recipient, message_type, priority, status, scheduled_at, sent_at, error_msg, created_at
```

> ❌ Do NOT include `payload` — may contain customer PII (name, WO details).

### Query Build

```js
let query = supabaseAdmin
  .from('notification_queue')
  .select(
    'id, recipient, message_type, priority, status, scheduled_at, sent_at, error_msg, created_at',
    { count: 'exact' }
  )
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);

if (status && status !== 'all') query = query.eq('status', status);
if (message_type) query = query.eq('message_type', message_type);
```

### Response Shape

```json
{
  "data": [
    {
      "id": "uuid",
      "recipient": "628123456789",
      "message_type": "wo_created",
      "priority": 1,
      "status": "sent",
      "scheduled_at": "2026-03-24T08:00:00Z",
      "sent_at": "2026-03-24T08:00:05Z",
      "error_msg": null,
      "created_at": "2026-03-24T08:00:00Z"
    }
  ],
  "count": 142,
  "limit": 50,
  "offset": 0
}
```

### Cache
`Cache-Control: no-store` — live queue data must never be stale-cached.

---

## Task 5.2 — `api/notifications/send.js` (POST)

Direct send bypassing the queue. Used for testing token config and admin one-off sends.

### Auth
Admin only — `verifyAuth` + `isAdmin`.

### Method & Route
`POST /api/notifications/send`

### Request Body

```json
{
  "target": "628123456789",
  "message": "Test message content"
}
```

### Validation Rules

| Field     | Rule                                                              | Error            |
|-----------|-------------------------------------------------------------------|------------------|
| `target`  | Required. Must match `/^62\d{8,13}$/` (Indonesian mobile format) | 400              |
| `message` | Required. Min 1 char, max 1000 chars                             | 400              |

### Logic

```
1. Validate target and message — return 400 with Indonesian error if invalid

2. getTokenConfig()
   → token blank: return 400 {
       error: 'Token Fonnte belum dikonfigurasi. Silakan atur di halaman Settings.'
     }

3. sendWhatsApp({ token, target, message, delay: '0', typingDuration: 0 })
   delay='0' and typingDuration=0 → immediate delivery, no artificial wait

4. On success:
   → Atomic increment FONNTE_SENT_TODAY:
     UPDATE app_settings SET setting_value = (setting_value::int + 1)
     WHERE setting_key = 'FONNTE_SENT_TODAY'
   → return 200 { success: true, message: 'Pesan berhasil dikirim ke ' + target }

5. On failure:
   → return 500 { error: 'Gagal mengirim pesan', detail: result.error }
```

> This endpoint does NOT write to `notification_queue`. It is a direct bypass for testing.

### Response (Success)
```json
{
  "success": true,
  "message": "Pesan berhasil dikirim ke 628123456789"
}
```

### Response (Failure)
```json
{
  "error": "Gagal mengirim pesan",
  "detail": "<Fonnte API error detail>"
}
```

---

## Full File Skeletons

### `api/notifications/queue.js`

```js
/**
 * GET /api/notifications/queue
 * Paginated notification queue list. Admin only. No payload field returned.
 */
import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405);

  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);
  if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'all';
    const message_type = url.searchParams.get('message_type') || null;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    // ... build query, execute, return jsonResponse ...
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
```

### `api/notifications/send.js`

```js
/**
 * POST /api/notifications/send
 * Direct send (bypasses queue). For testing and urgent one-off admin sends.
 */
import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { getTokenConfig, sendWhatsApp } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);
  if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

  try {
    const { target, message } = await req.json();
    // ... validate, send, increment counter, return response ...
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
```

---

## Verification Checklist

- [ ] `GET /api/notifications/queue` without JWT → `401 Unauthorized`
- [ ] `GET /api/notifications/queue` with non-admin JWT → `403 Forbidden`
- [ ] `GET /api/notifications/queue` with admin JWT → returns `{ data, count, limit, offset }`, no `payload` field in any item
- [ ] `GET /api/notifications/queue?status=sent` → only `status='sent'` rows
- [ ] `GET /api/notifications/queue?limit=10&offset=10` → correct pagination slice
- [ ] `POST /api/notifications/send` with admin JWT + `target: "628123456789"` → WA received within 5 seconds
- [ ] `POST /api/notifications/send` with `target: "12345"` → `400` with validation error
- [ ] `POST /api/notifications/send` when `FONNTE_TOKEN` is blank → `400` with Indonesian error message
- [ ] `POST /api/notifications/send` without admin JWT → `403`
- [ ] After successful `/send` → `FONNTE_SENT_TODAY` in `app_settings` increments by 1
