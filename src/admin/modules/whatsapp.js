/**
 * WhatsApp / Fonnte Notifications Module
 *
 * Sections:
 *  A — Token Configuration (Konfigurasi Integrasi Fonnte)
 *  B — Limitations Gauge (usage bar + rate-limit info)
 *  C — Kirim Pesan Langsung (trigger button → modal w/ template + customer picker)
 *  D — Queue Monitor (checkboxes, per-row confirm, bulk confirm, manual dispatch)
 *  E — Error Log Accordion
 */
import { supabase, apiCall } from '../../api/supabase.js';
import { showToast } from '../utils/toast.js';

let _gaugeInterval = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(isoStr) {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function maskPhone(phone) {
    if (!phone) return '—';
    const s = String(phone);
    return s.slice(0, -4).replace(/./g, '*') + s.slice(-4);
}

const MSG_TYPE_LABELS = {
    wo_created:        'WO Dibuat',
    wo_confirmed:      'WO Dikonfirmasi',
    wo_open:           'WO Dibuka',
    wo_closed:         'WO Selesai',
    welcome_installed: 'Selamat Terpasang',
    payment_due_soon:  'Tagihan Segera',
    payment_overdue:   'Tagihan Lewat Jatuh Tempo',
    direct_admin:      'Kirim Langsung',
};

const MSG_TYPE_COLORS = {
    wo_created: 'info', wo_confirmed: 'primary', wo_open: 'warning',
    wo_closed: 'success', welcome_installed: 'success',
    payment_due_soon: 'warning', payment_overdue: 'danger', direct_admin: 'secondary',
};

function msgTypeBadge(type) {
    const label = MSG_TYPE_LABELS[type] || type;
    const color = MSG_TYPE_COLORS[type] || 'secondary';
    return `<span class="badge bg-${color}" title="${label}">${label}</span>`;
}

function priorityLabel(p) {
    if (p === 1) return '<span class="text-danger fw-bold">🔴 Urgent</span>';
    if (p === 2) return '<span class="text-warning">🟡 Normal</span>';
    return '<span class="text-secondary">⚪ Nanti</span>';
}

const STATUS_COLORS = { pending: 'warning', processing: 'info', sent: 'success', failed: 'danger' };
function statusBadge(s) {
    return `<span class="badge bg-${STATUS_COLORS[s] || 'secondary'}">${s}</span>`;
}

function setBtn(el, loading, label) {
    el.disabled = loading;
    el.innerHTML = loading
        ? `<span class="spinner-border spinner-border-sm me-1"></span>${label}`
        : label;
}

// Template definitions (mirrors api/_lib/fonnte.js TEMPLATES)
const WA_TEMPLATES = {
    wo_created:        { label: 'WO Dibuat',                    preview: 'Tiket pemasangan internet berhasil dibuat. Nomor: *[queue_number]*' },
    wo_confirmed:      { label: 'WO Dikonfirmasi',              preview: 'Pesanan telah dikonfirmasi. Teknisi *[technician_name]* akan dijadwalkan.' },
    wo_open:           { label: 'WO Dibuka (Teknisi OTW)',      preview: 'Teknisi kami sedang dalam perjalanan ke lokasi Anda. 🔧' },
    wo_closed:         { label: 'WO Selesai',                   preview: 'Proses instalasi di lokasi Anda telah selesai. 🎉' },
    welcome_installed: { label: 'Selamat Terpasang',            preview: 'Layanan internet paket *[package_name]* Anda kini aktif! 🚀' },
    payment_due_soon:  { label: 'Tagihan Segera Jatuh Tempo',   preview: 'Tagihan Rp[amount] akan jatuh tempo pada [due_date].' },
    payment_overdue:   { label: 'Tagihan Melewati Jatuh Tempo', preview: 'Tagihan telah melewati jatuh tempo. Mohon segera lunasi.' },
    custom:            { label: 'Pesan Kustom (bebas)',         preview: '' },
};

// ─── Main init ─────────────────────────────────────────────────────────────────

export async function initWhatsApp() {
    if (_gaugeInterval) { clearInterval(_gaugeInterval); _gaugeInterval = null; }

    const root = document.getElementById('whatsapp-module-root');
    if (!root) return;

    root.innerHTML = `
    <div class="mb-2 d-flex align-items-center gap-2">
        <i class="bi bi-whatsapp text-success fs-4"></i>
        <h5 class="mb-0 text-white fw-bold">WhatsApp (Fonnte)</h5>
    </div>
    <hr class="border-secondary mb-4">
    <div id="wa-section-a"></div>
    <div id="wa-section-b"></div>
    <div id="wa-section-c"></div>
    <div id="wa-section-d"></div>
    <div id="wa-section-e"></div>`;

    await Promise.allSettled([
        initSectionA(),
        initSectionB(),
        initSectionC(),
        initSectionD(),
        initSectionE(),
    ]);
}

// ─── Section A: Token Configuration ───────────────────────────────────────────

async function initSectionA() {
    const el = document.getElementById('wa-section-a');
    try {
        const { data: settings } = await supabase
            .from('app_settings').select('setting_key, setting_value').eq('setting_group', 'whatsapp');
        const cfg = {};
        (settings || []).forEach(r => { cfg[r.setting_key] = r.setting_value; });

        el.innerHTML = `
        <div class="card bg-dark border-secondary mb-4">
            <div class="card-header d-flex align-items-center gap-2 border-secondary">
                <i class="bi bi-gear-fill text-primary"></i>
                <h6 class="mb-0 text-white">Konfigurasi Integrasi Fonnte</h6>
            </div>
            <div class="card-body">
                <form id="fonnte-config-form">
                    <div class="mb-3">
                        <label class="form-label text-white-50 small">Token Fonnte</label>
                        <div class="input-group">
                            <input type="password" id="fonnte-token" class="form-control bg-dark text-light border-secondary"
                                value="${cfg.FONNTE_TOKEN || ''}" placeholder="Masukkan token Fonnte…">
                            <button type="button" class="btn btn-outline-secondary" id="toggle-token-btn">
                                <i class="bi bi-eye" id="toggle-token-icon"></i>
                            </button>
                        </div>
                        <div class="form-text text-white-50">Token API dari dashboard <a href="https://md.fonnte.com" target="_blank" class="text-info">Fonnte</a>. Jaga kerahasiaan token ini.</div>
                    </div>
                    <button type="submit" class="btn btn-primary" id="save-fonnte-config-btn">
                        <i class="bi bi-floppy me-1"></i> Simpan Token
                    </button>
                </form>
                <hr class="border-secondary mt-4 mb-3">
                <div class="d-flex align-items-start gap-2">
                    <i class="bi bi-shield-lock text-warning mt-1 small"></i>
                    <small class="text-white-50">Pengaturan batas harian & ambang peringatan dikelola di <strong class="text-white">App Settings → Konfigurasi</strong> (akses Super Admin).</small>
                </div>
            </div>
        </div>`;

        document.getElementById('toggle-token-btn').addEventListener('click', () => {
            const inp = document.getElementById('fonnte-token');
            const icon = document.getElementById('toggle-token-icon');
            inp.type = inp.type === 'password' ? 'text' : 'password';
            icon.className = inp.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
        });

        document.getElementById('fonnte-config-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('save-fonnte-config-btn');
            setBtn(btn, true, 'Menyimpan…');
            try {
                await apiCall('/settings', { method: 'PATCH', body: JSON.stringify({ setting_key: 'FONNTE_TOKEN', setting_value: document.getElementById('fonnte-token').value.trim() }) });
                showToast('success', 'Token Fonnte berhasil disimpan ✅');
            } catch (err) {
                showToast('error', 'Gagal menyimpan: ' + err.message);
            } finally {
                setBtn(btn, false, '<i class="bi bi-floppy me-1"></i> Simpan Token');
            }
        });
    } catch (err) {
        el.innerHTML = `<div class="alert alert-danger mb-4">Gagal memuat konfigurasi: ${err.message}</div>`;
    }
}

// ─── Section B: Gauge ─────────────────────────────────────────────────────────

async function loadGauge() {
    const gaugeEl = document.getElementById('wa-gauge-bar-wrap');
    const labelEl = document.getElementById('wa-gauge-label');
    if (!gaugeEl) return;
    try {
        const { data: settings } = await supabase
            .from('app_settings').select('setting_key, setting_value').eq('setting_group', 'whatsapp');
        const cfg = {};
        (settings || []).forEach(r => { cfg[r.setting_key] = r.setting_value; });

        const sentToday = parseInt(cfg.FONNTE_SENT_TODAY) || 0;
        const dailyLimit = parseInt(cfg.FONNTE_DAILY_LIMIT) || 500;
        const ratio = sentToday / dailyLimit;
        const pct = Math.min(ratio * 100, 100).toFixed(1);
        const color = ratio < 0.6 ? 'bg-success' : ratio < 0.9 ? 'bg-warning' : 'bg-danger';
        const badge = ratio >= 0.95 ? '<span class="badge bg-danger ms-2">KRITIS</span>'
            : ratio >= 0.8 ? '<span class="badge bg-warning text-dark ms-2">PERINGATAN</span>' : '';

        gaugeEl.innerHTML = `
            <div class="progress mb-2" style="height:26px;">
                <div class="progress-bar ${color} progress-bar-striped progress-bar-animated"
                    role="progressbar" style="width:${pct}%" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                    <span class="fw-bold">${pct}%</span>
                </div>
            </div>`;
        if (labelEl) labelEl.innerHTML = `<strong class="text-white">${sentToday.toLocaleString('id-ID')}</strong> / ${dailyLimit.toLocaleString('id-ID')} pesan terkirim hari ini ${badge}`;
    } catch (_) {}
}

async function initSectionB() {
    const el = document.getElementById('wa-section-b');
    try {
        el.innerHTML = `
        <div class="card bg-dark border-secondary mb-4">
            <div class="card-header d-flex align-items-center justify-content-between border-secondary">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-speedometer2 text-info"></i>
                    <h6 class="mb-0 text-white">Penggunaan & Limitasi Harian</h6>
                </div>
                <button class="btn btn-sm btn-outline-secondary" id="wa-refresh-gauge-btn" title="Refresh">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>
            <div class="card-body">
                <div id="wa-gauge-bar-wrap"><div class="text-center py-2 text-white-50 small">Memuat…</div></div>
                <p class="text-white-50 small mb-3" id="wa-gauge-label">—</p>
                <div class="d-flex align-items-center gap-3 mb-4">
                    <button class="btn btn-sm btn-outline-danger" id="wa-reset-counter-btn"
                        data-bs-toggle="modal" data-bs-target="#wa-reset-modal">
                        <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Counter
                    </button>
                    <small class="text-white-50">Auto-refresh tiap 30 detik</small>
                </div>
                <div class="rounded border border-secondary p-3" style="background:rgba(255,255,255,.03)">
                    <p class="text-white fw-semibold mb-2 small">
                        <i class="bi bi-info-circle-fill text-info me-2"></i>Informasi Batas Kecepatan Fonnte
                    </p>
                    <ul class="list-unstyled mb-0 small text-white-50">
                        <li class="mb-1"><i class="bi bi-dot text-warning"></i>
                            <strong class="text-white">~20 pesan/jam</strong> — batas aman pengiriman via nomor WhatsApp personal (Fonnte). Melebihi angka ini meningkatkan risiko nomor diblokir.
                        </li>
                        <li class="mb-1"><i class="bi bi-dot text-warning"></i>
                            <strong class="text-white">Delay antar pesan: 30–120 detik</strong> (acak) + simulasi "mengetik" agar terlihat natural.
                        </li>
                        <li class="mb-1"><i class="bi bi-dot text-warning"></i>
                            <strong class="text-white">Batch per dispatch: 10 pesan</strong> — setiap klik "Kirim Sekarang" memproses maks 10 item antrian.
                        </li>
                        <li class="mb-1"><i class="bi bi-dot text-secondary"></i>
                            <strong class="text-white">Night window:</strong> Pesan prioritas 3 (bulk) ditahan otomatis pukul 21:00–06:59 WIB.
                        </li>
                        <li><i class="bi bi-dot text-secondary"></i>
                            <strong class="text-white">Hard stop:</strong> Dispatcher berhenti jika penggunaan harian ≥95% dari batas konfigurasi.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <!-- Reset Confirmation Modal -->
        <div class="modal fade" id="wa-reset-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content bg-dark border-secondary text-white">
                    <div class="modal-header border-secondary">
                        <h6 class="modal-title"><i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>Konfirmasi Reset</h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body small text-white-50">
                        Counter <code>FONNTE_SENT_TODAY</code> akan direset ke 0. Ini tidak membatalkan pesan yang sudah terkirim.
                    </div>
                    <div class="modal-footer border-secondary">
                        <button class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button class="btn btn-sm btn-danger" id="wa-confirm-reset-btn">Reset Sekarang</button>
                    </div>
                </div>
            </div>
        </div>`;

        await loadGauge();
        document.getElementById('wa-refresh-gauge-btn').addEventListener('click', loadGauge);
        _gaugeInterval = setInterval(loadGauge, 30000);

        document.getElementById('wa-confirm-reset-btn').addEventListener('click', async () => {
            const btn = document.getElementById('wa-confirm-reset-btn');
            setBtn(btn, true, 'Mereset…');
            try {
                await apiCall('/settings', { method: 'PATCH', body: JSON.stringify({ setting_key: 'FONNTE_SENT_TODAY', setting_value: '0' }) });
                bootstrap.Modal.getInstance(document.getElementById('wa-reset-modal'))?.hide();
                showToast('success', 'Counter berhasil direset ke 0.');
                await loadGauge();
            } catch (err) {
                showToast('error', 'Gagal reset: ' + err.message);
            } finally {
                setBtn(btn, false, 'Reset Sekarang');
            }
        });
    } catch (err) {
        el.innerHTML = `<div class="alert alert-danger mb-4">Gagal memuat gauge: ${err.message}</div>`;
    }
}

// ─── Section C: Kirim Pesan Langsung (button → modal) ─────────────────────────

async function initSectionC() {
    const el = document.getElementById('wa-section-c');
    try {
        let customers = [];
        try {
            const { data } = await supabase.from('customers')
                .select('id, name, phone').not('phone', 'is', null).order('name').limit(200);
            customers = data || [];
        } catch (_) {}

        const customerOptions = customers.map(c =>
            `<option value="${c.phone}">${c.name} — ${c.phone}</option>`).join('');

        const templateOptions = Object.entries(WA_TEMPLATES).map(([k, t]) =>
            `<option value="${k}">${t.label}</option>`).join('');

        el.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div class="d-flex align-items-center gap-2">
                <i class="bi bi-send-fill text-success"></i>
                <span class="text-white fw-semibold">Kirim Pesan Langsung</span>
            </div>
            <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#wa-send-modal">
                <i class="bi bi-whatsapp me-1"></i> Buka Form Kirim
            </button>
        </div>

        <!-- Send Modal -->
        <div class="modal fade" id="wa-send-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content bg-dark border-secondary text-white">
                    <div class="modal-header border-secondary">
                        <h6 class="modal-title d-flex align-items-center gap-2">
                            <i class="bi bi-whatsapp text-success"></i> Kirim Pesan WhatsApp Langsung
                        </h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label text-white-50 small">Template Pesan</label>
                            <select id="wa-template-select" class="form-select bg-dark text-light border-secondary">
                                ${templateOptions}
                            </select>
                            <div id="wa-template-preview" class="form-text text-info mt-1 fst-italic"></div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-white-50 small">Nomor Tujuan</label>
                            ${customers.length > 0
                                ? `<select id="wa-customer-select" class="form-select bg-dark text-light border-secondary mb-2">
                                        <option value="">— Pilih dari Pelanggan (opsional) —</option>${customerOptions}
                                    </select>`
                                : ''
                            }
                            <input type="tel" id="wa-phone-input" class="form-control bg-dark text-light border-secondary"
                                placeholder="62 atau 08xxxxxxxxxx (auto-konversi 0 → 62)">
                            <div class="form-text text-white-50">Format: 62 diikuti 8–13 digit (contoh: 6281234567890). Nomor dimulai 0 akan otomatis diubah menjadi 62.</div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label text-white-50 small d-flex justify-content-between">
                                <span>Isi Pesan</span>
                                <span id="wa-msg-count" class="text-white-50">0/1000</span>
                            </label>
                            <textarea id="wa-test-message" class="form-control bg-dark text-light border-secondary"
                                rows="5" maxlength="1000" placeholder="Tulis pesan atau pilih template di atas…" required></textarea>
                            <div class="form-text text-white-50">Gunakan <code>*teks*</code> untuk tebal, <code>_teks_</code> untuk miring.</div>
                        </div>
                    </div>
                    <div class="modal-footer border-secondary">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button class="btn btn-success" id="wa-test-send-btn">
                            <i class="bi bi-send-fill me-1"></i> Kirim Pesan
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        // Template select → preview + prefill textarea
        const templateSelect = document.getElementById('wa-template-select');
        const previewEl = document.getElementById('wa-template-preview');
        const textareaEl = document.getElementById('wa-test-message');

        function onTemplateChange() {
            const tpl = WA_TEMPLATES[templateSelect.value];
            if (!tpl) return;
            previewEl.textContent = tpl.preview ? 'Preview: ' + tpl.preview : '';
            if (templateSelect.value !== 'custom') textareaEl.value = tpl.preview || '';
            document.getElementById('wa-msg-count').textContent = `${textareaEl.value.length}/1000`;
        }
        templateSelect.addEventListener('change', onTemplateChange);
        onTemplateChange();

        // Customer select → auto-fill phone input
        const customerSelect = document.getElementById('wa-customer-select');
        const phoneInput = document.getElementById('wa-phone-input');
        
        if (customerSelect) {
            customerSelect.addEventListener('change', () => {
                if (customerSelect.value) {
                    phoneInput.value = customerSelect.value;
                    customerSelect.value = ''; // reset dropdown
                }
            });
        }
        
        // Phone input auto-convert: 0 → 62
        function autoConvertPhone() {
            if (phoneInput.value.startsWith('0')) {
                phoneInput.value = '62' + phoneInput.value.slice(1);
            }
        }
        phoneInput.addEventListener('blur', autoConvertPhone);

        // Char counter
        textareaEl.addEventListener('input', function () {
            document.getElementById('wa-msg-count').textContent = `${this.value.length}/1000`;
        });

        // Send
        document.getElementById('wa-test-send-btn').addEventListener('click', async () => {
            const btn = document.getElementById('wa-test-send-btn');
            const message = textareaEl.value.trim();
            let phone = phoneInput.value.trim();
            
            // Auto-convert before sending if needed
            if (phone.startsWith('0')) {
                phone = '62' + phone.slice(1);
            }

            if (!phone) { showToast('warning', 'Masukkan nomor tujuan.'); return; }
            if (!/^62\d{8,13}$/.test(phone)) { showToast('warning', 'Format nomor tidak valid. Gunakan: 62xxxxxxxxxx'); return; }
            if (!message) { showToast('warning', 'Pesan tidak boleh kosong.'); return; }

            setBtn(btn, true, 'Mengirim…');
            try {
                const res = await apiCall('/notifications/send', { method: 'POST', body: JSON.stringify({ target: phone, message }) });
                bootstrap.Modal.getInstance(document.getElementById('wa-send-modal'))?.hide();
                showToast('success', res.message || 'Pesan berhasil dikirim! ✅');
                textareaEl.value = '';
                phoneInput.value = '';
                document.getElementById('wa-msg-count').textContent = '0/1000';
                await loadGauge();
            } catch (err) {
                showToast('error', 'Gagal: ' + err.message);
            } finally {
                setBtn(btn, false, '<i class="bi bi-send-fill me-1"></i> Kirim Pesan');
            }
        });
    } catch (err) {
        el.innerHTML = `<div class="alert alert-danger mb-4">Gagal memuat form kirim: ${err.message}</div>`;
    }
}

// ─── Section D: Queue Monitor ──────────────────────────────────────────────────

let _queueStatus = 'all';
let _queueOffset = 0;
const _queueLimit = 20;
let _queueRows = []; // current page rows, used for checkbox operations

async function loadQueueTable() {
    const tbody = document.getElementById('wa-queue-tbody');
    const paginationEl = document.getElementById('wa-queue-pagination');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-white-50 py-3">
        <div class="spinner-border spinner-border-sm me-2"></div>Memuat…</td></tr>`;

    try {
        const params = new URLSearchParams({ status: _queueStatus, limit: _queueLimit, offset: _queueOffset });
        const res = await apiCall(`/notifications/queue?${params}`);
        _queueRows = res.data || [];
        const total = res.count || 0;

        updateBulkBtn();

        if (_queueRows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-white-50 py-4">
                <i class="bi bi-inbox fs-4 d-block mb-2"></i>Tidak ada data.</td></tr>`;
        } else {
            tbody.innerHTML = _queueRows.map(r => `
            <tr data-id="${r.id}">
                <td class="text-center">
                    <input type="checkbox" class="form-check-input wa-row-check" value="${r.id}">
                </td>
                <td class="font-monospace small">${maskPhone(r.recipient)}</td>
                <td>${msgTypeBadge(r.message_type)}</td>
                <td>${priorityLabel(r.priority)}</td>
                <td>${statusBadge(r.status)}</td>
                <td class="small text-white-50">${fmt(r.scheduled_at)}</td>
                <td class="small text-white-50">${fmt(r.sent_at)}</td>
                <td class="small text-danger" title="${r.error_msg || ''}">${r.error_msg ? r.error_msg.slice(0, 35) + (r.error_msg.length > 35 ? '…' : '') : '—'}</td>
            </tr>`).join('');

            // Checkbox change → update bulk btn
            tbody.querySelectorAll('.wa-row-check').forEach(cb => {
                cb.addEventListener('change', updateBulkBtn);
            });
        }

        // Pagination
        const start = total === 0 ? 0 : _queueOffset + 1;
        const end = Math.min(_queueOffset + _queueLimit, total);
        if (paginationEl) {
            paginationEl.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <small class="text-white-50">Menampilkan ${start}–${end} dari ${total}</small>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary ${_queueOffset === 0 ? 'disabled' : ''}" id="wa-q-prev">‹</button>
                    <button class="btn btn-outline-secondary ${end >= total ? 'disabled' : ''}" id="wa-q-next">›</button>
                </div>
            </div>`;
            document.getElementById('wa-q-prev')?.addEventListener('click', () => { _queueOffset = Math.max(0, _queueOffset - _queueLimit); loadQueueTable(); });
            document.getElementById('wa-q-next')?.addEventListener('click', () => { if (end < total) { _queueOffset += _queueLimit; loadQueueTable(); } });
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">Gagal memuat: ${err.message}</td></tr>`;
    }
}

function getCheckedIds() {
    return [...document.querySelectorAll('.wa-row-check:checked')].map(c => c.value);
}

function updateBulkBtn() {
    const btn = document.getElementById('wa-kirim-terpilih-btn');
    if (!btn) return;
    const n = getCheckedIds().length;
    btn.disabled = n === 0;
    btn.innerHTML = n > 0
        ? `<i class="bi bi-send-check-fill me-1"></i> Kirim Terpilih (${n})`
        : `<i class="bi bi-send-check me-1"></i> Kirim Terpilih`;
}

// Show dispatch confirmation modal, then call dispatch with optional ids
function showDispatchConfirm({ title, items, ids }) {
    const modal = document.getElementById('wa-dispatch-confirm-modal');
    const titleEl = document.getElementById('wa-dispatch-confirm-title');
    const listEl = document.getElementById('wa-dispatch-confirm-list');
    const confirmBtn = document.getElementById('wa-dispatch-confirm-btn');
    if (!modal || !confirmBtn) return;

    titleEl.textContent = title;
    if (items && items.length > 0) {
        listEl.innerHTML = `
        <div class="table-responsive" style="max-height:240px;overflow-y:auto;">
            <table class="table table-dark table-sm align-middle mb-0">
                <thead class="table-secondary text-dark">
                    <tr><th>Nomor HP</th><th>Jenis Pesan</th><th>Prioritas</th><th>Status</th></tr>
                </thead>
                <tbody>
                    ${items.map(r => `
                    <tr>
                        <td class="font-monospace small">${maskPhone(r.recipient)}</td>
                        <td>${msgTypeBadge(r.message_type)}</td>
                        <td>${priorityLabel(r.priority)}</td>
                        <td>${statusBadge(r.status)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    } else {
        listEl.innerHTML = `<p class="text-white-50 small mb-0"><i class="bi bi-info-circle me-1"></i>Semua item pending dalam antrian akan diproses (maks 10 per batch).</p>`;
    }

    // Remove old listener and attach new one
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', async () => {
        setBtn(newBtn, true, 'Memproses…');
        try {
            const body = ids && ids.length > 0 ? { ids } : {};
            const res = await apiCall('/notifications/dispatch', { method: 'POST', body: JSON.stringify(body) });
            bootstrap.Modal.getInstance(modal)?.hide();
            if (res.skipped) {
                showToast('warning', `Dilewati: ${res.reason}`);
            } else if (res.paused) {
                showToast('warning', `⚠️ ${res.reason}`);
            } else {
                showToast(res.failed > 0 ? 'warning' : 'success',
                    `✅ Terkirim: ${res.dispatched} | ❌ Gagal: ${res.failed} | Sisa: ${res.daily_remaining}`);
            }
            await Promise.all([loadQueueTable(), loadGauge()]);
        } catch (err) {
            showToast('error', 'Dispatch gagal: ' + err.message);
        } finally {
            setBtn(newBtn, false, '<i class="bi bi-lightning-charge-fill me-1"></i> Ya, Kirim Sekarang');
        }
    });

    bootstrap.Modal.getOrCreateInstance(modal).show();
}

async function initSectionD() {
    const el = document.getElementById('wa-section-d');
    try {
        el.innerHTML = `
        <div class="card bg-dark border-secondary mb-4">
            <div class="card-header border-secondary">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-list-check text-warning"></i>
                        <h6 class="mb-0 text-white">Monitor Antrian Notifikasi</h6>
                    </div>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <button class="btn btn-sm btn-outline-secondary" id="wa-q-refresh-btn" title="Refresh tabel">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary disabled" id="wa-kirim-terpilih-btn" disabled>
                            <i class="bi bi-send-check me-1"></i> Kirim Terpilih
                        </button>
                        <button class="btn btn-sm btn-success" id="wa-dispatch-btn">
                            <i class="bi bi-lightning-charge-fill me-1"></i> Kirim Sekarang
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body pb-2">
                <!-- Filter Tabs -->
                <ul class="nav nav-pills mb-3 gap-1" id="wa-queue-filter-tabs">
                    <li class="nav-item"><button class="nav-link active py-1 px-3 small" data-status="all">Semua</button></li>
                    <li class="nav-item"><button class="nav-link py-1 px-3 small" data-status="pending"><span class="badge bg-warning text-dark me-1">⏳</span>Menunggu</button></li>
                    <li class="nav-item"><button class="nav-link py-1 px-3 small" data-status="sent"><span class="badge bg-success me-1">✓</span>Terkirim</button></li>
                    <li class="nav-item"><button class="nav-link py-1 px-3 small" data-status="failed"><span class="badge bg-danger me-1">✗</span>Gagal</button></li>
                </ul>
                <div class="table-responsive">
                    <table class="table table-dark table-hover align-middle table-sm mb-2">
                        <thead class="table-secondary text-dark">
                            <tr>
                                <th class="text-center" style="width:36px;">
                                    <input type="checkbox" class="form-check-input" id="wa-check-all" title="Pilih semua">
                                </th>
                                <th>Nomor HP</th>
                                <th>Jenis Pesan</th>
                                <th>Prioritas</th>
                                <th>Status</th>
                                <th>Dijadwalkan</th>
                                <th>Terkirim</th>
                                <th>Error</th>
                            </tr>
                        </thead>
                        <tbody id="wa-queue-tbody">
                            <tr><td colspan="8" class="text-center text-white-50 py-3">Memuat…</td></tr>
                        </tbody>
                    </table>
                </div>
                <div id="wa-queue-pagination" class="mt-2"></div>
            </div>
        </div>

        <!-- Dispatch Confirmation Modal -->
        <div class="modal fade" id="wa-dispatch-confirm-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content bg-dark border-secondary text-white">
                    <div class="modal-header border-secondary">
                        <h6 class="modal-title d-flex align-items-center gap-2">
                            <i class="bi bi-lightning-charge-fill text-warning"></i>
                            <span id="wa-dispatch-confirm-title">Konfirmasi Pengiriman</span>
                        </h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="wa-dispatch-confirm-list">
                        <p class="text-white-50 small mb-0">Memuat informasi…</p>
                    </div>
                    <div class="modal-footer border-secondary">
                        <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Batal</button>
                        <button class="btn btn-success btn-sm" id="wa-dispatch-confirm-btn">
                            <i class="bi bi-lightning-charge-fill me-1"></i> Ya, Kirim Sekarang
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        // Filter tabs
        document.getElementById('wa-queue-filter-tabs').addEventListener('click', e => {
            const btn = e.target.closest('[data-status]');
            if (!btn) return;
            document.querySelectorAll('#wa-queue-filter-tabs .nav-link').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _queueStatus = btn.dataset.status;
            _queueOffset = 0;
            loadQueueTable();
        });

        // Refresh
        document.getElementById('wa-q-refresh-btn').addEventListener('click', loadQueueTable);

        // Select All
        document.getElementById('wa-check-all').addEventListener('change', function () {
            document.querySelectorAll('.wa-row-check').forEach(cb => { cb.checked = this.checked; });
            updateBulkBtn();
        });

        // Kirim Terpilih → confirm modal with selected rows
        document.getElementById('wa-kirim-terpilih-btn').addEventListener('click', () => {
            const ids = getCheckedIds();
            if (!ids.length) return;
            const items = _queueRows.filter(r => ids.includes(r.id));
            showDispatchConfirm({ title: `Kirim ${ids.length} Pesan Terpilih`, items, ids });
        });

        // Kirim Sekarang → confirm modal (all pending)
        document.getElementById('wa-dispatch-btn').addEventListener('click', () => {
            showDispatchConfirm({ title: 'Dispatch Antrian Pending', items: null, ids: null });
        });

        await loadQueueTable();
    } catch (err) {
        el.innerHTML = `<div class="alert alert-danger mb-4">Gagal memuat queue monitor: ${err.message}</div>`;
    }
}

// ─── Section E: Error Log Accordion ───────────────────────────────────────────

async function initSectionE() {
    const el = document.getElementById('wa-section-e');
    try {
        const res = await apiCall('/notifications/queue?status=failed&limit=1');
        const failedTotal = res.count || 0;

        el.innerHTML = `
        <div class="accordion mb-4" id="wa-error-accordion">
            <div class="accordion-item bg-dark border-secondary">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed bg-dark text-light border-0"
                        type="button" data-bs-toggle="collapse" data-bs-target="#wa-error-body">
                        <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                        Log Gagal Terkirim
                        <span class="badge bg-danger ms-2" id="wa-failed-badge">${failedTotal}</span>
                    </button>
                </h2>
                <div id="wa-error-body" class="accordion-collapse collapse">
                    <div class="accordion-body p-0" id="wa-error-log-content">
                        <div class="text-center py-3 text-white-50 small">Klik untuk memuat log…</div>
                    </div>
                </div>
            </div>
        </div>`;

        let errorLoaded = false;
        document.getElementById('wa-error-body').addEventListener('show.bs.collapse', async () => {
            if (errorLoaded) return;
            errorLoaded = true;
            const content = document.getElementById('wa-error-log-content');
            content.innerHTML = `<div class="text-center py-3 text-white-50"><div class="spinner-border spinner-border-sm me-2"></div>Memuat…</div>`;
            try {
                const res = await apiCall('/notifications/queue?status=failed&limit=50');
                const rows = res.data || [];
                document.getElementById('wa-failed-badge').textContent = res.count || 0;
                if (!rows.length) {
                    content.innerHTML = '<div class="text-center py-4 text-success"><i class="bi bi-check-circle-fill me-2"></i>Tidak ada pesan gagal. 👍</div>';
                    return;
                }
                content.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-dark table-sm align-middle mb-0">
                        <thead class="table-secondary text-dark">
                            <tr><th>Nomor HP</th><th>Jenis Pesan</th><th>Prioritas</th><th>Dijadwalkan</th><th>Error</th></tr>
                        </thead>
                        <tbody>
                            ${rows.map(r => `
                            <tr>
                                <td class="font-monospace small">${maskPhone(r.recipient)}</td>
                                <td>${msgTypeBadge(r.message_type)}</td>
                                <td>${priorityLabel(r.priority)}</td>
                                <td class="small text-white-50">${fmt(r.scheduled_at)}</td>
                                <td class="small text-danger">${r.error_msg || '—'}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                ${res.count > 50 ? `<div class="px-3 py-2 text-white-50 small">Menampilkan 50 dari ${res.count}. Gunakan filter "Gagal" untuk selengkapnya.</div>` : ''}`;
            } catch (err) {
                content.innerHTML = `<div class="text-danger px-3 py-2 small">Gagal memuat: ${err.message}</div>`;
            }
        });
    } catch (err) {
        el.innerHTML = `<div class="alert alert-danger mb-4">Gagal memuat error log: ${err.message}</div>`;
    }
}
