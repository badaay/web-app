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
    renderWorkOrders(filtered, async (wo) => {
        // Show action menu for clicked row
        showWorkOrderActions(wo);
    });
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
