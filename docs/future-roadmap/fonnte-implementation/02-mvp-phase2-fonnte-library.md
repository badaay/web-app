# MVP Phase 2 — Fonnte Shared Library

**Deliverable**: `api/_lib/fonnte.js`
**Dependency**: Phase 1 (`app_settings` rows must exist).
**Pattern**: Follows `api/_lib/supabase.js` — named exports only, no default export.
Imported by WO hooks (Phase 3) and the queue dispatcher (Phase 4).

---

## Tasks

### Task 2.1 — `getTokenConfig()`

Reads all 5 `FONNTE_*` settings from `app_settings` using `supabaseAdmin`.

**Returns**:
```js
{
  token: string,          // raw API token
  dailyLimit: number,     // e.g. 500
  warnThreshold: number,  // e.g. 0.80
  sentToday: number,      // e.g. 42
  lastReset: string       // ISO timestamp string
}
```

**Returns `null`** if `FONNTE_TOKEN` is blank or the query fails.
Callers must handle `null` gracefully — skip WA send silently, never throw.

Implementation notes:
- Single `SELECT * FROM app_settings WHERE setting_group = 'fonnte'` query
- Parse with `parseInt` / `parseFloat`; fail-safe on missing keys

---

### Task 2.2 — `sendWhatsApp({ token, target, message, delay, typingDuration })`

Sends one WhatsApp message via the Fonnte REST API.

**Endpoint**: `POST https://api.fonnte.com/send`

> ⚠️ **CRITICAL**: Fonnte requires `application/x-www-form-urlencoded` body, NOT JSON.

**Request headers**:
```
Authorization: <token>      ← bare token only — NOT "Bearer <token>"
Content-Type: application/x-www-form-urlencoded
```

**Request body params**:

| Param      | Example value    | Notes                                    |
|------------|------------------|------------------------------------------|
| `target`   | `628123456789`   | Phone number                             |
| `message`  | `Halo Budi...`   | Final formatted string                   |
| `delay`    | `'30-120'`       | Random delay range in seconds            |
| `typing`   | `'true'`         | Enables typing simulation animation      |
| `duration` | `'5'`            | Typing simulation duration (seconds)     |

Build body with: `new URLSearchParams({ target, message, delay, typing: 'true', duration: String(typingDuration) }).toString()`

**Returns**:
```js
{ success: boolean, raw: object }    // success
{ success: false, error: string }    // failure — NEVER throws
```

Log failures to `console.error` for Vercel function log visibility.

---

### Task 2.3 — `buildDedupHash(recipient, messageType, refId)`

Creates a deterministic fingerprint to prevent duplicate sends.

**Formula**: `btoa(recipient + ':' + messageType + ':' + (refId || ''))`

- `btoa()` is natively available in Edge runtime — no external library needed
- Same inputs always → same output (deterministic)
- Example: `buildDedupHash('6281234', 'wo_created', 'abc-123')` → identical on every call

---

### Task 2.4 — `enqueueNotification({ recipient, messageType, payload, priority, scheduledAt, refId })`

Inserts a message into `notification_queue` with deduplication protection.

**Defaults**:
- `priority` → `2`
- `scheduledAt` → `new Date().toISOString()`
- `payload` → `{}`

**Logic**:
1. `buildDedupHash(recipient, messageType, refId)` → `dedup_hash`
2. `INSERT INTO notification_queue (...) VALUES (...)`
3. Postgres `23505` unique violation → `return { queued: false, reason: 'duplicate' }` (silent)
4. Success → `return { queued: true, id: row.id }`
5. Other DB error → throw (unexpected — let caller handle)

---

### Task 2.5 — `formatMessage(templateKey, data)`

Two-pass string transform:

**Pass 1 — Variable substitution** (replace `${key}` with `data[key]`):
```js
msg.replace(/\${(\w+)}/g, (_, key) => data[key] ?? '')
```

**Pass 2 — Spintax resolver** (pick one random option from `{A|B|C}`):
```js
msg.replace(/\{([^{}]+)\}/g, (_, options) => {
  const choices = options.split('|');
  return choices[Math.floor(Math.random() * choices.length)];
});
```

Never throws — missing variables render as empty string.

---

### Task 2.6 — `TEMPLATES` Constant

All templates in Bahasa Indonesia. Spintax on greetings reduces spam classification risk.

| Key                 | Variables needed                       |
|---------------------|----------------------------------------|
| `wo_created`        | `name`, `queue_number`                 |
| `wo_confirmed`      | `name`, `technician_name`              |
| `wo_open`           | `name`, `technician_name`              |
| `wo_closed`         | `name`                                 |
| `welcome_installed` | `name`, `package_name`                 |
| `payment_due_soon`  | `name`, `due_date`, `amount`           |
| `payment_overdue`   | `name`, `due_date`, `amount`           |

**Template values**:
```js
export const TEMPLATES = {
  wo_created:
    '{Halo|Hai|Selamat datang} *${name}*! Pendaftaran pemasangan internet Anda berhasil. ' +
    'Nomor tiket: *${queue_number}*. Tim kami akan segera memproses dan menghubungi Anda. Terima kasih! 🙏',

  wo_confirmed:
    '{Halo|Kabar baik untuk} *${name}*! Pesanan pemasangan internet Anda telah *dikonfirmasi* oleh admin. ' +
    'Teknisi *${technician_name}* akan segera dijadwalkan ke lokasi Anda.',

  wo_open:
    '{Halo|Hai} *${name}*, teknisi kami *${technician_name}* sedang dalam perjalanan menuju lokasi Anda. 🔧 ' +
    'Mohon siapkan akses ke titik instalasi. Terima kasih atas kesabarannya!',

  wo_closed:
    'Proses instalasi di lokasi Anda telah *selesai*, *${name}*! ' +
    'Terima kasih telah mempercayakan pemasangan internet kepada kami. 🎉',

  welcome_installed:
    'Selamat, *${name}*! Layanan internet paket *${package_name}* Anda kini *aktif*. ' +
    'Semoga betah dan nikmati koneksinya! 🚀 Hubungi kami jika ada kendala.',

  payment_due_soon:
    '📅 Pengingat tagihan untuk *${name}*: tagihan internet Anda sebesar *Rp${amount}* ' +
    'akan jatuh tempo pada *${due_date}*. Mohon segera lakukan pembayaran.',

  payment_overdue:
    '⚠️ *${name}*, tagihan internet Anda sebesar *Rp${amount}* telah _melewati jatuh tempo_ *${due_date}*. ' +
    'Segera lakukan pembayaran atau hubungi kami untuk menghindari pemutusan layanan.',
};
```

---

## Complete File Skeleton

```js
// api/_lib/fonnte.js
import { supabaseAdmin } from './supabase.js';

const FONNTE_API_URL = 'https://api.fonnte.com/send';

export const TEMPLATES = { /* ...as above... */ };

/** Reads FONNTE_* config from app_settings. Returns null if token is blank. */
export async function getTokenConfig() { /* Task 2.1 */ }

/** Sends a single WhatsApp message via Fonnte. Never throws. */
export async function sendWhatsApp({ token, target, message, delay = '30-120', typingDuration = 5 }) { /* Task 2.2 */ }

/** Deterministic dedup fingerprint using btoa(). */
export function buildDedupHash(recipient, messageType, refId) { /* Task 2.3 */ }

/** Inserts message into notification_queue with dedup. Handles 23505 silently. */
export async function enqueueNotification({ recipient, messageType, payload = {}, priority = 2, scheduledAt, refId }) { /* Task 2.4 */ }

/** Variable substitution + Spintax resolver. */
export function formatMessage(templateKey, data) { /* Task 2.5 */ }
```

---

## Verification Checklist

- [ ] `getTokenConfig()` returns object with all 5 keys when settings are seeded
- [ ] `getTokenConfig()` returns `null` when `FONNTE_TOKEN` setting is blank
- [ ] `sendWhatsApp(...)` with valid token → WA message received on target phone within ~30 seconds
- [ ] `sendWhatsApp(...)` with invalid token → returns `{ success: false, error: '...' }`, does NOT throw
- [ ] `buildDedupHash('6281234', 'wo_created', 'abc-123')` called twice → identical output both times
- [ ] `enqueueNotification(...)` twice with same `recipient + messageType + refId` → second call returns `{ queued: false, reason: 'duplicate' }`
- [ ] `formatMessage('wo_created', { name: 'Budi', queue_number: 'A-001' })` → no `${...}` remains, Spintax resolved
- [ ] `formatMessage('wo_created', {})` → missing variables render as empty string, no crash
