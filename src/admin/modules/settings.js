import { supabase, apiCall } from '../../api/supabase.js';
import { showToast } from '../utils/toast.js';

// ── All known WA message types (for routing table) ────────────────────────────
// bg: badge background hex, text: badge text color
const MESSAGE_TYPES = [
    { key: 'wo_created',        bg: '#0ea5e9', text: '#fff',    label: 'WO Dibuat',             description: 'Saat Work Order baru dibuat oleh admin.' },
    { key: 'wo_confirmed',      bg: '#6366f1', text: '#fff',    label: 'WO Dikonfirmasi',        description: 'Saat admin mengkonfirmasi antrian PSB.' },
    { key: 'wo_open',           bg: '#f59e0b', text: '#1a1a1a', label: 'WO Dibuka — OTW',       description: 'Saat teknisi mengklaim dan membuka WO.' },
    { key: 'wo_closed',         bg: '#10b981', text: '#fff',    label: 'WO Selesai',             description: 'Saat teknisi menutup WO setelah instalasi.' },
    { key: 'welcome_installed', bg: '#059669', text: '#fff',    label: 'Selamat Terpasang',      description: 'Notifikasi welcome setelah layanan aktif.' },
    { key: 'payment_due_soon',  bg: '#f97316', text: '#fff',    label: 'Tagihan Jatuh Tempo',    description: 'Pengingat tagihan X hari sebelum jatuh tempo.' },
    { key: 'payment_overdue',   bg: '#ef4444', text: '#fff',    label: 'Tagihan Lewat Tempo',    description: 'Peringatan tagihan yang telah melewati jatuh tempo.' },
    { key: 'direct_admin',      bg: '#8b5cf6', text: '#fff',    label: 'Kirim Langsung',         description: 'Pesan langsung dari form admin panel.' },
];

// ── Accordion group metadata ──────────────────────────────────────────────────
const GROUP_META = {
    whatsapp: { icon: 'bi-whatsapp',          color: 'success',   label: 'WhatsApp / Fonnte' },
    general:  { icon: 'bi-gear-fill',         color: 'primary',   label: 'Umum' },
    payment:  { icon: 'bi-credit-card-fill',  color: 'info',      label: 'Pembayaran' },
    security: { icon: 'bi-shield-lock-fill',  color: 'warning',   label: 'Keamanan' },
    email:    { icon: 'bi-envelope-fill',     color: 'secondary', label: 'Email' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncate(str, max) {
    if (!str) return '—';
    return str.length > max ? str.slice(0, max) + '…' : str;
}

function isSensitiveKey(key) {
    return /TOKEN|SECRET|PASSWORD|KEY|PASS/i.test(key);
}

// ── Main init ─────────────────────────────────────────────────────────────────
export async function initSettings() {
    const root = document.getElementById('settings-content');

    async function loadSettings() {
        root.innerHTML = `<div class="text-center py-4 text-white-50">
            <div class="spinner-border spinner-border-sm me-2"></div>Memuat pengaturan…</div>`;

        const { data, error } = await supabase
            .from('app_settings').select('*').order('setting_key');

        if (error) {
            root.innerHTML = `<div class="alert alert-danger">Gagal memuat: ${error.message}</div>`;
            return;
        }

        // Parse WHATSAPP_ROUTING once
        const routingSetting = (data || []).find(s => s.setting_key === 'WHATSAPP_ROUTING');
        let routing = {};
        try { routing = routingSetting ? JSON.parse(routingSetting.setting_value || '{}') : {}; } catch (_) {}

        // Group by setting_group
        const groups = {};
        (data || []).forEach(s => {
            const g = s.setting_group || 'general';
            if (!groups[g]) groups[g] = [];
            groups[g].push(s);
        });

        // Build accordion (whatsapp first, then sorted rest)
        const groupOrder = ['whatsapp', ...Object.keys(groups).filter(k => k !== 'whatsapp').sort()];

        const accordionHTML = groupOrder
            .filter(gk => groups[gk])
            .map((gk, idx) => renderGroup(gk, groups[gk], idx, routing))
            .join('');

        root.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h6 class="text-white mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-sliders text-primary"></i> Pengaturan Aplikasi
            </h6>
            <button class="btn btn-primary btn-sm" id="add-setting-btn">
                <i class="bi bi-plus-lg me-1"></i> Tambah Setting
            </button>
        </div>
        <div class="accordion" id="settingsAccordion">${accordionHTML}</div>`;

        // Bind edit buttons
        root.querySelectorAll('.edit-setting-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = data.find(s => s.id === btn.dataset.id);
                if (item) showEditModal(item, loadSettings);
            });
        });

        // Bind routing dropdowns (save on every change)
        root.querySelectorAll('.routing-device-select').forEach(sel => {
            sel.addEventListener('change', () => saveRouting(root, data, loadSettings));
        });

        document.getElementById('add-setting-btn')?.addEventListener('click', () => {
            showAddModal(loadSettings);
        });
    }

    // ── Render one accordion group ─────────────────────────────────────────────
    function renderGroup(gk, items, idx, routing) {
        const meta = GROUP_META[gk] || { icon: 'bi-sliders', color: 'secondary', label: gk };
        const collapseId = `acc-${gk.replace(/[^a-z0-9]/gi, '-')}`;
        const isOpen = idx === 0;

        const tableRows = items.map(s => `
            <tr>
                <td class="font-monospace small fw-semibold text-white" style="max-width:200px;word-break:break-all">${s.setting_key}</td>
                <td class="small" style="max-width:220px;word-break:break-all">
                    ${isSensitiveKey(s.setting_key)
                        ? `<code class="text-warning small">••••••••</code>`
                        : `<code class="small text-info">${truncate(s.setting_value, 45)}</code>`}
                </td>
                <td class="small text-white-50" style="max-width:200px">${s.description || '—'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary py-0 px-2 edit-setting-btn" data-id="${s.id}">Edit</button>
                </td>
            </tr>`).join('');

        const routingSection = gk === 'whatsapp' ? renderRoutingSection(routing) : '';

        return `
        <div class="accordion-item bg-dark border-secondary mb-2" style="border-radius:8px;overflow:hidden">
            <h2 class="accordion-header">
                <button class="accordion-button ${isOpen ? '' : 'collapsed'} text-white"
                    type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}"
                    style="background:rgba(255,255,255,.04);border:none">
                    <i class="bi ${meta.icon} text-${meta.color} me-2 fs-5"></i>
                    <span class="fw-semibold">${meta.label}</span>
                    <span class="badge bg-${meta.color} bg-opacity-25 text-${meta.color} ms-2 rounded-pill">${items.length} key</span>
                </button>
            </h2>
            <div id="${collapseId}" class="accordion-collapse collapse ${isOpen ? 'show' : ''}">
                <div class="accordion-body p-0">
                    <div class="table-responsive">
                        <table class="table table-dark table-hover align-middle mb-0 small">
                            <thead>
                                <tr class="border-secondary">
                                    <th>Key</th><th>Nilai</th><th>Deskripsi</th><th></th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                    ${routingSection}
                </div>
            </div>
        </div>`;
    }

    // ── WhatsApp routing sub-table ─────────────────────────────────────────────
    function renderRoutingSection(routing) {
        const rows = MESSAGE_TYPES.map(mt => {
            const label = routing[mt.key] || 'main';
            return `
            <tr>
                <td><span class="badge text-nowrap fw-semibold" style="background:${mt.bg};color:${mt.text};letter-spacing:.3px">${mt.label}</span></td>
                <td class="small text-white-50">${mt.description}</td>
                <td>
                    <select class="form-select form-select-sm bg-dark text-light border-secondary routing-device-select"
                        data-msg-type="${mt.key}" style="min-width:130px">
                        <option value="main" ${label === 'main' ? 'selected' : ''}>
                            📱 Main Device
                        </option>
                        <!-- Additional device options appear here when more devices are configured -->
                    </select>
                </td>
            </tr>`;
        }).join('');

        return `
        <div class="border-top border-secondary p-3" style="background:rgba(255,255,255,.02)">
            <div class="d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-diagram-3 text-info"></i>
                <span class="text-white small fw-semibold">Routing Notifikasi per Jenis Pesan</span>
                <span class="badge bg-secondary rounded-pill small">1 device aktif</span>
                <span class="text-white-50 small ms-auto fst-italic">Perubahan disimpan otomatis</span>
            </div>
            <div class="table-responsive">
                <table class="table table-dark table-sm align-middle mb-0">
                    <thead>
                        <tr class="border-secondary">
                            <th class="small">Jenis Pesan</th>
                            <th class="small">Keterangan</th>
                            <th class="small">Kirim Melalui</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
    }

    // ── Save routing on dropdown change ───────────────────────────────────────
    async function saveRouting(root, allData, reload) {
        const selects = root.querySelectorAll('.routing-device-select');
        const newRouting = {};
        selects.forEach(s => { newRouting[s.dataset.msgType] = s.value; });

        try {
            // UPSERT: PATCH if key exists, INSERT if not
            const existing = allData.find(s => s.setting_key === 'WHATSAPP_ROUTING');
            if (existing) {
                await apiCall('/settings', {
                    method: 'PATCH',
                    body: JSON.stringify({ setting_key: 'WHATSAPP_ROUTING', setting_value: JSON.stringify(newRouting) }),
                });
            } else {
                await supabase.from('app_settings').insert({
                    setting_key: 'WHATSAPP_ROUTING',
                    setting_value: JSON.stringify(newRouting),
                    setting_group: 'whatsapp',
                    description: 'Routing notifikasi per jenis pesan ke device WhatsApp',
                });
            }
            showToast('success', 'Routing notifikasi diperbarui ✅');
        } catch (err) {
            showToast('error', 'Gagal menyimpan routing: ' + err.message);
        }
    }

    // ── Edit existing setting modal ────────────────────────────────────────────
    function showEditModal(set, reload) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        document.getElementById('crudModalTitle').innerText = 'Edit Pengaturan';

        const isSensitive = isSensitiveKey(set.setting_key);
        document.getElementById('crudModalBody').innerHTML = `
            <div class="mb-3">
                <label class="form-label text-white-50 small">Setting Key</label>
                <input type="text" class="form-control bg-dark text-white border-secondary"
                    value="${set.setting_key}" disabled>
            </div>
            <div class="mb-3">
                <label class="form-label text-white-50 small">Nilai</label>
                ${set.setting_key === 'WHATSAPP_ROUTING'
                    ? `<textarea id="set-value" class="form-control bg-dark text-light border-secondary font-monospace small" rows="8">${set.setting_value || '{}'}</textarea>
                       <div class="form-text text-white-50">JSON: <code>{"wo_created":"main","payment_due_soon":"main"}</code></div>`
                    : `<input type="${isSensitive ? 'password' : 'text'}" id="set-value"
                           class="form-control bg-dark text-light border-secondary"
                           value="${set.setting_value || ''}" autocomplete="off">`
                }
            </div>
            <div class="mb-3">
                <label class="form-label text-white-50 small">Deskripsi</label>
                <textarea id="set-desc" class="form-control bg-dark text-light border-secondary" rows="2">${set.description || ''}</textarea>
            </div>`;

        document.getElementById('save-crud-btn').onclick = async () => {
            const value = document.getElementById('set-value').value;
            const description = document.getElementById('set-desc').value;
            try {
                await apiCall('/settings', {
                    method: 'PATCH',
                    body: JSON.stringify({ setting_key: set.setting_key, setting_value: value, description }),
                });
                modal.hide();
                reload();
                showToast('success', `${set.setting_key} berhasil disimpan ✅`);
            } catch (err) {
                showToast('error', 'Gagal: ' + err.message);
            }
        };

        modal.show();
    }

    // ── Add new setting modal ──────────────────────────────────────────────────
    function showAddModal(reload) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        document.getElementById('crudModalTitle').innerText = 'Tambah Pengaturan Baru';

        document.getElementById('crudModalBody').innerHTML = `
            <div class="mb-3">
                <label class="form-label text-white-50 small">Setting Key <span class="text-danger">*</span></label>
                <input type="text" id="new-key" class="form-control bg-dark text-light border-secondary"
                    placeholder="Contoh: APP_NAME" required>
                <div class="form-text text-white-50">Gunakan huruf kapital dan underscore.</div>
            </div>
            <div class="mb-3">
                <label class="form-label text-white-50 small">Nilai <span class="text-danger">*</span></label>
                <input type="text" id="new-value" class="form-control bg-dark text-light border-secondary" required>
            </div>
            <div class="mb-3">
                <label class="form-label text-white-50 small">Grup</label>
                <select id="new-group" class="form-select bg-dark text-light border-secondary">
                    <option value="general">Umum</option>
                    <option value="whatsapp">WhatsApp / Fonnte</option>
                    <option value="payment">Pembayaran</option>
                    <option value="security">Keamanan</option>
                    <option value="email">Email</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label text-white-50 small">Deskripsi</label>
                <textarea id="new-desc" class="form-control bg-dark text-light border-secondary" rows="2"></textarea>
            </div>`;

        document.getElementById('save-crud-btn').onclick = async () => {
            const key = document.getElementById('new-key').value.trim().toUpperCase();
            const value = document.getElementById('new-value').value;
            const group = document.getElementById('new-group').value;
            const description = document.getElementById('new-desc').value;

            if (!key || !value) { showToast('warning', 'Key dan Nilai wajib diisi.'); return; }

            try {
                const { error } = await supabase.from('app_settings').insert({
                    setting_key: key, setting_value: value,
                    setting_group: group, description,
                });
                if (error) throw error;
                modal.hide();
                reload();
                showToast('success', `Setting ${key} berhasil ditambahkan ✅`);
            } catch (err) {
                showToast('error', 'Gagal: ' + err.message);
            }
        };

        modal.show();
    }

    loadSettings();
}
