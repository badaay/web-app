import { supabase, apiCall } from '../../../api/supabase.js';
import { getSpinner } from '../../utils/ui-common.js';
import { showToast } from '../../utils/toast.js';

/**
 * Pendaftaran Module
 * Focused on new registrations with bulk actions and 2-row layout.
 */

let allWorkOrders = [];
let selectedIds = new Set();
let currentFilter = 'all';

const STATUS_PRIORITY = {
    'open': 1,
    'confirmed': 2,
    'waiting': 3,
    'completed': 4
};

export async function initPendaftaran() {
    const container = document.getElementById('pendaftaran-content');
    if (!container) return;

    // 1. Initial UI Structure
    container.innerHTML = `
        <div class="pendaftaran-wrapper">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="mb-0 text-white font-mono"><i class="bi bi-clipboard-check me-2 text-accent"></i>PENDAFTARAN</h4>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-secondary btn-sm" id="pendaftaran-refresh-btn">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </div>

            <div class="inbox-container" id="pendaftaran-inbox">
                <div class="toolbar">
                    <div class="tabs" id="pendaftaran-tabs">
                        <button class="tab-btn active" data-filter="all">SEMUA</button>
                        <button class="tab-btn" data-filter="waiting">MENUNGGU</button>
                        <button class="tab-btn" data-filter="confirmed">TERKONFIRMASI</button>
                        <button class="tab-btn" data-filter="completed">SELESAI</button>
                    </div>

                    <div class="bulk-actions" id="pendaftaran-bulk-toolbar" style="display: none;">
                        <span class="selected-count font-mono"><span id="pendaftaran-count-display">0</span> Terpilih</span>
                        <button class="action-btn" id="pendaftaran-bulk-confirm"><i class="bi bi-check2-circle"></i> Konfirmasi Massal</button>
                        <button class="action-btn danger" id="pendaftaran-bulk-delete"><i class="bi bi-trash3"></i> Hapus</button>
                    </div>
                </div>

                <div class="list-header font-mono">
                    <div class="cell-check">
                        <input type="checkbox" class="custom-checkbox" id="pendaftaran-master-checkbox">
                    </div>
                    <div class="cell-id">ID</div>
                    <div class="cell-status">STATUS</div>
                    <div class="cell-title text-start">PELANGGAN / PAKET</div>
                    <div class="cell-tech text-start">TEKNISI</div>
                    <div class="cell-region text-end">WILAYAH</div>
                    <div class="cell-actions text-end">AKSI</div>
                </div>

                <div class="pendaftaran-rows-container">
                    <!-- Row 1: Today -->
                    <div class="row-group-header font-mono mt-3 px-3 py-1 text-accent-teal" style="font-size: 0.7rem; background: rgba(20, 184, 166, 0.05); border-left: 4px solid var(--vscode-accent-teal);">
                        TARGET HARI INI
                    </div>
                    <div id="pendaftaran-list-today"></div>

                    <!-- Row 2: Backlog -->
                    <div class="row-group-header font-mono mt-4 px-3 py-1 text-warning" style="font-size: 0.7rem; background: rgba(234, 179, 8, 0.05); border-left: 4px solid var(--vscode-warning);">
                        ANTRIAN BELUM TERKONFIRMASI
                    </div>
                    <div id="pendaftaran-list-backlog"></div>
                </div>
            </div>
        </div>

        <style>
            .pendaftaran-wrapper {
                animation: fadeIn 0.3s ease-out;
            }

            .inbox-container {
                background-color: var(--vscode-bg);
                border: 1px solid var(--vscode-border);
                box-shadow: 8px 8px 0px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
            }

            .toolbar {
                padding: 12px 20px;
                border-bottom: 1px solid var(--vscode-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: rgba(30, 41, 59, 0.5);
                height: 56px;
            }

            .tabs { display: flex; gap: 16px; align-items: center; }
            .bulk-actions { display: flex; gap: 12px; align-items: center; }

            .tab-btn {
                background: transparent;
                border: none;
                color: var(--vscode-text);
                font-family: 'Fira Code', monospace;
                font-size: 0.75rem;
                cursor: pointer;
                padding: 8px 12px;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
            }

            .tab-btn:hover { color: var(--vscode-text-bright); }
            .tab-btn.active { color: var(--vscode-text-bright); border-bottom-color: var(--vscode-accent); }

            .action-btn {
                background: var(--vscode-sidebar-bg);
                border: 1px solid var(--vscode-border);
                color: var(--vscode-text-bright);
                border-radius: 4px;
                padding: 4px 10px;
                font-size: 0.75rem;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .action-btn:hover { background: var(--vscode-activitybar-bg); border-color: var(--vscode-text); }
            .action-btn.danger:hover { color: var(--vscode-danger); border-color: var(--vscode-danger); }

            .list-header, .list-row {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 10px 16px;
            }

            .list-header {
                border-bottom: 1px solid var(--vscode-border);
                font-size: 0.7rem;
                color: var(--vscode-text);
                font-weight: 600;
                background: rgba(0,0,0,0.2);
            }

            .list-row {
                border-bottom: 1px solid var(--vscode-border);
                border-left: 4px solid transparent;
                background-color: transparent;
                transition: all 0.1s;
                cursor: pointer;
                position: relative;
            }

            .list-row:hover {
                background-color: var(--vscode-list-hover);
                border-left-color: var(--vscode-border);
            }

            .list-row.selected {
                background-color: var(--vscode-list-active);
                border-left-color: var(--vscode-accent);
            }

            .cell-check { width: 30px; display: flex; align-items: center; justify-content: center; }
            .cell-id { width: 80px; font-size: 0.7rem; color: var(--vscode-text); }
            .cell-status { width: 120px; }
            .cell-title { flex: 1; min-width: 200px; font-size: 0.85rem; color: var(--vscode-text-bright); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .cell-tech { width: 150px; font-size: 0.75rem; color: var(--vscode-text); }
            .cell-region { width: 150px; text-align: right; color: var(--vscode-text-50); font-size: 0.75rem; }
            .cell-actions { width: 100px; text-align: right; }

            .status-badge-hard {
                font-size: 0.6rem;
                padding: 2px 8px;
                border: 1px solid currentColor;
                text-transform: uppercase;
                font-family: 'Fira Code', monospace;
                display: inline-block;
                width: 100px;
                text-align: center;
            }

            .custom-checkbox {
                appearance: none;
                width: 16px;
                height: 16px;
                border: 1px solid var(--vscode-text);
                border-radius: 2px;
                outline: none;
                cursor: pointer;
                background: transparent;
                display: grid;
                place-content: center;
            }
            .custom-checkbox:checked { background-color: var(--vscode-accent); border-color: var(--vscode-accent); }
            .custom-checkbox:checked::before {
                content: "✔";
                font-size: 10px;
                color: white;
            }

            .row-quick-actions {
                display: none;
                gap: 8px;
                justify-content: flex-end;
            }

            .list-row:hover .row-quick-actions {
                display: flex;
            }

            .list-row:hover .cell-meta-date {
                display: none;
            }

            .quick-btn {
                background: none;
                border: none;
                color: var(--vscode-text);
                padding: 2px 4px;
                cursor: pointer;
                transition: color 0.2s;
            }
            .quick-btn:hover { color: var(--vscode-text-bright); }
            .quick-btn.wa:hover { color: #25d366; }

            .row-group-header {
                font-size: 0.7rem;
                padding: 4px 12px;
                margin-top: 1.5rem;
                letter-spacing: 1px;
                background: rgba(255, 255, 255, 0.03);
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Responsive Design for Mobile */
            @media (max-width: 768px) {
                .cell-id, .cell-tech, .cell-region {
                    display: none !important;
                }
                .cell-status { width: 80px; }
                .status-badge-hard { width: 70px; font-size: 0.5rem; }
                .cell-title { min-width: 120px; font-size: 0.75rem; }
                .list-header, .list-row { gap: 8px; padding: 10px 8px; }
                .toolbar { padding: 12px 10px; height: auto; flex-direction: column; gap: 10px; align-items: flex-start; }
                .bulk-actions { width: 100%; justify-content: space-between; }
                .row-quick-actions { display: flex !important; }
                .cell-meta-date { display: none !important; }
            }
        </style>
    `;

    // 2. Event Listeners
    setupEventListeners();

    // 3. Load Data
    await loadData();
}

async function loadData() {
    const listToday = document.getElementById('pendaftaran-list-today');
    const listBacklog = document.getElementById('pendaftaran-list-backlog');

    listToday.innerHTML = getSpinner('Memuat data hari ini...');
    listBacklog.innerHTML = getSpinner('Memuat backlog...');

    try {
        const { data, error } = await supabase
            .from('work_orders')
            .select(`
                id, item_code, status, title, registration_date, created_at, ket,
                customers(id, name, address, packet, phone),
                work_order_assignments(assignment_role, employees(name, phone))
            `)
            .in('status', ['waiting', 'confirmed', 'open', 'completed'])
            .order('registration_date', { ascending: true });

        if (error) throw error;

        allWorkOrders = data || [];
        renderLists();
    } catch (err) {
        console.error('Error loading pendaftaran data:', err);
        showToast('error', 'Gagal memuat data pendaftaran');
    }
}

function renderLists() {
    const listToday = document.getElementById('pendaftaran-list-today');
    const listBacklog = document.getElementById('pendaftaran-list-backlog');

    const filteredOrders = allWorkOrders.filter(wo => {
        if (currentFilter === 'waiting') return wo.status === 'waiting';
        if (currentFilter === 'confirmed') return wo.status === 'confirmed';
        if (currentFilter === 'completed') return wo.status === 'completed';
        return true;
    }).sort((a, b) => {
        const pA = STATUS_PRIORITY[a.status] || 99;
        const pB = STATUS_PRIORITY[b.status] || 99;
        if (pA !== pB) return pA - pB;
        // Secondary sort by date
        return new Date(a.registration_date || a.created_at) - new Date(b.registration_date || b.created_at);
    });

    const todayItems = filteredOrders.filter(wo => {
        return ['confirmed', 'open', 'completed'].includes(wo.status);
    });
    
    const backlogItems = filteredOrders.filter(wo => {
        return wo.status === 'waiting';
    });

    const todayHeader = document.querySelector('.row-group-header.text-accent-teal');
    const backlogHeader = document.querySelector('.row-group-header.text-warning');
    
    if (todayHeader) {
        if (currentFilter === 'completed') {
            todayHeader.innerHTML = `PENDAFTARAN SELESAI (MENUNGGU VERIFIKASI) <span class="ms-2 opacity-50">[ ${todayItems.length} ]</span>`;
        } else if (currentFilter === 'confirmed') {
            todayHeader.innerHTML = `TARGET PROSES HARI INI <span class="ms-2 opacity-50">[ ${todayItems.length} ]</span>`;
        } else {
            todayHeader.innerHTML = `TARGET HARI INI <span class="ms-2 opacity-50">[ ${todayItems.length} ]</span>`;
        }
    }
    
    if (backlogHeader) {
        if (currentFilter === 'all' || currentFilter === 'waiting') {
            backlogHeader.style.display = 'block';
            backlogHeader.innerHTML = `ANTRIAN BELUM TERKONFIRMASI <span class="ms-2 opacity-50">[ ${backlogItems.length} ]</span>`;
        } else {
            backlogHeader.style.display = 'none';
        }
    }

    listToday.innerHTML = todayItems.length ? todayItems.map(item => renderRow(item)).join('') : '<div class="px-4 py-3 text-white-50 small font-mono text-center">-- TIDAK_ADA_DATA_DITEMUKAN --</div>';
    listBacklog.innerHTML = (backlogItems.length && (currentFilter === 'all' || currentFilter === 'waiting')) ? backlogItems.map(item => renderRow(item)).join('') : '';

    // Re-attach selection listeners
    attachRowListeners();
    updateToolbarState();
}

function renderRow(wo) {
    const isSelected = selectedIds.has(wo.id);
    
    let statusColor = 'var(--vscode-warning)';
    let statusLabel = 'MENUNGGU';

    if (wo.status === 'confirmed') {
        statusColor = 'var(--vscode-success)';
        statusLabel = 'TERKONFIRMASI';
    } else if (wo.status === 'open') {
        statusColor = 'var(--vscode-text)';
        statusLabel = 'DIPROSES';
    } else if (wo.status === 'completed') {
        statusColor = 'var(--vscode-accent-teal)';
        statusLabel = 'SELESAI';
    }

    const assignments = wo.work_order_assignments || [];
    const lead = assignments.find(a => a.assignment_role === 'lead')?.employees?.name || '-';

    return `
        <div class="list-row ${isSelected ? 'selected' : ''}" data-id="${wo.id}">
            <div class="cell-check">
                ${wo.status === 'waiting' ? `<input type="checkbox" class="custom-checkbox row-checkbox" ${isSelected ? 'checked' : ''} data-id="${wo.id}">` : ''}
            </div>
            <div class="cell-id font-mono text-white-50">${wo.item_code || wo.id.substring(0, 8)}</div>
            <div class="cell-status">
                <span class="status-badge-hard" style="color: ${statusColor}; border-color: ${statusColor};">
                    ${statusLabel}
                </span>
            </div>
            <div class="cell-title">
                <span class="fw-bold">${wo.customers?.name || 'Unknown'}</span>
                <span class="mx-2 text-white-50 opacity-25">/</span>
                <span class="text-white-50 small font-mono">${wo.customers?.packet || '-'}</span>
            </div>
            <div class="cell-tech font-mono">
                <i class="bi bi-person-fill me-1 opacity-50"></i>${lead}
            </div>
            <div class="cell-region font-mono">
                ${wo.customers?.address?.substring(0, 20) || '-'}
            </div>
            <div class="cell-actions">
                <div class="row-quick-actions">
                    <button class="quick-btn detail-btn" title="Detail"><i class="bi bi-eye"></i></button>
                    <button class="quick-btn wa wa-btn" title="WhatsApp"><i class="bi bi-whatsapp"></i></button>
                    ${wo.status === 'waiting' ? `<button class="quick-btn confirm-single-btn" title="Konfirmasi"><i class="bi bi-check-lg"></i></button>` : ''}
                    ${wo.status === 'completed' ? `<button class="quick-btn verify-single-btn text-success" title="Verifikasi"><i class="bi bi-shield-check"></i></button>` : ''}
                </div>
                <div class="font-mono text-white-50 cell-meta-date" style="font-size: 0.65rem;">
                    ${wo.registration_date ? new Date(wo.registration_date).toLocaleDateString('id-ID') : new Date(wo.created_at).toLocaleDateString('id-ID')}
                </div>
            </div>
        </div>
    `;
}

function attachRowListeners() {
    const container = document.getElementById('pendaftaran-inbox');
    
    container.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.onchange = (e) => {
            const id = e.target.dataset.id;
            if (e.target.checked) selectedIds.add(id);
            else selectedIds.delete(id);
            
            const row = e.target.closest('.list-row');
            if (e.target.checked) row.classList.add('selected');
            else row.classList.remove('selected');
            
            updateToolbarState();
        };
    });

    container.querySelectorAll('.list-row').forEach(row => {
        row.onclick = (e) => {
            if (e.target.classList.contains('custom-checkbox') || e.target.closest('.quick-btn')) return;
            const cb = row.querySelector('.row-checkbox');
            if (cb) {
                cb.checked = !cb.checked;
                cb.dispatchEvent(new Event('change'));
            }
        };
    });

    container.querySelectorAll('.detail-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.closest('.list-row').dataset.id;
            const wo = allWorkOrders.find(w => w.id === id);
            showPendaftaranDetail(wo);
        };
    });

    container.querySelectorAll('.wa-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.closest('.list-row').dataset.id;
            const wo = allWorkOrders.find(w => w.id === id);
            showWhatsAppPopup(wo);
        };
    });

    container.querySelectorAll('.confirm-single-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.closest('.list-row').dataset.id;
            await confirmOrders([id]);
        };
    });

    container.querySelectorAll('.verify-single-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.closest('.list-row').dataset.id;
            if (!confirm('Verifikasi pekerjaan ini dan berikan poin?')) return;
            
            try {
                window.setBtnLoading(btn, true, '');
                await apiCall('/work-orders/verify', {
                    method: 'POST',
                    body: JSON.stringify({ id: id })
                });
                showToast('success', 'Pekerjaan berhasil diverifikasi dan ditutup.');
                await loadData();
            } catch (err) {
                showToast('error', `Gagal verifikasi: ${err.message}`);
                window.setBtnLoading(btn, false);
            }
        };
    });
}

/**
 * Show detailed information modal
 */
async function showPendaftaranDetail(wo) {
    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    const body = document.getElementById('crudModalBody');
    const title = document.getElementById('crudModalTitle');

    title.innerHTML = `<i class="bi bi-info-circle me-2"></i>DETAIL_PENDAFTARAN [ ${wo.item_code || 'N/A'} ]`;
    body.innerHTML = getSpinner('Memuat histori...');
    modal.show();

    // Fetch assignments and monitorings for full history
    const { data: assignments } = await supabase
        .from('work_order_assignments')
        .select('*, employees(name, phone, position)')
        .eq('work_order_id', wo.id);

    const { data: monitorings } = await supabase
        .from('installation_monitorings')
        .select('*')
        .eq('work_order_id', wo.id)
        .order('created_at', { ascending: false });

    const lead = assignments?.find(a => a.assignment_role === 'lead');
    const members = assignments?.filter(a => a.assignment_role === 'member') || [];

    // Import ActivityLog dynamically
    const { ActivityLog } = await import('../../utils/activity-log.js');

    const logs = (monitorings || []).map(m => ({
        created_at: m.created_at,
        status: m.status === 'completed' ? 'SELESAI' : m.status === 'in_progress' ? 'DIPROSES' : 'MULAI',
        notes: m.notes || 'Pekerjaan diperbarui',
        color: m.status === 'completed' ? 'var(--tech-accent-success)' : 'var(--tech-accent-blue)',
        icon: 'bi-clock-history'
    }));

    body.innerHTML = `
        <div class="detail-view font-mono" style="color: var(--slate-50);">
            <div class="row g-3 mb-4">
                <div class="col-md-7">
                    <div class="p-3 border border-white border-opacity-10 rounded shadow-sm" style="background: rgba(15, 23, 42, 0.4);">
                        <div class="text-white-50 small mb-2 opacity-50">// INFORMASI_PELANGGAN</div>
                        <div class="h5 mb-1 text-white fw-bold">${wo.customers?.name || '-'}</div>
                        <div class="mb-3 small"><i class="bi bi-telephone text-info me-1"></i>${wo.customers?.phone || '-'}</div>
                        
                        <div class="mb-2 d-flex align-items-center gap-3">
                            <span class="text-white-50 small">Paket:</span>
                            <span class="badge rounded-0 border border-info text-info bg-info bg-opacity-10">${wo.customers?.packet || 'N/A'}</span>
                        </div>
                        <div class="mb-3">
                            <span class="text-white-50 small">Alamat:</span>
                            <div class="text-white-50 small mt-1 lh-sm">${wo.customers?.address || '-'}</div>
                        </div>
                        <div class="pt-2 border-top border-white border-opacity-10">
                            <span class="text-white-50 small">Keterangan:</span>
                            <div class="text-white-50 small mt-1 italic" style="font-style: italic; opacity: 0.7;">${wo.ket || 'Tidak ada keterangan tambahan.'}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="p-3 border border-white border-opacity-10 rounded h-100 shadow-sm" style="background: rgba(15, 23, 42, 0.4);">
                        <div class="text-white-50 small mb-2 opacity-50">// PERSONIL_BERTUGAS</div>
                        ${lead ? `
                            <div class="d-flex align-items-center gap-2 mb-3">
                                <i class="bi bi-person-badge text-info fs-5"></i>
                                <div>
                                    <div class="text-white small fw-bold">${lead.employees?.name}</div>
                                    <div class="text-info x-small fw-bold">LEAD TECHNICIAN</div>
                                </div>
                            </div>
                        ` : '<div class="text-white-50 small italic mb-2">Belum ada Lead.</div>'}
                        
                        ${members.length > 0 ? `
                            <div class="mt-3 pt-2 border-top border-white border-opacity-10">
                                <div class="text-white-50 x-small mb-2">ANGGOTA TIM:</div>
                                ${members.map(m => `
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <i class="bi bi-person text-white-50 opacity-50"></i>
                                        <span class="text-white-50 small">${m.employees?.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div class="history-section">
                <div class="text-white-50 small mb-3 opacity-50">// RIWAYAT_AKTIVITAS</div>
                <div class="p-3 border border-white border-opacity-10 rounded" style="max-height: 250px; overflow-y: auto; background: rgba(0,0,0,0.2);">
                    ${ActivityLog.renderTimeline(logs)}
                </div>
            </div>
        </div>
        <style>
            .x-small { font-size: 0.65rem; }
            .bg-dark-soft { background: rgba(15, 23, 42, 0.4); }
        </style>
    `;
}

/**
 * Show WhatsApp Popup for messaging using Fonnte integration
 */
async function showWhatsAppPopup(wo) {
    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    const body = document.getElementById('crudModalBody');
    const title = document.getElementById('crudModalTitle');

    const custName = wo.customers?.name || 'Pelanggan';
    const custPhone = wo.customers?.phone;
    const assignments = wo.work_order_assignments || [];
    const lead = assignments.find(a => a.assignment_role === 'lead');
    const techName = lead?.employees?.name || 'Tim Teknisi';
    const techPhone = lead?.employees?.phone;

    title.innerHTML = `<i class="bi bi-whatsapp me-2 text-success"></i>WHATSAPP_COMMS [ ${wo.item_code || 'N/A'} ]`;
    
    // Auto-convert phone: 0 -> 62
    const formatPhone = (p) => {
        if (!p) return '';
        let s = String(p).trim();
        if (s.startsWith('0')) s = '62' + s.slice(1);
        return s;
    };

    const targetCust = formatPhone(custPhone);
    const targetTech = formatPhone(techPhone);

    const WA_TEMPLATES = {
        'wo_confirmed': { 
            label: 'Konfirmasi (Admin)', 
            msg: `Halo *${custName}*! Pesanan Anda telah *dikonfirmasi* oleh admin. Teknisi *${techName}* akan segera dijadwalkan ke lokasi Anda.` 
        },
        'wo_open': { 
            label: 'Teknisi OTW', 
            msg: `Halo *${custName}*, teknisi kami *${techName}* sedang dalam perjalanan menuju lokasi Anda. 🔧 Mohon siapkan akses ke titik instalasi.` 
        },
        'custom': { label: 'Pesan Kustom', msg: '' }
    };

    const templateOptions = Object.entries(WA_TEMPLATES).map(([k, t]) => 
        `<option value="${k}">${t.label}</option>`
    ).join('');

    body.innerHTML = `
        <div class="wa-premium-modal font-mono">
            <div class="mb-4">
                <label class="form-label text-white-50 small mb-2">// PILIH_TARGET</label>
                <div class="row g-2">
                    <div class="col-6">
                        <div class="target-card active" id="wa-target-cust" data-phone="${targetCust}">
                            <div class="small fw-bold">PELANGGAN</div>
                            <div class="x-small text-white-50">${custName}</div>
                            <div class="x-small mt-1 text-accent-teal">${targetCust || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="target-card ${!targetTech ? 'disabled' : ''}" id="wa-target-tech" data-phone="${targetTech}">
                            <div class="small fw-bold">TEKNISI (LEAD)</div>
                            <div class="x-small text-white-50">${techName}</div>
                            <div class="x-small mt-1 text-info">${targetTech || 'BELUM_ADA'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label text-white-50 small mb-2">// TEMPLATE_PESAN</label>
                <select id="wa-modal-tpl-picker" class="form-select bg-dark text-white border-secondary small">
                    ${templateOptions}
                </select>
            </div>

            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <label class="form-label text-white-50 small mb-0">// ISI_PESAN</label>
                    <span id="wa-modal-counter" class="x-small text-white-50">0/1000</span>
                </div>
                <textarea id="wa-modal-text" class="form-control bg-dark text-white border-secondary small" rows="5" placeholder="Tulis pesan..."></textarea>
            </div>

            <div class="d-grid gap-2">
                <button class="btn btn-success py-2 font-mono" id="wa-modal-send-btn">
                    <i class="bi bi-send-fill me-2"></i>KIRIM_VIA_FONNTE
                </button>
                <button class="btn btn-outline-secondary py-1 x-small" id="wa-modal-direct-btn">
                    <i class="bi bi-box-arrow-up-right me-2"></i>Buka WhatsApp Web Langsung
                </button>
            </div>
        </div>

        <style>
            .target-card {
                background: rgba(255,255,255,0.03);
                border: 1px solid var(--vscode-border);
                padding: 10px;
                cursor: pointer;
                transition: all 0.2s;
                height: 100%;
            }
            .target-card:hover:not(.disabled) { background: rgba(255,255,255,0.08); border-color: var(--vscode-text-50); }
            .target-card.active { background: rgba(20, 184, 166, 0.1); border-color: var(--vscode-accent-teal); box-shadow: inset 0 0 10px rgba(20, 184, 166, 0.1); }
            .target-card.disabled { opacity: 0.4; cursor: not-allowed; }
            .wa-premium-modal .form-select, .wa-premium-modal .form-control { border-radius: 0; }
            .x-small { font-size: 0.65rem; }
        </style>
    `;

    const picker = document.getElementById('wa-modal-tpl-picker');
    const area = document.getElementById('wa-modal-text');
    const counter = document.getElementById('wa-modal-counter');
    const sendBtn = document.getElementById('wa-modal-send-btn');
    const directBtn = document.getElementById('wa-modal-direct-btn');
    const targetCards = document.querySelectorAll('.target-card');

    let activePhone = targetCust;

    targetCards.forEach(card => {
        card.onclick = () => {
            if (card.classList.contains('disabled')) return;
            targetCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activePhone = card.dataset.phone;
        };
    });

    const updatePreview = () => {
        const tpl = WA_TEMPLATES[picker.value];
        if (tpl && picker.value !== 'custom') {
            area.value = tpl.msg;
        }
        counter.innerText = `${area.value.length}/1000`;
    };

    picker.onchange = updatePreview;
    area.oninput = () => {
        counter.innerText = `${area.value.length}/1000`;
        if (area.value !== WA_TEMPLATES[picker.value]?.msg) {
            picker.value = 'custom';
        }
    };
    updatePreview();

    sendBtn.onclick = async () => {
        if (!activePhone) return showToast('error', 'Pilih target terlebih dahulu');
        const message = area.value.trim();
        if (!message) return showToast('error', 'Pesan tidak boleh kosong');

        sendBtn.disabled = true;
        sendBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>MENGIRIM...`;

        try {
            const { apiCall } = await import('../../../api/supabase.js');
            const res = await apiCall('/notifications/send', {
                method: 'POST',
                body: JSON.stringify({
                    target: activePhone,
                    message: message
                })
            });

            showToast('success', 'Pesan berhasil dikirim via Fonnte ✅');
            modal.hide();
        } catch (err) {
            console.error('Fonnte error:', err);
            showToast('error', 'Gagal mengirim via Fonnte: ' + err.message);
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = `<i class="bi bi-send-fill me-2"></i>KIRIM_VIA_FONNTE`;
        }
    };

    directBtn.onclick = () => {
        if (!activePhone) return showToast('error', 'Pilih target terlebih dahulu');
        const url = `https://wa.me/${activePhone}?text=${encodeURIComponent(area.value)}`;
        window.open(url, '_blank');
    };

    modal.show();
}

function updateToolbarState() {
    const bulkToolbar = document.getElementById('pendaftaran-bulk-toolbar');
    const tabs = document.getElementById('pendaftaran-tabs');
    const countDisplay = document.getElementById('pendaftaran-count-display');
    const masterCb = document.getElementById('pendaftaran-master-checkbox');

    const selectableOrders = allWorkOrders.filter(wo => wo.status === 'waiting');
    const totalSelectable = selectableOrders.length;
    const checkedCount = selectedIds.size;

    if (checkedCount > 0) {
        tabs.style.display = 'none';
        bulkToolbar.style.display = 'flex';
        countDisplay.innerText = checkedCount;
        masterCb.checked = checkedCount === totalSelectable && totalSelectable > 0;
        masterCb.indeterminate = checkedCount > 0 && checkedCount < totalSelectable;
    } else {
        tabs.style.display = 'flex';
        bulkToolbar.style.display = 'none';
        masterCb.checked = false;
        masterCb.indeterminate = false;
    }
}

function setupEventListeners() {
    const refreshBtn = document.getElementById('pendaftaran-refresh-btn');
    if (refreshBtn) refreshBtn.onclick = () => loadData();

    const masterCb = document.getElementById('pendaftaran-master-checkbox');
    if (masterCb) {
        masterCb.onchange = (e) => {
            const isChecked = e.target.checked;
            if (isChecked) {
                // Only select 'waiting' orders
                allWorkOrders.forEach(wo => {
                    if (wo.status === 'waiting') selectedIds.add(wo.id);
                });
            } else {
                selectedIds.clear();
            }
            renderLists();
        };
    }

    const bulkConfirmBtn = document.getElementById('pendaftaran-bulk-confirm');
    if (bulkConfirmBtn) {
        bulkConfirmBtn.onclick = async () => {
            if (selectedIds.size === 0) return;
            await confirmOrders(Array.from(selectedIds));
        };
    }

    // Filter tabs
    const tabs = document.querySelectorAll('#pendaftaran-tabs .tab-btn');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderLists();
        };
    });
}

async function confirmOrders(ids) {
    if (!confirm(`Konfirmasi ${ids.length} pendaftaran?`)) return;

    try {
        const { error } = await supabase
            .from('work_orders')
            .update({ 
                status: 'confirmed',
            })
            .in('id', ids)
            .eq('status', 'waiting'); // Safety: only update if still in waiting status

        if (error) throw error;

        showToast('success', `${ids.length} pendaftaran berhasil dikonfirmasi`);
        selectedIds.clear();
        await loadData();
    } catch (err) {
        console.error('Error confirming orders:', err);
        showToast('error', 'Gagal mengonfirmasi pendaftaran');
    }
}
