// Main orchestrator for work-orders module
import { supabase, apiCall } from '../../../api/supabase.js';
import { showToast } from '../../utils/toast.js';
import { loadWorkOrders, renderStatusSummary, renderSearchBar, getFilteredOrders, renderWorkOrders } from './list.js';
import { getStatusColor, getStatusDisplayText } from './utils.js';
import { getSpinner } from '../../utils/ui-common.js';
import { showWorkOrderModal } from './form.js';
import { showInstallationMonitoringModal } from './monitoring.js';
import { exposeMapGlobal } from './map.js';

let allWorkOrders = [];
let currentFilter = 'All';
let currentSearch = '';

/**
 * Initialize work orders module
 */
export async function initWorkOrders() {
    const contentContainer = document.getElementById('work-orders-content');
    if (!contentContainer) return;

    const listContainer = document.getElementById('work-orders-list');
    if (!listContainer) {
        contentContainer.innerHTML = '<div class="alert alert-danger">No list container found</div>';
        return;
    }

    // Add action buttons to header
    let header = document.querySelector('.admin-header');
    if (!header) {
        header = document.createElement('div');
        header.className = 'admin-header mb-3 d-flex justify-content-between align-items-center';
        contentContainer.parentNode.insertBefore(header, contentContainer);
    }

    header.innerHTML = `
        <div>
            <h3 class="m-0"><i class="bi bi-list-task"></i> Manajemen Antrian PSB</h3>
        </div>
        <div>
            <button class="btn btn-success btn-sm me-2" id="add-wo-btn">
                <i class="bi bi-plus-circle"></i> Tambah Antrian
            </button>
            <button class="btn btn-outline-secondary btn-sm" id="refresh-wo-btn">
                <i class="bi bi-arrow-clockwise"></i>
            </button>
        </div>
    `;

    // Add status summary container
    let summaryContainer = document.getElementById('wo-status-summary');
    if (!summaryContainer) {
        summaryContainer = document.createElement('div');
        summaryContainer.id = 'wo-status-summary';
        summaryContainer.className = 'mb-3';
        contentContainer.parentNode.insertBefore(summaryContainer, contentContainer);
    }

    // Load initial data
    await loadWorkOrders(listContainer, (data) => {
        allWorkOrders = data;
        updateDisplay();
    });

    // Wire up action buttons
    document.getElementById('add-wo-btn').onclick = () => showWorkOrderModal(null);
    document.getElementById('refresh-wo-btn').onclick = () => {
        loadWorkOrders(listContainer, (data) => {
            allWorkOrders = data;
            updateDisplay();
        });
    };

    // Wire map button
    const mapBtn = document.getElementById('map-button-wo');
    if (mapBtn) {
        mapBtn.onclick = () => {
            const filtered = getFilteredOrders(allWorkOrders, currentFilter, currentSearch);
            exposeMapGlobal(filtered, currentFilter);
            window.showAllPSBMap();
        };
    }

    // Render search bar
    renderSearchBar((query) => {
        currentSearch = query;
        updateDisplay();
    });

    // [WO-005] Listen for confirmation requests from other modules (like dashboard)
    document.addEventListener('request-wo-confirmation', async (e) => {
        const { woId } = e.detail;
        const wo = allWorkOrders.find(w => w.id === woId);
        if (wo) {
            showAssignConfirmPanel(wo);
        } else {
            // If not in the current loaded data, fetch it
            const { data, error } = await supabase.from('work_orders').select('*').eq('id', woId).single();
            if (data) showAssignConfirmPanel(data);
            else showToast(`Work order with ID ${woId} not found.`, 'error');
        }
    });
}

/**
 * Update display with current filter and search
 */
function updateDisplay() {
    // Update status summary with steps
    renderStatusSummary(allWorkOrders, currentFilter, (newFilter) => {
        currentFilter = newFilter;
        updateDisplay();
    });

    // Get filtered data
    const filtered = getFilteredOrders(allWorkOrders, currentFilter, currentSearch);

    // Update map global for button
    exposeMapGlobal(filtered, currentFilter);

    // Render table
    renderWorkOrders(filtered, 
        (wo) => showWorkOrderActions(wo), // Main row click action
        (wo) => showAssignConfirmPanel(wo)  // "Konfirmasi" button action
    );
}

/**
 * [WO-004] Show panel to quickly confirm a work order.
 * @param {object} wo - The work order object.
 */
async function showAssignConfirmPanel(wo) {
    const modalEl = document.getElementById('assignConfirmModal');
    const modal = new bootstrap.Modal(modalEl);
    const woCodeEl = document.getElementById('assign-wo-code');
    const saveBtn = document.getElementById('save-assign-confirm-btn');

    woCodeEl.textContent = wo.title || wo.id;

    // Load and populate the employee dropdown
    const employeeSelect = document.getElementById('assign-employee-select');
    if (employeeSelect) {
        employeeSelect.innerHTML = '<option value="">-- Pilih Teknisi (opsional) --</option>';
        const { data: employees } = await supabase
            .from('employees')
            .select('id, name')
            .eq('status', 'Aktif')
            .order('name');
        if (employees) {
            employees.forEach(emp => {
                const opt = document.createElement('option');
                opt.value = emp.id;
                opt.textContent = emp.name;
                employeeSelect.appendChild(opt);
            });
        }
        // Pre-select if already assigned
        if (wo.employee_id) employeeSelect.value = wo.employee_id;
    }

    const saveHandler = async () => {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';

        const selectedEmployeeId = employeeSelect ? (employeeSelect.value || null) : null;

        // Confirm via server-side API (admin only, creates monitoring record atomically)
        try {
            await apiCall('/work-orders/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    workOrderId: wo.id,
                    employeeId: selectedEmployeeId
                })
            });
            showToast('Work order berhasil dikonfirmasi.', 'success');
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Simpan';
            return;
        }
        
        modal.hide();
        
        // Refresh data without full page reload
        const listContainer = document.getElementById('work-orders-list');
        loadWorkOrders(listContainer, (data) => {
            allWorkOrders = data;
            updateDisplay();
        });
    };

    // Remove any existing listener before adding a new one
    if (saveBtn._clickHandler) {
        saveBtn.removeEventListener('click', saveBtn._clickHandler);
    }
    saveBtn._clickHandler = saveHandler;
    saveBtn.addEventListener('click', saveBtn._clickHandler);
    
    // Reset button state when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Simpan';
        if (saveBtn._clickHandler) {
            saveBtn.removeEventListener('click', saveBtn._clickHandler);
        }
    }, { once: true });

    modal.show();
}


/**
 * Show action menu for work order
 */
async function showWorkOrderActions(wo) {
    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    const body = document.getElementById('crudModalBody');

    document.getElementById('crudModalTitle').textContent = 'Detail & Aksi Antrian';

    body.innerHTML = getSpinner('Memuat data histori...');
    // modal.show() ensures the spinner is immediately visible while fetching data
    modal.show();

    // Fetch monitorings
    const { data: monitorings } = await supabase
        .from('installation_monitorings')
        .select('*')
        .eq('work_order_id', wo.id)
        .order('created_at', { ascending: false });

    // Format team display
    const assignments = wo.work_order_assignments || [];
    const lead = assignments.find(a => a.assignment_role === 'lead')?.employees?.name;
    const members = assignments.filter(a => a.assignment_role === 'member').map(a => a.employees?.name);
    let teamHtml = lead ? `<strong><i class="bi bi-person-badge"></i> Lead:</strong> ${lead}` : '<span class="text-warning"><i class="bi bi-exclamation-circle"></i> Belum ditugaskan</span>';
    if (members.length > 0) teamHtml += `<br><small class="text-muted"><i class="bi bi-people"></i> Anggota: ${members.join(', ')}</small>`;

    // Build timeline HTML
    let timelineHtml = '<div class="text-muted small py-3 text-center">Belum ada aktivitas tercatat.</div>';
    if (monitorings && monitorings.length > 0) {
        timelineHtml = '<div class="timeline position-relative ps-3 my-3" style="border-left: 2px solid var(--vscode-secondary);">';
        monitorings.forEach(m => {
            const date = new Date(m.created_at).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
            timelineHtml += `
                <div class="timeline-item position-relative mb-3">
                    <span class="position-absolute bg-primary rounded-circle" style="width: 10px; height: 10px; left: -20px; top: 5px;"></span>
                    <div class="small fw-bold text-white mb-1"><i class="bi bi-clock-history me-1"></i> ${date}</div>
                    <div class="p-2 rounded bg-dark border border-secondary shadow-sm">
                        <span class="badge bg-secondary mb-1">${m.status || 'Update'}</span>
                        <div class="small mt-1 text-white-50">${m.notes || 'Diperbarui'}</div>
                    </div>
                </div>
            `;
        });
        timelineHtml += '</div>';
    }

    body.innerHTML = `
        <div class="wo-details-modal">
            <!-- Header Banner -->
            <div class="p-3 mb-3 rounded shadow-sm d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, rgba(13,110,253,0.1), rgba(13,110,253,0.05)); border: 1px solid var(--vscode-primary);">
                <div>
                    <h5 class="mb-1 text-white"><i class="bi bi-person-circle me-2 text-primary"></i>${wo.customers?.name || '-'}</h5>
                    <div class="small text-white-50"><i class="bi bi-telephone me-1"></i> ${wo.customers?.phone || '-'}</div>
                </div>
                <div class="text-end">
                    <span class="badge" style="background-color: ${getStatusColor(wo.status)};">${getStatusDisplayText(wo.status)}</span>
                    <div class="small fw-bold text-info mt-1">${wo.title || 'PSB'}</div>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card bg-vscode border-secondary shadow-sm h-100">
                        <div class="card-body p-2 px-3 small">
                            <span class="text-white-50 d-block mb-1">Paket Layanan:</span>
                            <span class="fw-bold text-white">${wo.customers?.packet || 'Tidak ada'}</span>
                            <hr class="my-1 border-secondary">
                            <span class="text-white-50 d-block mb-1">Catatan (Ket):</span>
                            <span class="text-white">${wo.ket || '-'}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-vscode border-secondary shadow-sm h-100">
                        <div class="card-body p-2 px-3 small">
                            <span class="text-white-50 d-block mb-1">Tim Penugasan:</span>
                            <div class="text-white">${teamHtml}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation for Actions vs History -->
            <ul class="nav nav-pills mb-3 nav-fill border-bottom border-secondary pb-2" id="woTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active btn-sm" id="actions-tab" data-bs-toggle="pill" data-bs-target="#actions-panel" type="button" role="tab">Aksi & Manajemen</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link btn-sm" id="history-tab" data-bs-toggle="pill" data-bs-target="#history-panel" type="button" role="tab">Riwayat Aktivitas</button>
                </li>
            </ul>

            <div class="tab-content" id="woTabsContent">
                <!-- Actions Panel -->
                <div class="tab-pane fade show active" id="actions-panel" role="tabpanel">
                    <div class="row g-2">
                        <div class="col-6">
                            <button class="btn btn-outline-primary w-100 shadow-sm" id="action-edit-wo">
                                <i class="bi bi-pencil d-block fs-5 mb-1"></i> <small>Edit Data</small>
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-info w-100 shadow-sm" id="action-monitor-wo">
                                <i class="bi bi-graph-up d-block fs-5 mb-1"></i> <small>Pantau / Update</small>
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-success w-100 shadow-sm position-relative" id="action-close-wo">
                                <i class="bi bi-check-circle d-block fs-5 mb-1"></i> <small>Selesaikan (Tutup)</small>
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-danger w-100 shadow-sm" id="action-delete-wo">
                                <i class="bi bi-trash d-block fs-5 mb-1"></i> <small>Batal/Hapus</small>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- History Panel -->
                <div class="tab-pane fade" id="history-panel" role="tabpanel">
                    <div class="bg-dark p-2 rounded shadow-inner" style="max-height: 250px; overflow-y: auto;">
                        ${timelineHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    // document.getElementById('save-crud-btn').style.display = 'none';

    document.getElementById('action-edit-wo').onclick = () => {
        modal.hide();
        showWorkOrderModal(wo);
    };

    document.getElementById('action-monitor-wo').onclick = () => {
        modal.hide();
        showInstallationMonitoringModal(wo, () => {
            location.reload();
        });
    };

    document.getElementById('action-close-wo').onclick = async () => {
        try {
            await apiCall('/work-orders/close', {
                method: 'POST',
                body: JSON.stringify({ workOrderId: wo.id })
            });
            showToast('Antrian berhasil ditutup', 'success');
            modal.hide();
            location.reload();
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
        }
    };

    document.getElementById('action-delete-wo').onclick = async () => {
        if (!confirm('Yakin ingin menghapus antrian ini?')) return;

        try {
            await apiCall(`/work-orders/${wo.id}`, { method: 'DELETE' });
            showToast('Antrian berhasil dihapus', 'success');
            modal.hide();
            location.reload();
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
        }
    };
    // Note: modal.show() was already called at the top during loading phase
}
