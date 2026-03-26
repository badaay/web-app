# Phase 7 — Admin UI Notifications Module

**Deliverables**:
- `src/admin/modules/notifications.js` ← new file
- `admin/index.html` ← add sidebar nav item + content container
- `src/admin/admin.js` ← add `initModule` case

**Dependency**: Phase 5 (queue.js and send.js must be deployed).
**Pattern**: Follow `src/admin/modules/settings.js` and `src/admin/modules/inventory.js`.

---

## Task 7.1 — `admin/index.html` Changes

### 7.1a — Sidebar Navigation Item

Add after the existing Settings `<li>` item inside the sidebar `<ul>`:

```html
<li class="nav-item">
  <a class="nav-link d-flex align-items-center gap-2" href="#" data-target="notifications-content">
    <i class="bi bi-whatsapp text-success"></i>
    <span>WhatsApp</span>
  </a>
</li>
```

### 7.1b — Content Container

Add inside the main tab content wrapper (after the `settings-content` div):

```html
<div id="notifications-content" class="d-none"></div>
```

---

## Task 7.2 — `src/admin/admin.js` Changes

In `initModule(targetId)`, add a new case alongside the existing imports:

```js
if (targetId === 'notifications-content') {
  const { initNotifications } = await import('./modules/notifications.js');
  initNotifications();
}
```

---

## Task 7.3 — `src/admin/modules/notifications.js`

**Single exported function**: `export async function initNotifications()`

Renders 5 independent sections into `#notifications-content`.

---

### Section A — Token Configuration Card

Loads current values from `GET /api/settings` on mount; saves with `PATCH /api/settings`.

**Fields**:

| Label                   | Setting key           | Input type | Attributes                        |
|-------------------------|-----------------------|------------|-----------------------------------|
| Token Fonnte            | FONNTE_TOKEN          | password   | Eye-toggle button to show/hide    |
| Batas Harian (pesan)    | FONNTE_DAILY_LIMIT    | number     | `min="1" max="9999"`              |
| Ambang Peringatan (0–1) | FONNTE_WARN_THRESHOLD | number     | `step="0.05" min="0.5" max="1.0"` |

**Save logic**: On form submit, PATCH each setting individually:
```js
await apiCall('/settings', {
  method: 'PATCH',
  body: JSON.stringify({ setting_key: 'FONNTE_TOKEN', setting_value: tokenInput.value }),
});
```

Show `showToast('Konfigurasi berhasil disimpan ✅', 'success')` on complete.

**HTML structure**:
```html
<div class="card bg-dark border-secondary mb-4">
  <div class="card-header d-flex align-items-center gap-2">
    <i class="bi bi-gear-fill text-primary"></i>
    <h6 class="mb-0">Konfigurasi Fonnte</h6>
  </div>
  <div class="card-body">
    <form id="fonnte-config-form">
      <div class="mb-3">
        <label class="form-label text-muted small">Token Fonnte</label>
        <div class="input-group">
          <input type="password" id="fonnte-token" class="form-control bg-dark text-light border-secondary">
          <button type="button" class="btn btn-outline-secondary" id="toggle-token">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </div>
      <!-- FONNTE_DAILY_LIMIT and FONNTE_WARN_THRESHOLD inputs -->
      <button type="submit" class="btn btn-primary">Simpan Konfigurasi</button>
    </form>
  </div>
</div>
```

---

### Section B — Warmth Gauge Card

Shows daily WA usage as a visual progress bar.

**Display**: `{sentToday} / {dailyLimit} pesan terkirim hari ini`

**Color logic**:
```js
const ratio = sentToday / dailyLimit;
const pct = Math.min(ratio * 100, 100).toFixed(0);
const color = ratio < 0.6 ? 'bg-success' : ratio < 0.9 ? 'bg-warning' : 'bg-danger';
```

**Bootstrap progress bar**:
```html
<div class="progress" style="height: 20px;">
  <div class="progress-bar ${color} progress-bar-striped" role="progressbar"
       style="width: ${pct}%" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
    ${pct}%
  </div>
</div>
```

**Reset Counter button**: PATCH `FONNTE_SENT_TODAY` → `'0'`. Show a Bootstrap confirmation modal before resetting.

**Auto-refresh**: `setInterval(loadWarmthGauge, 30000)`. Store ref in module scope; clear interval if module is re-initialised.

---

### Section C — Test Send Card

Direct-send form for testing the token and verifying WA delivery.

**Fields**:
- Phone input: `placeholder="628xxxxxxxxxx"`, `pattern="^62\d{8,13}$"`
- Message textarea: `maxlength="1000"`, `rows="4"`, `placeholder="Tulis pesan..."`
- Send button: "Kirim Pesan Test"

**Submit handler**:
```js
const res = await apiCall('/notifications/send', {
  method: 'POST',
  body: JSON.stringify({ target: targetInput.value, message: msgTextarea.value }),
});
// Success → showToast('Pesan berhasil dikirim! ✅', 'success')
// Error   → showToast('Gagal: ' + err.message, 'danger')
```

Show spinner on button during request; re-enable after response.

---

### Section D — Queue Monitor Table

Live queue status with tab filtering.

**Filter tabs** (Bootstrap `nav-pills`):
`Semua` | `Menunggu (pending)` | `Terkirim (sent)` | `Gagal (failed)`

Each tab click: reload table with `GET /api/notifications/queue?status=<value>&limit=20&offset=0`.

**Table columns**:

| Column      | Field        | Rendering                                          |
|-------------|--------------|-----------------------------------------------------|
| Nomor HP    | recipient    | Mask: `***` + last 4 digits                         |
| Jenis Pesan | message_type | Bootstrap badge, colour per type                    |
| Prioritas   | priority     | `1 = 🔴 Urgent`, `2 = 🟡 Normal`, `3 = ⚪ Nanti`  |
| Status      | status       | Coloured badge (`success`/`warning`/`danger`/`info`)|
| Waktu       | scheduled_at | `DD MMM YYYY HH:mm` format                          |
| Terkirim    | sent_at      | `—` if null                                         |
| Error       | error_msg    | Truncated to 40 chars; full text in `title` tooltip |

**Pagination**: `limit=20`; Prev / Next buttons; label: `Menampilkan X–Y dari Z`.

**Refresh button**: Manual reload icon (`bi-arrow-clockwise`) in table header.

```html
<table class="table table-dark table-hover align-middle table-sm">
  <thead class="table-dark">
    <tr>
      <th>Nomor HP</th>
      <th>Jenis Pesan</th>
      <th>Prioritas</th>
      <th>Status</th>
      <th>Dijadwalkan</th>
      <th>Terkirim</th>
      <th>Error</th>
    </tr>
  </thead>
  <tbody id="queue-tbody"></tbody>
</table>
```

---

### Section E — Error Log Accordion

Collapsed Bootstrap accordion at the bottom. Shows full `error_msg` for failed items.

```html
<div class="accordion" id="errorLogAccordion">
  <div class="accordion-item bg-dark border-secondary">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed bg-dark text-light border-0"
              type="button" data-bs-toggle="collapse" data-bs-target="#errorLogBody">
        <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
        Log Gagal Terkirim
        <span class="badge bg-danger ms-2" id="failed-count">0</span>
      </button>
    </h2>
    <div id="errorLogBody" class="accordion-collapse collapse">
      <div class="accordion-body p-0">
        <!-- Same table as Section D, pre-filtered to status=failed, full error_msg column -->
      </div>
    </div>
  </div>
</div>
```

On accordion expand, load `GET /api/notifications/queue?status=failed&limit=50`.

---

## Required Imports

```js
import { supabase, apiCall } from '../../api/supabase.js';
import { showToast } from '../utils/toast.js';
```

---

## UI/UX Requirements

- All cards: `card bg-dark border-secondary` style
- All loading states: disable button + add `spinner-border spinner-border-sm` inside button
- Phone masking: `r.slice(0, -4).replace(/./g, '*') + r.slice(-4)`
- Each section wrapped in individual `try/catch` — one failing section must not block others
- Use `showToast()` from `../utils/toast.js` for all feedback
- All date formatting: use `toLocaleString('id-ID', { ... })` for Indonesian locale

---

## Verification Checklist

- [ ] Click "WhatsApp" in sidebar → module loads, all 5 sections visible, no console errors
- [ ] Token config form pre-fills from DB on load
- [ ] Save token → PATCH fires, success toast shown
- [ ] Warmth gauge bar width and colour match usage ratio (green/yellow/red)
- [ ] Warmth gauge auto-refreshes every 30 seconds (visible in Network tab)
- [ ] Reset Counter → confirmation modal → resets to 0 → gauge updates to 0%
- [ ] Test send with valid number + message → WA received, success toast
- [ ] Test send with `"12345"` → toast error "Format nomor tidak valid"
- [ ] Queue table loads on "Semua" tab by default
- [ ] Tab switching correctly filters by status
- [ ] Pagination prev/next works
- [ ] Phone numbers in table are masked (last 4 digits visible)
- [ ] Failed accordion badge shows correct count
- [ ] Failed accordion expands and loads failed-only rows with full error_msg
