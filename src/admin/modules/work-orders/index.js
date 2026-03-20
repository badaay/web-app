// Main orchestrator for work-orders module
import { supabase } from '../../../api/supabase.js';
import { showToast } from '../../utils/toast.js';
import { loadWorkOrders, renderStatusSummary, renderSearchBar, getFilteredOrders, renderWorkOrders } from './list.js';
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

        // 1. Update work order status to 'confirmed' (+ optional employee assignment)
        const updatePayload = { status: 'confirmed' };
        if (selectedEmployeeId) updatePayload.employee_id = selectedEmployeeId;

        const { error: updateError } = await supabase
            .from('work_orders')
            .update(updatePayload)
            .eq('id', wo.id);

        if (updateError) {
            showToast(`Error: ${updateError.message}`, 'error');
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Simpan';
            return;
        }

        // 2. Create initial installation monitoring record
        const { error: monitorError } = await supabase
            .from('installation_monitorings')
            .insert({
                work_order_id: wo.id,
                employee_id: selectedEmployeeId,
                notes: 'Work order dikonfirmasi oleh admin.'
            });
        
        if (monitorError) {
            showToast(`Work order dikonfirmasi, tapi gagal membuat log monitoring: ${monitorError.message}`, 'warning');
        } else {
            showToast('Work order berhasil dikonfirmasi.', 'success');
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

    body.innerHTML = `
        <div class="text-center">
            <p class="mb-3">
                <strong>${wo.customers?.name || '-'}</strong><br>
                <small class="text-muted">${wo.title || 'PSB'}</small>
            </p>
            <div class="d-grid gap-2">
                <button class="btn btn-primary" id="action-edit-wo">
                    <i class="bi bi-pencil"></i> Edit Antrian
                </button>
                <button class="btn btn-info" id="action-monitor-wo">
                    <i class="bi bi-graph-up"></i> Pantau Instalasi
                </button>
                <button class="btn btn-warning" id="action-close-wo">
                    <i class="bi bi-check-circle"></i> Tutup Antrian
                </button>
                <button class="btn btn-danger" id="action-delete-wo">
                    <i class="bi bi-trash"></i> Hapus Antrian
                </button>
            </div>
        </div>
    `;

    document.getElementById('crudModalTitle').textContent = 'Aksi Antrian';
    document.getElementById('save-crud-btn').style.display = 'none';

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
        // Mark as closed and record close time
        const { error } = await supabase.from('work_orders')
            .update({ status: 'closed', closed_at: new Date().toISOString() })
            .eq('id', wo.id);

        if (error) {
            showToast(`Error: ${error.message}`, 'error');
            return;
        }

        showToast('Antrian berhasil ditutup', 'success');
        modal.hide();
        location.reload();
    };

    document.getElementById('action-delete-wo').onclick = async () => {
        if (!confirm('Yakin ingin menghapus antrian ini?')) return;

        const { error } = await supabase.from('work_orders').delete().eq('id', wo.id);

        if (error) {
            showToast(`Error: ${error.message}`, 'error');
            return;
        }

        showToast('Antrian berhasil dihapus', 'success');
        modal.hide();
        location.reload();
    };

    modal.show();
}
