// Main orchestrator for work-orders module
import { supabase, apiCall } from '../../../../api/supabase.js';
import { showToast } from '../../../utils/toast.js';
import { loadWorkOrders, renderStatusSummary, renderSearchBar, getFilteredOrders, renderWorkOrders } from './list.js';
import { getStatusColor, getStatusDisplayText } from './utils.js';
import { getSpinner } from '../../../utils/ui-common.js';
import { ActivityLog } from '../../../utils/activity-log.js';
import { showWorkOrderModal } from './form.js';
import { showInstallationMonitoringModal, showVerificationModal } from './monitoring.js';
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

    // Unified Kanban Board Container
    const unifiedContainer = document.createElement('div');
    unifiedContainer.id = 'work-orders-unified-container';
    unifiedContainer.innerHTML = `
        <div id="wo-live-activity-section" class="mb-4"></div>
        <div id="wo-main-kanban-board" class="mt-3"></div>
    `;
    
    // Replace the card body content with the unified container
    workOrdersCard.querySelector('.card-body').innerHTML = '';
    workOrdersCard.querySelector('.card-body').appendChild(unifiedContainer);

    const listContainerKanban = document.getElementById('wo-main-kanban-board');

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

    // Make type mapping available globally for rendering swimlanes
    window.woTypeMapping = {
        pemasanganId: pemasanganTypeId,
        perbaikanId: perbaikanTypeId
    };

    // Helper functions inside index to pass around state
    window.reloadUnifiedKanban = () => {
        loadDataUnified(listContainerKanban);
        renderTargetStatistics(pemasanganTypeId, perbaikanTypeId);
        renderLiveActivityFeed();
    };

    // Load initial data for unified board
    window.reloadUnifiedKanban();


    // Wire up action buttons
    document.getElementById('add-wo-btn').onclick = () => showWorkOrderModal(null, () => {
        window.reloadUnifiedKanban();
    });
    document.getElementById('refresh-wo-btn').onclick = () => {
        window.reloadUnifiedKanban();
    };



    // Render search bar
    renderSearchBar((query) => {
        currentSearch = query;
        window.reloadUnifiedKanban();
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

        let html = `
            <div class="row g-3">
                <div class="col-6 col-sm-3 mt-0">
                    <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center h-100">
                        <div class="small fw-semibold mb-1" style="color: #f59e0b;">Menunggu</div>
                        <div class="h4 fw-bold text-white mb-0 lh-1">${stats.waiting}</div>
                    </div>
                </div>
                <div class="col-6 col-sm-3 mt-0">
                    <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center h-100">
                        <div class="small fw-semibold mb-1" style="color: #0ea5e9;">Diproses</div>
                        <div class="h4 fw-bold text-white mb-0 lh-1">${stats.inProgress}</div>
                    </div>
                </div>
                <div class="col-6 col-sm-3 mt-0">
                    <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center h-100">
                        <div class="small fw-semibold mb-1" style="color: #10b981;">Selesai</div>
                        <div class="h4 fw-bold text-white mb-0 lh-1">${stats.completed}</div>
                    </div>
                </div>
                <div class="col-6 col-sm-3 mt-0">
                    <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center h-100">
                        <div class="small fw-semibold mb-1" style="color: #ef4444;">Leftover</div>
                        <div class="h4 fw-bold text-white mb-0 lh-1">${stats.leftOver}</div>
                    </div>
                </div>
            </div>
            
            <div class="d-flex justify-content-center gap-4 mt-3 pb-1 border-top border-secondary border-opacity-25 pt-2">
                <div class="text-center">
                    <span class="small text-white-50 d-block mb-1">Target Pemasangan</span>
                    <span class="fw-bold text-white fs-6 lh-1">${stats.pemasangan}</span>
                </div>
                <div class="text-center" style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 1rem;">
                    <span class="small text-white-50 d-block mb-1">Target Perbaikan</span>
                    <span class="fw-bold text-white fs-6 lh-1">${stats.perbaikan}</span>
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
/**
 * Helper to load and render comprehensive data
 */
function loadDataUnified(container) {
    loadWorkOrders(container, null, (data) => {
        allWorkOrders = data;
        const filtered = getFilteredOrders(data, 'All', currentSearch);
        renderWorkOrders(filtered, 
            (wo) => showWorkOrderActions(wo),
            (wo) => showAssignConfirmPanel(wo),
            container
        );
    });
}
    
/**
 * Render Live Technician Activity Feed
 */
async function renderLiveActivityFeed() {
    const section = document.getElementById('wo-live-activity-section');
    if (!section) return;

    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch monitorings from today, joined with work order context
        const { data: monitorings, error } = await supabase
            .from('installation_monitorings')
            .select(`
                id, status, notes, created_at, work_order_id,
                work_orders ( title, customers (name) )
            `)
            .gte('created_at', today)
            .lte('created_at', today + 'T23:59:59')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        if (!monitorings || monitorings.length === 0) {
            section.innerHTML = '';
            return;
        }
        
        const logs = monitorings.map(m => ({
            created_at: m.created_at,
            status: m.status,
            notes: m.notes,
            customer_name: m.work_orders?.customers?.name,
            title: m.work_orders?.title,
            color: '#10b981'
        }));

        let html = `
            <h5 class="text-white mb-3 fw-bold" style="letter-spacing: -0.5px;">
                <i class="bi bi-activity text-success me-2"></i>Aktivitas Harian Teknisi
            </h5>
        `;
        html += ActivityLog.renderFeed(logs);
        section.innerHTML = html;
        
    } catch (e) {
        console.error('Failed to load activity feed', e);
    }
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
        window.setBtnLoading(saveBtn, true, 'Menyimpan...');

        const selectedEmployeeId = employeeSelect ? (employeeSelect.value || null) : null;

        // Confirm via server-side API (admin only, creates monitoring record atomically)
        try {
            await apiCall('/work-orders/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    id: wo.id,
                    employeeId: selectedEmployeeId
                })
            });
            showToast('Work order berhasil dikonfirmasi.', 'success');
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            window.setBtnLoading(saveBtn, false);
            return;
        }
        
        modal.hide();
        
        // Refresh data without full page reload
        window.reloadUnifiedKanban();
    };

    // Remove any existing listener before adding a new one
    if (saveBtn._clickHandler) {
        saveBtn.removeEventListener('click', saveBtn._clickHandler);
    }
    saveBtn._clickHandler = saveHandler;
    saveBtn.addEventListener('click', saveBtn._clickHandler);
    
    // Reset button state when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
        window.setBtnLoading(saveBtn, false);
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
    const logs = (monitorings || []).map(m => ({
        created_at: m.created_at,
        status: m.status,
        notes: m.notes,
        color: getStatusColor(m.status) || 'var(--vscode-secondary)',
        icon: 'bi-clock-history'
    }));
    const timelineHtml = ActivityLog.renderTimeline(logs);

    // Build Points HUD breakdown (AC1 + AC2)
    const isPointsVisible = ['closed', 'completed'].includes(wo.status);
    const basePoints = wo.master_queue_types?.base_point || 0;

    // Fetch user role for financial visibility (Story 2.3 AC4/5)
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: profile } = await supabase.from('profiles').select('roles(code)').eq('id', sessionData?.session?.user?.id).single();
    const isAdminUser = ['S_ADM', 'OWNER', 'ADM'].includes(profile?.roles?.code);

    let pointsHudHtml = '';
    if (isPointsVisible) {
        const pointAssignments = assignments.map(a => {
            const isLead = a.assignment_role === 'lead';
            const multiplier = isLead ? 1.0 : 0.7;
            const baseCalc = isLead ? basePoints : Math.floor(basePoints * 0.7);
            const bonus = a.bonus_points || 0;
            const deduction = a.deduction_points || 0;
            const finalPts = a.points_earned || Math.max(0, baseCalc + bonus - deduction);
            const reason = a.adjustment_reason || '';

            return `
                <div class="hud-assignment-card mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold text-white" style="font-size: 0.95rem;">
                            <i class="bi bi-person-fill me-1" style="color: #14b8a6;"></i>${a.employees?.name || 'Teknisi'}
                        </span>
                        <span class="hud-role-badge">${a.assignment_role.toUpperCase()}</span>
                    </div>
                    <div class="hud-math-grid">
                        <div class="hud-math-row">
                            <span class="hud-label">Base (${wo.master_queue_types?.name || 'Job'})</span>
                            <span class="hud-value">${basePoints}</span>
                        </div>
                        ${!isLead ? `
                        <div class="hud-math-row hud-multiplier">
                            <span class="hud-label">× ${multiplier} <span class="text-white-50">(Member)</span></span>
                            <span class="hud-value">= ${baseCalc}</span>
                        </div>
                        ` : ''}
                        ${bonus > 0 ? `
                        <div class="hud-math-row hud-bonus">
                            <span class="hud-label">Bonus</span>
                            <span class="hud-value hud-positive">+${bonus}</span>
                        </div>
                        ` : ''}
                        ${deduction > 0 ? `
                        <div class="hud-math-row hud-deduction">
                            <span class="hud-label">Potongan</span>
                            <span class="hud-value hud-negative">−${deduction}</span>
                        </div>
                        ` : ''}
                        ${reason ? `
                        <div class="hud-reason-row">
                            <i class="bi bi-chat-left-text me-1"></i>${reason}
                        </div>
                        ` : ''}
                        <div class="hud-math-row hud-total">
                            <span class="hud-label">TOTAL</span>
                            <span class="hud-value hud-total-value">${finalPts} pts</span>
                        </div>
                    </div>
                </div>
            `;
        });

        const grandTotal = assignments.reduce((s, a) => s + (a.points_earned || 0), 0);

        // Material Cost Section (Story 2.3)
        let materialHtml = '';
        if (isAdminUser && wo.material_cost !== undefined) {
            const invUsed = wo.inventory_used || [];
            materialHtml = `
                <div class="hud-panel mt-3 border-info border-opacity-25" style="background: rgba(14, 165, 233, 0.05);">
                    <div class="hud-header mb-2 text-info">
                        <i class="bi bi-box-seam me-2"></i>Job Material Cost
                    </div>
                    <div class="hud-math-grid">
                        ${invUsed.map(inv => `
                            <div class="hud-math-row">
                                <span class="hud-label">${inv.name} (x${inv.quantity})</span>
                                <span class="hud-value text-white-50">Rp ${(inv.subtotal || 0).toLocaleString('id-ID')}</span>
                            </div>
                        `).join('')}
                        <div class="hud-math-row hud-total pt-2 border-top border-secondary border-opacity-25 mt-2">
                            <span class="hud-label text-info">TOTAL MATERIAL</span>
                            <span class="hud-value text-info fw-bold">Rp ${(wo.material_cost || 0).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        pointsHudHtml = `
            <div class="hud-panel">
                <div class="hud-header mb-3">
                    <i class="bi bi-gem me-2"></i>Points Breakdown
                </div>
                ${pointAssignments.join('')}
                <div class="hud-grand-total">
                    <span>GRAND TOTAL</span>
                    <span class="hud-grand-value">${grandTotal} pts</span>
                </div>
            </div>
            ${materialHtml}
        `;
    }

    body.innerHTML = `
        <div class="px-1 kanban-modal-wrapper">
            <!-- Header Banner -->
            <div class="kanban-pro-col d-flex flex-column gap-2 mb-4 position-relative overflow-hidden" style="border-top: 4px solid ${getStatusColor(wo.status)};">
                <div class="d-flex justify-content-between align-items-center position-relative z-index-1">
                    <span class="badge shadow-sm px-2 py-1" style="background-color: ${getStatusColor(wo.status)}; color: #fff;">${getStatusDisplayText(wo.status)}</span>
                    <span class="fw-bold text-info small"><i class="bi bi-tag-fill me-1"></i>${wo.title || 'PSB'}</span>
                </div>
                
                <div class="mt-2 text-white position-relative z-index-1">
                    <h4 class="mb-1 fw-bold fs-5 tracking-tight">${wo.customers?.name || '-'}</h4>
                    <div class="text-white-50 small"><i class="bi bi-telephone text-primary me-2"></i>${wo.customers?.phone || '-'}</div>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="kanban-pro-col h-100 p-3" style="background: rgba(15, 23, 42, 0.4);">
                        <span class="text-white-50 d-block mb-3 small fw-semibold text-uppercase" style="letter-spacing:0.5px;">Detail Permintaan</span>
                        
                        <div class="d-flex flex-column gap-2">
                            <div>
                                <span class="badge text-bg-light fw-bold">${wo.customers?.packet || 'Tanpa Paket'}</span>
                            </div>
                            <div class="text-white-50 small pe-2 lh-base mt-2 pt-2 border-top border-secondary border-opacity-25" style="border-color: rgba(255,255,255,0.05) !important;">
                                ${wo.ket || '-'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="kanban-pro-col h-100 p-3" style="background: rgba(15, 23, 42, 0.4);">
                        <span class="text-white-50 d-block mb-3 small fw-semibold text-uppercase" style="letter-spacing:0.5px;">Personil Bertugas</span>
                        <div class="text-white small">${teamHtml}</div>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <ul class="nav nav-pills mb-4 d-flex bg-dark rounded-pill p-1 shadow-sm border border-secondary border-opacity-25" id="woTabs" role="tablist">
                <li class="nav-item flex-fill text-center" role="presentation">
                    <button class="nav-link active rounded-pill w-100 fw-semibold transition-all" id="actions-tab" data-bs-toggle="pill" data-bs-target="#actions-panel" type="button" role="tab" style="font-size: 0.9rem;">Tindakan</button>
                </li>
                ${isPointsVisible ? `
                <li class="nav-item flex-fill text-center" role="presentation">
                    <button class="nav-link rounded-pill w-100 fw-semibold text-white-50 transition-all" id="points-tab" data-bs-toggle="pill" data-bs-target="#points-panel" type="button" role="tab" style="font-size: 0.9rem;">
                        <i class="bi bi-gem me-1"></i>Poin
                    </button>
                </li>
                ` : ''}
                <li class="nav-item flex-fill text-center" role="presentation">
                    <button class="nav-link rounded-pill w-100 fw-semibold text-white-50 transition-all" id="history-tab" data-bs-toggle="pill" data-bs-target="#history-panel" type="button" role="tab" style="font-size: 0.9rem;">Riwayat</button>
                </li>
            </ul>

            <div class="tab-content" id="woTabsContent">
                <!-- Actions Panel -->
                <div class="tab-pane fade show active" id="actions-panel" role="tabpanel">
                    <div class="row g-3">
                        <div class="col-12 col-md-6">
                            <button class="btn btn-primary w-100 shadow-sm d-flex flex-column flex-md-row justify-content-center align-items-center py-3 gap-2 rounded-3 transition-base hover-lift" id="action-monitor-wo" style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); border:none;">
                                <i class="bi bi-graph-up fs-5"></i>
                                <span class="fw-semibold">Pantau / Update</span>
                            </button>
                        </div>
                        <div class="col-12 col-md-6">
                            ${wo.status === 'completed' 
                                ? `<button class="btn btn-warning w-100 shadow-sm d-flex flex-column flex-md-row justify-content-center align-items-center py-3 gap-2 rounded-3 transition-base hover-lift" id="action-verify-wo">
                                    <i class="bi bi-shield-check fs-5"></i>
                                    <span class="fw-semibold">Verifikasi & Tutup</span>
                                   </button>`
                                : `<button class="btn btn-success w-100 shadow-sm d-flex flex-column flex-md-row justify-content-center align-items-center py-3 gap-2 rounded-3 transition-base hover-lift" id="action-complete-wo">
                                    <i class="bi bi-check-circle-fill fs-5"></i>
                                    <span class="fw-semibold">Tandai Selesai</span>
                                   </button>`
                            }
                        </div>
                        ${wo.status === 'completed' ? `
                        <div class="col-12">
                            <button class="btn btn-outline-warning w-100 py-2" id="action-revision-wo">
                                <i class="bi bi-arrow-counterclockwise me-2"></i>Minta Revisi
                            </button>
                        </div>
                        ` : ''}
                        <div class="col-12 border-top border-secondary border-opacity-25 mt-4 pt-3 d-flex gap-2 justify-content-end align-items-center">
                            <span class="small text-white-50 me-auto">Opsi Lanjutan</span>
                            <button class="btn btn-outline-light btn-sm px-3 rounded-pill" id="action-edit-wo">
                                <i class="bi bi-pencil me-1"></i> Edit
                            </button>
                            <button class="btn btn-outline-danger btn-sm px-3 rounded-pill" id="action-delete-wo">
                                <i class="bi bi-trash me-1"></i> Hapus
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Points HUD Panel (AC1 + AC2) -->
                ${isPointsVisible ? `
                <div class="tab-pane fade" id="points-panel" role="tabpanel">
                    ${pointsHudHtml}
                </div>
                ` : ''}

                <!-- History Panel -->
                <div class="tab-pane fade" id="history-panel" role="tabpanel">
                    <div class="kanban-pro-col kanban-scroll p-4" style="max-height: 280px; overflow-y: auto; background: rgba(15,23,42,0.3);">
                        ${timelineHtml}
                    </div>
                </div>
            </div>
        </div>
        <style>
            .hover-lift:hover {
                transform: translateY(-2px);
                filter: brightness(1.1);
            }
            .tracking-tight { letter-spacing: -0.5px; }
            #woTabs .nav-link { color: #94a3b8; }
            #woTabs .nav-link.active { background: #334155; color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        </style>
    `;

    // document.getElementById('save-crud-btn').style.display = 'none';

    document.getElementById('action-edit-wo').onclick = () => {
        modal.hide();
        showWorkOrderModal(wo, () => {
            // Refresh the correct tab after editing
            window.reloadUnifiedKanban();
        });
    };

    document.getElementById('action-monitor-wo').onclick = () => {
        modal.hide();
        showInstallationMonitoringModal(wo, () => {
            location.reload();
        });
    };

    if (document.getElementById('action-complete-wo')) {
        document.getElementById('action-complete-wo').onclick = async (e) => {
            const btn = e.currentTarget;
            window.setBtnLoading(btn, true, 'Memproses...');
            try {
                const response = await apiCall('/api/work-orders/complete', {
                    method: 'POST',
                    body: JSON.stringify({ id: wo.id })
                });
                if (response.error) throw new Error(response.error);
                showToast('Antrian berhasil ditandai selesai (Menunggu Verifikasi)', 'success');
                modal.hide();
                window.reloadUnifiedKanban();
            } catch (err) {
                showToast(`Error: ${err.message}`, 'error');
                window.setBtnLoading(btn, false);
            }
        };
    }

    if (document.getElementById('action-verify-wo')) {
        document.getElementById('action-verify-wo').onclick = () => {
            modal.hide();
            showVerificationModal(wo, () => {
                window.reloadUnifiedKanban();
            });
        };
    }

    if (document.getElementById('action-revision-wo')) {
        document.getElementById('action-revision-wo').onclick = async () => {
            const reason = prompt('Masukkan alasan permintaan revisi:');
            if (!reason) return;
            
            try {
                const response = await apiCall('/api/work-orders/revision', {
                    method: 'POST',
                    body: JSON.stringify({ id: wo.id, reason })
                });
                if (response.error) throw new Error(response.error);
                showToast('Permintaan revisi berhasil dikirim', 'success');
                modal.hide();
                window.reloadUnifiedKanban();
            } catch (err) {
                showToast(`Error: ${err.message}`, 'error');
            }
        };
    }

    document.getElementById('action-delete-wo').onclick = async (e) => {
        if (!confirm('Yakin ingin menghapus antrian ini?')) return;
        const btn = e.currentTarget;
        window.setBtnLoading(btn, true, 'Menghapus...');

        try {
            await apiCall(`/work-orders/${wo.id}`, { method: 'DELETE' });
            showToast('Antrian berhasil dihapus', 'success');
            modal.hide();
            window.reloadUnifiedKanban();
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            window.setBtnLoading(btn, false);
        }
    };
    // Note: modal.show() was already called at the top during loading phase
}
