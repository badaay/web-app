// Data loading and table rendering for work-orders
import { supabase } from '../../../api/supabase.js';
import { getSpinner } from '../../utils/ui-common.js';
import { getStatusColor, getStatusDisplayText } from './utils.js';

/**
 * Load all work orders from Supabase
 */
export async function loadWorkOrders(listContainer, typeId, onLoaded) {
    if (!listContainer) return;
    listContainer.innerHTML = getSpinner('Memuat Antrian...');

    let query = supabase
        .from('work_orders')
        .select(`
            id, title, status, created_at, registration_date, ket, customer_id, employee_id, type_id, claimed_by, claimed_at, completed_at,
            customers(id, name, phone, address, lat, lng, packet),
            master_queue_types(id, name, color, icon, base_point),
            work_order_assignments(id, assignment_role, employee_id, employees(id, name))
        `)
        .order('created_at', { ascending: true });

    // If typeId is passed, apply filter, otherwise fetch all types
    if (typeId) {
        query = query.eq('type_id', typeId);
    }

    const { data, error } = await query;

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

    const searchBarContainer = document.getElementById('wo-search-bar-container');
    if (!searchBarContainer) return; // If no container, skip search bar
    
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
    searchBarContainer.appendChild(searchWrapper);

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
export function renderWorkOrders(filteredOrders, onRowClick, onConfirmClick, tableContainer) {
    if (!tableContainer) return;

    if (!document.getElementById('kanban-pro-max-styles')) {
        const style = document.createElement('style');
        style.id = 'kanban-pro-max-styles';
        style.innerHTML = `
            .kanban-pro-col {
                background: linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.1) 100%);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 16px;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
            }
            .kanban-pro-card {
                background: rgba(30, 41, 59, 0.6) !important;
                backdrop-filter: blur(12px) !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                border-radius: 14px !important;
                padding: 14px !important;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important;
                position: relative;
                overflow: hidden;
            }
            .kanban-pro-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; height: 3px;
                background: linear-gradient(90deg, #0047AB, #14b8a6);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .kanban-pro-card:hover {
                transform: translateY(-4px) scale(1.02) !important;
                box-shadow: 0 12px 30px -8px rgba(0, 71, 171, 0.4) !important;
                border-color: rgba(20, 184, 166, 0.3) !important;
                background: rgba(30, 41, 59, 0.8) !important;
            }
            .kanban-pro-card:hover::before {
                opacity: 1;
            }
            .tech-gradient-badge {
                background: linear-gradient(135deg, #0047AB 0%, #14b8a6 100%);
                color: #fff;
                box-shadow: 0 4px 12px -3px rgba(20, 184, 166, 0.4);
                border: none;
            }
            .wo-time-pro {
                font-size: 0.72rem;
                color: #94a3b8;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .wo-status-pro {
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 0.65rem;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .kanban-scroll::-webkit-scrollbar {
                height: 6px;
                width: 6px;
            }
            .kanban-scroll::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.1);
                border-radius: 10px;
            }
            .kanban-scroll::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }
            .kanban-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(20, 184, 166, 0.5);
            }
            .glass-header-pro {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.05);
                border-radius: 12px;
                padding: 12px 16px;
                margin-bottom: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    const heroContainer = document.getElementById('wo-active-hero-section');
    if (heroContainer) heroContainer.innerHTML = '';

    if (filteredOrders.length === 0) {
        tableContainer.innerHTML = '<div class="alert alert-info mt-3">Tidak ada antrian yang cocok.</div>';
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const progressOrders = filteredOrders.filter(wo => ['confirmed', 'open', 'pending'].includes(wo.status));
    const todayOrders = progressOrders.filter(wo => new Date(wo.created_at).toISOString().split('T')[0] >= todayStr);
    const leftoverOrders = progressOrders.filter(wo => new Date(wo.created_at).toISOString().split('T')[0] < todayStr);

    const typeMapping = window.woTypeMapping || {};
    const types = [
        { id: typeMapping.pemasanganId, name: 'Pemasangan', color: '#0ea5e9' }, // Cyan/Blue
        { id: typeMapping.perbaikanId, name: 'Perbaikan', color: '#f59e0b' } // Amber/Orange
    ];

    const mainKanbanColumns = [
        { id: 'waiting', title: '🟡 Menunggu', statuses: ['waiting'], width: '320px' },
        { id: 'progress', title: '🔵 Diproses', statuses: ['confirmed', 'open', 'pending'], width: '320px' },
        { id: 'issues', title: '🔴 Kendala', statuses: ['odp_full', 'cancelled', 'kendala'], width: '320px' },
        { id: 'closed', title: '🟢 Selesai', statuses: ['closed'], width: '320px' }
    ];

    const createCardHtml = (wo) => `
        <div class="card kanban-pro-card mb-3 text-start" style="border-left: 3px solid ${wo.master_queue_types?.color || '#334155'} !important;">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="wo-status-pro shadow-sm" style="background-color:${getStatusColor(wo.status)}30; color: ${getStatusColor(wo.status)}; border-color: ${getStatusColor(wo.status)}60;">
                    ${getStatusDisplayText(wo.status)}
                </span>
                <span class="wo-time-pro"><i class="bi bi-clock"></i> ${formatTimeAgo(wo.created_at)}</span>
            </div>
            
            <div class="fw-bold mb-1 mt-2" style="font-size:1.05rem; color: #f8fafc; letter-spacing: -0.2px;">${wo.customers?.name || '-'}</div>
            <div class="small mb-2" style="color: #cbd5e1;"><i class="bi bi-telephone text-primary me-2"></i>${wo.customers?.phone || '-'}</div>
            
            <div class="small mb-3 lh-sm" style="font-size:0.85rem; color: #94a3b8; border-left: 2px solid #334155; padding-left: 10px; margin-top: 8px;">
                ${wo.ket?.substring(0, 60) || wo.master_queue_types?.name || 'PSB'}${wo.ket?.length > 60 ? '...' : ''}
            </div>
            
            <div class="d-flex justify-content-between align-items-end mt-auto pt-3 border-top" style="border-color: rgba(255,255,255,0.05) !important;">
                <div class="small px-3 py-1 rounded-pill ${wo.work_order_assignments?.length ? 'tech-gradient-badge' : 'bg-dark text-warning border border-warning border-opacity-25'}" style="font-weight: 600; font-size: 0.75rem;">
                    <i class="bi bi-person-fill me-1"></i>${(() => {
                        const assignments = wo.work_order_assignments || [];
                        const lead = assignments.find(a => a.assignment_role === 'lead')?.employees?.name;
                        const members = assignments.filter(a => a.assignment_role === 'member').map(a => a.employees?.name);
                        if (!lead && members.length === 0) return 'Belum Ditugaskan';
                        let display = lead || members[0] || 'Tim Teknisi';
                        if (members.length > 0 && lead) display += ` <span class="badge bg-white text-dark ms-1 shadow-sm rounded-circle px-1">+${members.length}</span>`;
                        else if (members.length > 1 && !lead) display += ` <span class="badge bg-white text-dark ms-1 shadow-sm rounded-circle px-1">+${members.length - 1}</span>`;
                        return display;
                    })()}
                </div>
                <div>
                    ${wo.status === 'waiting' ? `
                        <button class="btn btn-sm btn-success rounded-circle shadow assign-confirm-wo d-flex justify-content-center align-items-center" data-id="${wo.id}" title="Konfirmasi & Tugaskan" style="width:32px; height:32px; padding:0;">
                            <i class="bi bi-check-lg"></i>
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline-light rounded-circle view-wo-details-btn d-flex justify-content-center align-items-center" data-id="${wo.id}" title="Lihat Aksi" style="width:32px; height:32px; padding:0; border-color: rgba(255,255,255,0.2);">
                            <i class="bi bi-three-dots"></i>
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;

    // 1. RENDER HERO SECTION (Progress tasks pulled out entirely)
    if (heroContainer) {
        heroContainer.innerHTML = `
            <div class="row g-4 mb-2">
                <div class="col-md-6">
                    <div class="kanban-pro-col overflow-hidden" style="border-top: 4px solid #0047AB; background: linear-gradient(180deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.2) 100%); border-color: rgba(14, 165, 233, 0.3);">
                        <div class="glass-header-pro d-flex justify-content-between align-items-center mb-0 border-0 border-bottom border-secondary border-opacity-25" style="background:transparent;">
                            <span class="fw-bold text-white fs-6">
                                <i class="bi bi-calendar2-day text-info me-2"></i>Tugas Aktif Hari Ini
                            </span>
                            <span class="badge bg-primary rounded-pill px-3 py-2 shadow-sm">${todayOrders.length}</span>
                        </div>
                        <div class="p-3 kanban-scroll" style="max-height: 400px; overflow-y: auto;">
                            ${todayOrders.length === 0 ? '<div class="text-center p-4 small text-muted border border-secondary border-opacity-25 rounded" style="border-style: dashed !important;">Tidak ada antrian hari ini.</div>' : todayOrders.map(createCardHtml).join('')}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="kanban-pro-col overflow-hidden" style="border-top: 4px solid #f43f5e; background: linear-gradient(180deg, rgba(244, 63, 94, 0.1) 0%, rgba(15, 23, 42, 0.2) 100%); border-color: rgba(244, 63, 94, 0.3);">
                        <div class="glass-header-pro d-flex justify-content-between align-items-center mb-0 border-0 border-bottom border-secondary border-opacity-25" style="background:transparent;">
                            <span class="fw-bold text-white fs-6">
                                <i class="bi bi-exclamation-triangle text-danger me-2"></i>Sisa Kemarin (Outstanding)
                            </span>
                            <span class="badge bg-danger rounded-pill px-3 py-2 shadow-sm">${leftoverOrders.length}</span>
                        </div>
                        <div class="p-3 kanban-scroll" style="max-height: 400px; overflow-y: auto;">
                            ${leftoverOrders.length === 0 ? '<div class="text-center p-4 small text-muted border border-secondary border-opacity-25 rounded" style="border-style: dashed !important;">Bersih! Tidak ada penumpukan.</div>' : leftoverOrders.map(createCardHtml).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 2. RENDER MAIN KANBAN WITH HORIZONTAL SWIPING AND SWIMLANES
    let kanbanHtml = `
        <h5 class="text-white mb-3 fw-bold mt-2" style="letter-spacing: -0.5px;">
            <i class="bi bi-kanban text-secondary me-2"></i>Antrian Keseluruhan (Swimlanes)
        </h5>
        <div class="d-flex flex-nowrap overflow-x-auto pb-4 gap-4 kanban-scroll" style="min-height: 50vh; snap-type: x mandatory;">
    `;

    mainKanbanColumns.forEach(col => {
        // Only include "closed" if they were closed today to avoid endless list
        let colOrders = filteredOrders.filter(wo => col.statuses.includes(wo.status));
        if (col.id === 'closed') {
            colOrders = colOrders.filter(wo => new Date(wo.completed_at || wo.created_at).toISOString().split('T')[0] === todayStr);
        }

        kanbanHtml += `
            <div class="kanban-pro-col d-flex flex-column" style="min-width: 320px; flex-shrink: 0; border-top: 4px solid ${getStatusColor(col.statuses[0])}; snap-align: start;">
                <div class="glass-header-pro d-flex justify-content-between align-items-center border-0 border-bottom border-secondary border-opacity-25 rounded-0 mb-0" style="background:transparent; padding: 12px 0;">
                    <span class="fw-bold text-white fs-6" style="letter-spacing: -0.5px;">${col.title}</span>
                    <span class="badge bg-secondary rounded-pill px-3 py-1 shadow-sm opacity-75">${colOrders.length}</span>
                </div>
                
                <div class="kanban-scroll flex-grow-1" style="max-height: 60vh; overflow-y: auto; padding-right: 4px; padding-top: 10px;">
        `;
        
        if (colOrders.length === 0) {
            kanbanHtml += '<div class="text-center p-4 mt-2 small text-muted border border-secondary border-opacity-25 rounded" style="border-style: dashed !important;">Kosong</div>';
        } else {
            // Render Swimlanes vertically inside the column
            types.forEach(type => {
                const typeOrders = colOrders.filter(wo => wo.type_id === type.id || (!type.id && type.name === 'Lainnya'));
                if (typeOrders.length > 0) {
                    kanbanHtml += `
                        <div class="swimlane-header text-uppercase small fw-bold mb-2 mt-3 ps-2 border-start" style="border-color: ${type.color} !important; color: ${type.color}; letter-spacing: 1px;">
                            ${type.name} <span class="opacity-50 ms-1">(${typeOrders.length})</span>
                        </div>
                    `;
                    kanbanHtml += typeOrders.map(createCardHtml).join('');
                }
            });
        }
        
        kanbanHtml += `
                </div>
            </div>
        `;
    });

    kanbanHtml += '</div>';
    tableContainer.innerHTML = kanbanHtml;

    // 3. WIRE UP EVENTS FOR EVERYTHING (Hero + Main Board)
    const attachEvents = (parentEl) => {
        if (!parentEl) return;
        
        parentEl.querySelectorAll('.view-wo-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent bubbling issues
                const woId = btn.dataset.id;
                const wo = filteredOrders.find(w => w.id === woId);
                if (onRowClick) onRowClick(wo);
            });
        });

        parentEl.querySelectorAll('.assign-confirm-wo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const woId = btn.dataset.id;
                const wo = filteredOrders.find(w => w.id === woId);
                if (onConfirmClick) onConfirmClick(wo);
            });
        });
    };

    attachEvents(heroContainer);
    attachEvents(tableContainer);
}

function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}
