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
        .select('*, customers(*), work_order_assignments(assignment_role, employees(name))')
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

    // Simplified Summary implementation for Kanban
    const stepsHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div><h5 class="m-0 text-white"><i class="bi bi-kanban"></i> Status Antrian</h5></div>
            <div class="ms-auto mt-2 mt-md-0">
                <button class="badge p-2 border-0 wo-filter-badge ${currentFilter === 'All' ? 'ring-active' : ''}"
                    style="background:var(--vscode-accent);color:#fff;cursor:pointer;min-width:80px;"
                    data-filter="All"
                    title="Show all">
                    <i class="bi bi-list me-1"></i>Reset Filter<br><small>${total}</small>
                </button>
            </div>
        </div>
    `;

    // summaryContainer.innerHTML = stepsHtml;

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

    const columns = [
        { id: 'waiting', title: '🟡 Menunggu', statuses: ['waiting'], width: '300px' },
        { id: 'progress', title: '🔵 Diproses', statuses: ['confirmed', 'open', 'pending'], width: '300px' },
        { id: 'closed', title: '🟢 Selesai', statuses: ['closed'], width: '300px' },
        { id: 'issues', title: '🔴 Kendala/Batal', statuses: ['odp_full', 'cancelled'], width: '300px' }
    ];

    let kanbanHtml = '<div class="d-flex flex-nowrap overflow-x-auto pb-3 gap-3" style="min-height: 60vh;">';

    columns.forEach(col => {
        const colOrders = filteredOrders.filter(wo => col.statuses.includes(wo.status));
        
        kanbanHtml += `
            <div class="d-flex flex-column" style="min-width: ${col.width}; flex-shrink: 0;">
                <div class="d-flex justify-content-between align-items-center mb-2 px-2 py-1 rounded" style="background-color: var(--vscode-header-bg); border-top: 3px solid ${getStatusColor(col.statuses[0])};">
                    <span class="fw-bold" style="color: var(--vscode-text-bright);">${col.title}</span>
                    <span class="badge bg-secondary rounded-pill">${colOrders.length}</span>
                </div>
                <div class="d-flex flex-column gap-2 flex-grow-1">
                    ${colOrders.length === 0 ? '<div class="text-center p-3 small border border-secondary rounded border-dashed" style="border-style: dashed !important; color: var(--vscode-text);">Kosong</div>' : ''}
                    ${colOrders.map(wo => `
                        <div class="card border-secondary shadow-sm text-start position-relative" style="background-color: var(--vscode-bg); color: var(--vscode-text);">
                            <div class="card-body p-2 position-relative">
                                <div class="d-flex justify-content-between align-items-start mb-1">
                                    <span class="badge" style="background-color:${getStatusColor(wo.status)}; color:#fff; font-size:0.65rem;">
                                        ${getStatusDisplayText(wo.status)}
                                    </span>
                                    <small style="font-size:0.65rem; color: var(--vscode-text);">${wo.registration_date || '-'}</small>
                                </div>
                                
                                <div class="fw-bold mb-1" style="font-size:0.9rem; color: var(--vscode-text-bright);">${wo.customers?.name || '-'}</div>
                                <div class="small text-info mb-1"><i class="bi bi-telephone me-1"></i>${wo.customers?.phone || '-'}</div>
                                <div class="small mb-2 lh-sm" style="font-size:0.8rem; color: var(--vscode-text);">${wo.ket?.substring(0, 40) || 'Pemasangan Baru (PSB)'}${wo.ket?.length > 40 ? '...' : ''}</div>
                                
                                <div class="d-flex justify-content-between align-items-center mt-2 border-top border-secondary pt-2">
                                    <div class="small" style="color: ${wo.work_order_assignments?.length ? 'var(--vscode-text-bright)' : 'var(--vscode-warning)'}">
                                        <i class="bi bi-person me-1"></i>${(() => {
                                            const assignments = wo.work_order_assignments || [];
                                            const lead = assignments.find(a => a.assignment_role === 'lead')?.employees?.name;
                                            const members = assignments.filter(a => a.assignment_role === 'member').map(a => a.employees?.name);
                                            if (!lead && members.length === 0) return 'Belum Ditugaskan';
                                            let display = lead || members[0] || 'Tim Teknisi';
                                            if (members.length > 0 && lead) display += ` <span class="badge bg-secondary ms-1 shadow-sm">+${members.length}</span>`;
                                            else if (members.length > 1 && !lead) display += ` <span class="badge bg-secondary ms-1 shadow-sm">+${members.length - 1}</span>`;
                                            return display;
                                        })()}
                                    </div>
                                    <div>
                                        ${wo.status === 'waiting' ? `
                                            <button class="btn btn-sm btn-success assign-confirm-wo py-0 px-2" data-id="${wo.id}" title="Konfirmasi & Tugaskan" style="font-size:0.75rem;">
                                                <i class="bi bi-check2"></i>
                                            </button>
                                        ` : `
                                            <button class="btn btn-sm btn-primary view-wo-details-btn py-0 px-2" data-id="${wo.id}" title="Lihat Aksi" style="font-size:0.75rem;">
                                                <i class="bi bi-three-dots"></i>
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    kanbanHtml += '</div>';
    tableContainer.innerHTML = kanbanHtml;

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
