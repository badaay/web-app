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
    const workOrdersCard = document.getElementById('work-orders-list');
    if (!contentContainer || !workOrdersCard) return;

    // Create the tabbed structure for work orders (Pemasangan and Perbaikan)
    const tabsContainer = document.createElement('div');
    tabsContainer.id = 'work-orders-tabs-container';
    tabsContainer.innerHTML = `
        <ul class="nav nav-tabs" id="woTypeTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="pemasangan-tab" data-bs-toggle="tab" data-bs-target="#pemasangan-panel" type="button" role="tab">Pemasangan</button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="perbaikan-tab" data-bs-toggle="tab" data-bs-target="#perbaikan-panel" type="button" role="tab">Perbaikan</button>
            </li>
        </ul>
        <div class="tab-content" id="woTypeTabsContent">
            <div class="tab-pane fade show active" id="pemasangan-panel" role="tabpanel">
                <div id="work-orders-list-pemasangan" class="mt-3"></div>
            </div>
            <div class="tab-pane fade" id="perbaikan-panel" role="tabpanel">
                <div id="work-orders-list-perbaikan" class="mt-3"></div>
            </div>
        </div>
    `;
    
    // Replace the card body content with the tabs container
    workOrdersCard.querySelector('.card-body').innerHTML = '';
    workOrdersCard.querySelector('.card-body').appendChild(tabsContainer);

    const listContainerPemasangan = document.getElementById('work-orders-list-pemasangan');
    const listContainerPerbaikan = document.getElementById('work-orders-list-perbaikan');

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

    // Fetch queue type IDs
    let pemasanganTypeId, perbaikanTypeId;
    try {
        const { data: queueTypes, error } = await supabase.from('master_queue_types').select('id, name');
        if (error) throw error;
        if (queueTypes) {
            pemasanganTypeId = queueTypes.find(t => t.name === 'PSB')?.id;
            perbaikanTypeId = queueTypes.find(t => t.name === 'Repair')?.id;
        }
    } catch (err) {
        console.error('Error fetching queue types:', err);
        showToast('Gagal memuat tipe antrian', 'error');
        return;
    }

    if (!pemasanganTypeId || !perbaikanTypeId) {
        showToast('Data tipe antrian tidak lengkap', 'error');
        return;
    }

    // Load initial data for both tabs
    loadDataForTab(pemasanganTypeId, listContainerPemasangan);
    loadDataForTab(perbaikanTypeId, listContainerPerbaikan);

    // Wire up tab events to reload data if needed (or just filter)
    document.getElementById('pemasangan-tab').addEventListener('shown.bs.tab', () => {
        loadDataForTab(pemasanganTypeId, listContainerPemasangan);
        renderTargetStatistics(pemasanganTypeId, perbaikanTypeId);
    });
    document.getElementById('perbaikan-tab').addEventListener('shown.bs.tab', () => {
        loadDataForTab(perbaikanTypeId, listContainerPerbaikan);
        renderTargetStatistics(pemasanganTypeId, perbaikanTypeId);
    });


    // Wire up action buttons
    document.getElementById('add-wo-btn').onclick = () => showWorkOrderModal(null, () => {
        // Refresh the correct tab after adding
        const activeTab = document.querySelector('#woTypeTabs .nav-link.active').id;
        const typeId = activeTab === 'pemasangan-tab' ? pemasanganTypeId : perbaikanTypeId;
        
        const container = activeTab === 'pemasangan-tab' 
            ? document.getElementById('work-orders-list-pemasangan') 
            : document.getElementById('work-orders-list-perbaikan');

        loadDataForTab(typeId, container);
    });
    document.getElementById('refresh-wo-btn').onclick = () => {
        loadDataForTab(pemasanganTypeId, listContainerPemasangan);
        loadDataForTab(perbaikanTypeId, listContainerPerbaikan);
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
        // We need to update both displays now
        loadDataForTab(pemasanganTypeId, listContainerPemasangan);
        loadDataForTab(perbaikanTypeId, listContainerPerbaikan);
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

    // Render target statistics
    await renderTargetStatistics(pemasanganTypeId, perbaikanTypeId);
}

/**
 * Render work order target statistics for today
 * Caches the result to avoid repeated queries
 */
let cachedTargetStats = null;

async function renderTargetStatistics(pemasanganTypeId, perbaikanTypeId) {
    const targetContainer = document.getElementById('work-order-target-content');
    if (!targetContainer) return;

    try {
        const today = new Date().toISOString().split('T')[0];

        // Query for today's confirmed work orders
        const { data: todayWorkOrders } = await supabase
            .from('work_orders')
            .select('id, status, type_id, created_at, claimed_at, completed_at, registration_date')
            .gte('registration_date', today)
            .lte('registration_date', today + 'T23:59:59');

        // Calculate statistics
        const stats = {
            waiting: todayWorkOrders?.filter(wo => wo.status === 'waiting').length || 0,
            confirmed: todayWorkOrders?.filter(wo => wo.status === 'confirmed').length || 0,
            inProgress: todayWorkOrders?.filter(wo => wo.status === 'open').length || 0,
            completed: todayWorkOrders?.filter(wo => wo.status === 'closed').length || 0,
            leftOver: todayWorkOrders?.filter(wo => {
                // Leftover: confirmed on a previous day but not completed today
                const confirmedDate = new Date(wo.created_at).toISOString().split('T')[0];
                return wo.status !== 'closed' && confirmedDate < today;
            }).length || 0,
            pemasangan: todayWorkOrders?.filter(wo => wo.type_id === pemasanganTypeId).length || 0,
            perbaikan: todayWorkOrders?.filter(wo => wo.type_id === perbaikanTypeId).length || 0
        };

        // Cache the stats
        cachedTargetStats = stats;

        // Render statistics
        let html = `
            <div class="row g-2 mb-3">
                <div class="col-6">
                    <div class="p-2 rounded bg-vscode-input text-center">
                        <div class="small text-white-50">Menunggu</div>
                        <div class="fw-bold fs-5 text-warning">${stats.waiting}</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-2 rounded bg-vscode-input text-center">
                        <div class="small text-white-50">Diproses</div>
                        <div class="fw-bold fs-5 text-info">${stats.inProgress}</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-2 rounded bg-vscode-input text-center">
                        <div class="small text-white-50">Selesai</div>
                        <div class="fw-bold fs-5 text-success">${stats.completed}</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-2 rounded bg-opacity-10 text-center border border-danger border-opacity-25">
                        <div class="small text-danger">Leftover</div>
                        <div class="fw-bold fs-5 text-danger">${stats.leftOver}</div>
                    </div>
                </div>
            </div>
            <hr class="border-secondary">
            <div class="small text-white-50 fw-bold mb-2">Target Tipe Pekerjaan:</div>
            <div class="row g-2">
                <div class="col-6">
                    <div class="p-2 rounded bg-vscode-input text-center">
                        <div class="small">Pemasangan</div>
                        <div class="fw-bold text-primary">${stats.pemasangan}</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-2 rounded bg-vscode-input text-center">
                        <div class="small">Perbaikan</div>
                        <div class="fw-bold text-warning">${stats.perbaikan}</div>
                    </div>
                </div>
            </div>
        `;

        targetContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading target statistics:', error);
        targetContainer.innerHTML = '<div class="alert alert-danger alert-sm">Gagal memuat target</div>';
    }
}

/**
 * Helper to load and render data for a specific tab
 */
function loadDataForTab(typeId, container) {
    loadWorkOrders(container, typeId, (data) => {
        const filtered = getFilteredOrders(data, 'All', currentSearch);
        renderWorkOrders(filtered, 
            (wo) => showWorkOrderActions(wo),
            (wo) => showAssignConfirmPanel(wo),
            container
        );
    });
}

/**
 * Update display with current filter and search
 */
// This function is now replaced by loadDataForTab

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
        const activeTab = document.querySelector('#woTypeTabs .nav-link.active').id;
        const typeId = activeTab === 'pemasangan-tab' ? pemasanganTypeId : perbaikanTypeId;
        
        const container = activeTab === 'pemasangan-tab' 
            ? document.getElementById('work-orders-list-pemasangan') 
            : document.getElementById('work-orders-list-perbaikan');

        loadDataForTab(typeId, container);
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
        showWorkOrderModal(wo, () => {
            // Refresh the correct tab after editing
            const activeTab = document.querySelector('#woTypeTabs .nav-link.active').id;
            const typeId = wo.type_id; // Assuming wo object has type_id
            const container = activeTab === 'pemasangan-tab' 
                ? document.getElementById('work-orders-list-pemasangan') 
                : document.getElementById('work-orders-list-perbaikan');
            loadDataForTab(typeId, container);
        });
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
            // Refresh the correct tab
            const activeTab = document.querySelector('#woTypeTabs .nav-link.active').id;
            const typeId = wo.type_id;
            const container = activeTab === 'pemasangan-tab' 
                ? document.getElementById('work-orders-list-pemasangan') 
                : document.getElementById('work-orders-list-perbaikan');
            loadDataForTab(typeId, container);
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
            // Refresh the correct tab
            const activeTab = document.querySelector('#woTypeTabs .nav-link.active').id;
            const typeId = wo.type_id;
            const container = activeTab === 'pemasangan-tab' 
                ? document.getElementById('work-orders-list-pemasangan') 
                : document.getElementById('work-orders-list-perbaikan');
            loadDataForTab(typeId, container);
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
        }
    };
    // Note: modal.show() was already called at the top during loading phase
}
