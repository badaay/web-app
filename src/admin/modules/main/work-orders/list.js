// Data loading and table rendering for work-orders
import { supabase } from '../../../../api/supabase.js';
import { getSpinner, copyItemCode } from '../../../utils/ui-common.js';
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
            id, title, status, created_at, registration_date, ket, customer_id, employee_id, type_id, claimed_by, claimed_at, completed_at, item_code,
            customers(id, name, phone, address, lat, lng, packet),
            master_queue_types(id, name, color, icon, base_point, short_code),
            work_order_assignments(id, assignment_role, employee_id, points_earned, bonus_points, deduction_points, adjustment_reason, employees(id, name))
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

    const statuses = ['waiting', 'confirmed', 'open', 'completed', 'closed'];
    const total = allWorkOrders.length;

    // Simplified Summary implementation for Kanban
    const stepsHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-3">
                <h5 class="m-0 text-white"><i class="bi bi-kanban"></i> Status Antrian</h5>
                <div id="wo-live-clock" class="font-mono px-3 py-1 bg-dark border border-secondary text-success" style="font-size: 1.1rem; letter-spacing: 1px;">
                    00:00:00
                </div>
            </div>
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

    summaryContainer.innerHTML = stepsHtml;

    // Start clock interval
    if (window.woClockInterval) clearInterval(window.woClockInterval);
    const updateClock = () => {
        const clockEl = document.getElementById('wo-live-clock');
        if (!clockEl) return;
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        };
        clockEl.textContent = now.toLocaleString('id-ID', options).replace(/\./g, ':');
    };
    updateClock();
    window.woClockInterval = setInterval(updateClock, 1000);

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
    searchWrapper.className = 'mb-4';
    searchWrapper.innerHTML = `
        <div class="d-flex align-items-center gap-2 p-1 bg-dark bg-opacity-50 rounded-pill border border-secondary border-opacity-25 shadow-sm" style="max-width: 400px; transition: all 0.3s ease;">
            <div class="ps-3 text-white-50">
                <i class="bi bi-search"></i>
            </div>
            <input id="wo-search-input" type="text" 
                class="form-control form-control-sm border-0 bg-transparent text-white shadow-none py-2" 
                placeholder="Cari pelanggan, teknisi, keterangan, atau kode item..."
                style="font-size: 0.9rem;">
            <button class="btn btn-link btn-sm text-white-50 p-2 me-1 hover-scale d-none" id="wo-clear-search">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <style>
            #wo-search-bar input::placeholder { color: rgba(255,255,255,0.3); }
            #wo-search-bar > div:focus-within {
                border-color: var(--vscode-accent) !important;
                background: rgba(0,0,0,0.7) !important;
                box-shadow: 0 0 0 3px rgba(0, 71, 171, 0.2) !important;
            }
        </style>
    `;
    searchBarContainer.appendChild(searchWrapper);

    const searchInput = document.getElementById('wo-search-input');
    const clearBtn = document.getElementById('wo-clear-search');

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val) clearBtn.classList.remove('d-none');
        else clearBtn.classList.add('d-none');
        onSearch(val.toLowerCase());
    });
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.add('d-none');
        onSearch('');
        searchInput.focus();
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
            const itemCode = wo.item_code?.toLowerCase() || '';
            return name.includes(searchQuery) || phone.includes(searchQuery) ||
                   emp.includes(searchQuery) || ket.includes(searchQuery) || itemCode.includes(searchQuery);
        });
    }

    return filtered;
}

/**
 * Render work orders table with rows and actions
 */
export function renderWorkOrders(filteredOrders, onRowClick, onConfirmClick, tableContainer) {
    if (!tableContainer) return;

    if (filteredOrders.length === 0) {
        tableContainer.innerHTML = '<div class="alert alert-info mt-3">Tidak ada antrian yang cocok.</div>';
        return;
    }

    const typeMapping = window.woTypeMapping || {};
    const types = [
        { id: typeMapping.pemasanganId, name: 'Pemasangan', color: 'var(--tech-accent-teal)' },
        { id: typeMapping.perbaikanId, name: 'Perbaikan', color: 'var(--tech-accent-warn)' }
    ];

    const mainKanbanColumns = [
        { id: 'waiting', title: '🟡 Menunggu', statuses: ['waiting'], width: '320px' },
        { id: 'progress', title: '🔵 Diproses', statuses: ['confirmed', 'open', 'pending'], width: '320px' },
        { id: 'completed', title: '🟠 Verifikasi', statuses: ['completed'], width: '320px' },
        { id: 'issues', title: '🔴 Kendala', statuses: ['odp_full', 'cancelled', 'kendala'], width: '320px' }
    ];

    const createCardHtml = (wo) => {
        const assignments = wo.work_order_assignments || [];
        const lead = assignments.find(a => a.assignment_role === 'lead')?.employees?.name || '??';
        const leadInitial = lead.substring(0, 2).toUpperCase();
        
        const queueColor = wo.master_queue_types?.color || 'var(--tech-border)';
        const queueIcon = wo.master_queue_types?.icon || 'bi-ticket';

        return `
        <div class="ticket-card mb-0" data-id="${wo.id}" style="border-left: 4px solid ${queueColor};">
            <span class="ticket-id font-mono">
                ${wo.item_code || `WO-${wo.id.substring(0, 4)}`} | ${formatTimeAgo(wo.created_at)}
            </span>
            
            <h3 class="ticket-title">${wo.customers?.name || 'Unnamed Client'}</h3>
            
            <div class="small mb-3 text-muted font-mono" style="font-size: 0.7rem;">
                <i class="bi bi-geo-alt me-1"></i>${wo.customers?.address?.substring(0, 40) || 'No Address'}...
            </div>

            <div class="ticket-footer">
                <span class="ticket-tag" style="background: ${queueColor}20; color: ${queueColor}; border-color: ${queueColor}40;">
                    <i class="bi ${queueIcon} me-1"></i>${wo.master_queue_types?.short_code || 'PSB'}
                </span>
                <div class="square-avatar" title="${lead}">${leadInitial}</div>
                <span class="wo-time-pro"><i class="bi bi-clock"></i> ${formatTimeAgo(wo.created_at)}</span>
            </div>
            
            <div class="fw-bold mb-1 mt-2" style="font-size:1.05rem; color: #f8fafc; letter-spacing: -0.2px;">${wo.customers?.name || '-'}</div>
            <div class="small mb-2" style="color: #cbd5e1;"><i class="bi bi-telephone text-primary me-2"></i>${wo.customers?.phone || '-'}</div>
            
            <div class="small mb-3 lh-sm" style="font-size:0.85rem; color: #94a3b8; border-left: 2px solid #334155; padding-left: 10px; margin-top: 8px;">
                ${wo.ket?.substring(0, 60) || wo.master_queue_types?.name || 'PSB'}${wo.ket?.length > 60 ? '...' : ''}
            </div>
            
            ${(['closed', 'completed'].includes(wo.status)) ? (() => {
                const assignments = wo.work_order_assignments || [];
                const basePoints = wo.master_queue_types?.base_point || 0;
                const totalPoints = assignments.reduce((sum, a) => {
                    const isLead = a.assignment_role === 'lead';
                    const baseCalc = isLead ? basePoints : Math.floor(basePoints * 0.7);
                    const finalPts = a.points_earned || Math.max(0, baseCalc + (a.bonus_points || 0) - (a.deduction_points || 0));
                    return sum + finalPts;
                }, 0);
                
                const detailsHtml = assignments.map(a => {
                    const isLead = a.assignment_role === 'lead';
                    const baseCalc = isLead ? basePoints : Math.floor(basePoints * 0.7);
                    const bonus = a.bonus_points || 0;
                    const deduction = a.deduction_points || 0;
                    const finalPts = a.points_earned || Math.max(0, baseCalc + bonus - deduction);

                    return `
                        <div class="hud-math-grid mt-1 mb-2 p-2 rounded" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.05);">
                            <div class="fw-bold mb-1" style="font-size: 0.75rem; color: #14b8a6;">${a.employees?.name} <span class="badge bg-secondary ms-1" style="font-size: 0.55rem;">${a.assignment_role.toUpperCase()}</span></div>
                            <div class="hud-math-row" style="font-size: 0.7rem;">
                                <span class="hud-label">Base</span>
                                <span class="hud-value">${baseCalc}</span>
                            </div>
                            ${bonus > 0 ? `
                            <div class="hud-math-row hud-bonus" style="font-size: 0.7rem;">
                                <span class="hud-label">Bonus</span>
                                <span class="hud-value hud-positive">+${bonus}</span>
                            </div>` : ''}
                            ${deduction > 0 ? `
                            <div class="hud-math-row hud-deduction" style="font-size: 0.7rem;">
                                <span class="hud-label">Potongan</span>
                                <span class="hud-value hud-negative">-${deduction}</span>
                            </div>` : ''}
                            <div class="hud-math-row hud-total mt-1 pt-1" style="font-size: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.1);">
                                <span class="hud-label">Total</span>
                                <span class="hud-value fw-bold" style="color: #14b8a6;">${finalPts} pts</span>
                            </div>
                        </div>
                    `;
                }).join('');

                const accordionId = 'acc-' + wo.id;

                return `
                <div class="accordion accordion-flush mb-2" id="accordion-${accordionId}">
                    <div class="accordion-item" style="background: transparent; border: none;">
                        <h2 class="accordion-header" id="heading-${accordionId}">
                            <button class="accordion-button collapsed px-2 py-2 rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${accordionId}" style="background: rgba(20, 184, 166, 0.1); border: 1px solid rgba(20, 184, 166, 0.25); box-shadow: none;">
                                <div class="d-flex w-100 justify-content-between align-items-center me-2">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="bi bi-gem" style="color: #14b8a6; font-size: 0.8rem;"></i>
                                        <span class="text-white-50" style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace;">EARNED:</span>
                                    </div>
                                    <div class="fw-bold" style="color: #14b8a6; font-family: 'JetBrains Mono', monospace; font-size: 0.95rem;">
                                        ${totalPoints} <span class="text-white-50" style="font-size: 0.65rem;">pts</span>
                                    </div>
                                </div>
                            </button>
                        </h2>
                        <div id="collapse-${accordionId}" class="accordion-collapse collapse" data-bs-parent="#accordion-${accordionId}">
                            <div class="accordion-body px-0 py-1" onclick="event.stopPropagation()">
                                ${detailsHtml}
                            </div>
                        </div>
                    </div>
                </div>
                <style>
                    #accordion-${accordionId} .accordion-button::after {
                        filter: invert(72%) sepia(86%) saturate(366%) hue-rotate(125deg) brightness(91%) contrast(85%); /* Approx #14b8a6 */
                        transform: scale(0.8);
                        margin-left: auto;
                    }
                    #accordion-${accordionId} .accordion-button:not(.collapsed)::after {
                        filter: invert(72%) sepia(86%) saturate(366%) hue-rotate(125deg) brightness(91%) contrast(85%);
                    }
                    #accordion-${accordionId} .accordion-button {
                        padding-right: 0.5rem !important;
                    }
                </style>
                `;
            })() : ''}
            
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
                    ` : wo.status === 'completed' ? `
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-success rounded-circle shadow verify-wo-btn d-flex justify-content-center align-items-center" data-id="${wo.id}" title="Verifikasi & Selesai" style="width:32px; height:32px; padding:0;">
                                <i class="bi bi-shield-check"></i>
                            </button>
                            <button class="btn btn-sm btn-warning rounded-circle shadow revision-wo-btn d-flex justify-content-center align-items-center" data-id="${wo.id}" title="Request Revision" style="width:32px; height:32px; padding:0;">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-light rounded-circle view-wo-details-btn d-flex justify-content-center align-items-center" data-id="${wo.id}" title="Detail" style="width:32px; height:32px; padding:0; border-color: rgba(255,255,255,0.2);">
                                <i class="bi bi-three-dots"></i>
                            </button>
                        </div>
                    ` : `
                        <button class="btn btn-sm btn-outline-light rounded-circle view-wo-details-btn d-flex justify-content-center align-items-center" data-id="${wo.id}" title="Lihat Aksi" style="width:32px; height:32px; padding:0; border-color: rgba(255,255,255,0.2);">
                            <i class="bi bi-three-dots"></i>
                        </button>
                    `}
                </div>
            </div>
        </div>
        `;
    };

    // 1. RENDER MAIN KANBAN
    let kanbanHtml = `
        <div class="kanban-wrapper precision-scroll">
    `;

    mainKanbanColumns.forEach(col => {
        const colOrders = filteredOrders.filter(wo => col.statuses.includes(wo.status));

        kanbanHtml += `
            <div class="kanban-col ${col.class}">
                <div class="kanban-col-header">
                    <span class="label font-mono" style="color: var(--text-main);">${col.title}</span>
                    <div class="badge-count font-mono" style="background: var(--tech-element); padding: 2px 8px; border: 1px solid var(--tech-border);">${colOrders.length}</div>
                </div>
                <div class="kanban-col-body precision-scroll">
        `;
        
        if (colOrders.length === 0) {
            kanbanHtml += '<div class="text-center p-4 small text-muted font-mono opacity-50">KOSONG</div>';
        } else {
            types.forEach(type => {
                const typeOrders = colOrders.filter(wo => wo.type_id === type.id || (!type.id && type.name === 'Lainnya'));
                if (typeOrders.length > 0) {
                    kanbanHtml += `
                        <div class="label font-mono mb-2 mt-2" style="color: ${type.color}; font-size: 0.6rem; opacity: 0.8;">
                            > ${type.name}
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

    // 2. WIRE UP EVENTS
    const attachEvents = (parentEl) => {
        if (!parentEl) return;
        
        parentEl.querySelectorAll('.ticket-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Prevent click bubbling if we add buttons later
                if (e.target.closest('.btn')) return;
                
                const woId = card.dataset.id;
                const wo = filteredOrders.find(w => w.id === woId);
                if (onRowClick) onRowClick(wo);
            });
        });

        // Legacy action buttons if still present in templates
        parentEl.querySelectorAll('.assign-confirm-wo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const woId = btn.dataset.id;
                const wo = filteredOrders.find(w => w.id === woId);
                if (onConfirmClick) onConfirmClick(wo);
            });
        });

        parentEl.querySelectorAll('.verify-wo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const woId = btn.dataset.id;
                document.dispatchEvent(new CustomEvent('request-wo-verify', { detail: { woId } }));
            });
        });
    };

    attachEvents(tableContainer);
}

function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "thn";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "bln";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "hr";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "jam";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "mnt";
    return Math.floor(seconds) + "dtk";
}
