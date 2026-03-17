// Data loading and table rendering for work-orders
import { supabase } from '../../../api/supabase.js';
import { getSpinner } from '../../utils/ui-common.js';
import { getStatusColor, getStatusDisplayText } from './utils.js';

/**
 * Load all work orders from Supabase
 */
export async function loadWorkOrders(listContainer, onLoaded) {
    if (!listContainer) return;
    listContainer.innerHTML = getSpinner('Memuat Antrian...');

    const { data, error } = await supabase
        .from('work_orders')
        .select('*, customers(*), employees(name)')
        .order('created_at', { ascending: false });

    if (error) {
        listContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        return;
    }

    onLoaded(data);
}

/**
 * Render status summary as progress steps
 */
export function renderStatusSummary(allWorkOrders, currentFilter, onFilterChange) {
    const summaryContainer = document.getElementById('wo-status-summary');
    if (!summaryContainer) return;

    const counts = allWorkOrders.reduce((acc, wo) => {
        acc[wo.status] = (acc[wo.status] || 0) + 1;
        return acc;
    }, {});

    const statuses = ['waiting', 'confirmed', 'open', 'closed'];
    const total = allWorkOrders.length;

    // Create step-based progress flow
    const stepsHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3" style="flex-wrap: wrap;">
            <div class="d-flex align-items-center gap-2" style="flex-wrap: wrap;">
                <div class="text-muted small me-2">Status Flow:</div>
                ${statuses.map((s, idx) => `
                    <div class="d-inline-flex align-items-center">
                        <button class="badge p-2 border-0 wo-filter-badge ${currentFilter === s ? 'ring-active' : ''}"
                            style="background-color:${getStatusColor(s)};color:#fff;cursor:pointer;min-width:80px;"
                            data-filter="${s}"
                            title="Click to filter">
                            ${getStatusDisplayText(s)}<br><small>${counts[s] || 0}</small>
                        </button>
                        ${idx < statuses.length - 1 ? '<i class="bi bi-arrow-right text-muted mx-2"></i>' : ''}
                    </div>
                `).join('')}
            </div>
            <div class="ms-auto mt-2 mt-md-0">
                <button class="badge p-2 border-0 wo-filter-badge ${currentFilter === 'All' ? 'ring-active' : ''}"
                    style="background:var(--vscode-accent);color:#fff;cursor:pointer;min-width:80px;"
                    data-filter="All"
                    title="Show all">
                    <i class="bi bi-list me-1"></i>Semua<br><small>${total}</small>
                </button>
            </div>
        </div>
    `;

    summaryContainer.innerHTML = stepsHtml;

    summaryContainer.querySelectorAll('.wo-filter-badge').forEach(badge => {
        badge.onclick = () => {
            const f = badge.dataset.filter;
            onFilterChange(f === currentFilter && f !== 'All' ? 'All' : f);
        };
    });
}

/**
 * Render search input bar
 */
export function renderSearchBar(onSearch) {
    // Only inject search bar once
    if (document.getElementById('wo-search-bar')) return;

    const container = document.getElementById('work-orders-list');
    const searchWrapper = document.createElement('div');
    searchWrapper.id = 'wo-search-bar';
    searchWrapper.className = 'mb-3 d-flex gap-2 align-items-center';
    searchWrapper.innerHTML = `
        <div class="input-group input-group-sm" style="max-width:320px;">
            <span class="input-group-text bg-vscode-header border-0 text-white-50"><i class="bi bi-search"></i></span>
            <input id="wo-search-input" type="text" class="form-control" placeholder="Cari nama pelanggan, petugas, ket...">
        </div>
        <button class="btn btn-sm btn-outline-secondary" id="wo-clear-search"><i class="bi bi-x"></i></button>
    `;
    container.parentNode.insertBefore(searchWrapper, container);

    const searchInput = document.getElementById('wo-search-input');
    const clearBtn = document.getElementById('wo-clear-search');

    searchInput.addEventListener('input', (e) => onSearch(e.target.value.toLowerCase()));
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        onSearch('');
    });
}

/**
 * Filter work orders by status and search query
 */
export function getFilteredOrders(allWorkOrders, currentFilter, searchQuery) {
    let filtered = allWorkOrders;

    if (currentFilter !== 'All') {
        filtered = filtered.filter(wo => wo.status === currentFilter);
    }

    if (searchQuery) {
        filtered = filtered.filter(wo => {
            const name = wo.customers?.name?.toLowerCase() || '';
            const phone = wo.customers?.phone?.toLowerCase() || '';
            const emp = wo.employees?.name?.toLowerCase() || '';
            const ket = wo.ket?.toLowerCase() || '';
            return name.includes(searchQuery) || phone.includes(searchQuery) || 
                   emp.includes(searchQuery) || ket.includes(searchQuery);
        });
    }

    return filtered;
}

/**
 * Render work orders table with rows and actions
 */
export function renderWorkOrders(filteredOrders, onRowClick, onConfirmClick) {
    const tableContainer = document.getElementById('work-orders-list');
    if (!tableContainer) return;

    if (filteredOrders.length === 0) {
        tableContainer.innerHTML = '<div class="alert alert-info mt-3">Tidak ada antrian yang cocok.</div>';
        return;
    }

    const tableHtml = `
        <div class="table-responsive mt-3">
            <table class="table table-dark table-hover align-middle">
                <thead class="table-secondary">
                    <tr>
                        <th style="width: 100px;">Tgl Daftar</th>
                        <th style="width: 150px;">Pelanggan</th>
                        <th style="width: 100px;">No HP</th>
                        <th style="width: 80px;">Tipe</th>
                        <th style="width: 100px;">Status</th>
                        <th style="width: 120px;">Teknisi</th>
                        <th style="width: 150px;">Keterangan</th>
                        <th style="width: 80px;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredOrders.map(wo => `
                        <tr>
                            <td><small>${wo.registration_date || '-'}</small></td>
                            <td><strong>${wo.customers?.name || '-'}</strong></td>
                            <td><small>${wo.customers?.phone || '-'}</small></td>
                            <td><span class="badge bg-dark">${wo.title?.substring(0, 10) || 'PSB'}</span></td>
                            <td>
                                <span class="badge" style="background-color:${getStatusColor(wo.status)};color:#fff;font-weight:600;">
                                    <i class="bi bi-circle-fill me-1" style="font-size:0.6em;"></i>
                                    ${getStatusDisplayText(wo.status)}
                                </span>
                            </td>
                            <td><small>${wo.employees?.name || 'Belum ditugaskan'}</small></td>
                            <td><small>${wo.ket?.substring(0, 15) || wo.payment_status || '-'}</small></td>
                            <td>
                                ${wo.status === 'waiting' ? `
                                    <button class="btn btn-sm btn-success assign-confirm-wo" data-id="${wo.id}" title="Konfirmasi & Tugaskan">
                                        Konfirmasi
                                    </button>
                                ` : `
                                    <button class="btn btn-sm btn-primary view-wo-details-btn" data-id="${wo.id}" title="Lihat Aksi">
                                        <i class="bi bi-three-dots"></i>
                                    </button>
                                `}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    tableContainer.innerHTML = tableHtml;

    // Wire up action buttons for non-waiting rows
    tableContainer.querySelectorAll('.view-wo-details-btn').forEach(btn => {
        btn.onclick = () => {
            const woId = btn.dataset.id;
            const wo = filteredOrders.find(w => w.id === woId);
            if (onRowClick) onRowClick(wo);
        };
    });

    // Wire up "Konfirmasi" buttons for waiting rows
    tableContainer.querySelectorAll('.assign-confirm-wo').forEach(btn => {
        btn.onclick = () => {
            const woId = btn.dataset.id;
            const wo = filteredOrders.find(w => w.id === woId);
            if (onConfirmClick) onConfirmClick(wo);
        };
    });
}
