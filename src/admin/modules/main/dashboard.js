export async function initDashboard() {
    const dashboardSection = document.getElementById('role-feature');
    if (!dashboardSection) return;

    dashboardSection.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row g-4">
                <div class="col-12">
                    <div class="card bg-vscode border-0 shadow-sm p-4 text-white overflow-hidden" style="border-radius: 15px;">
                        <div class="d-flex align-items-center position-relative" style="z-index: 2;">
                            <div>
                                <h2 class="fw-bold mb-2">Selamat Datang di Portal Admin SiFatih</h2>
                                <p class="text-white-50 mb-0">Kelola operasional, pelanggan, dan antrian dalam satu tempat.</p>
                            </div>
                            <div class="ms-auto d-none d-md-block">
                                <i class="bi bi-speedometer2 text-accent opacity-25" style="font-size: 8rem; margin-right: -2rem;"></i>
                            </div>
                        </div>
                        <div class="position-absolute top-0 end-0 p-4 opacity-10" style="z-index: 1;">
                            <i class="bi bi-shield-lock-fill" style="font-size: 15rem; margin-top: -5rem; margin-right: -3rem;"></i>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-4">
                    <div class="card bg-vscode border-0 h-100 shadow-sm hover-scale transition-300 pointer-cursor" 
                         id="quick-add-customer-btn" 
                         style="border-radius: 12px; border-left: 4px solid var(--accent-color) !important;">
                        <div class="card-body p-4 d-flex align-items-center">
                            <div class="rounded-3 bg-accent bg-opacity-10 p-3 me-3">
                                <i class="bi bi-person-plus-fill text-accent fs-3"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-1 text-white">Daftar Pelanggan Baru</h5>
                                <p class="text-white-50 small mb-0">Klik untuk langsung membuka form registrasi pelanggan.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-4">
                    <div class="card bg-vscode border-0 h-100 shadow-sm hover-scale transition-300 pointer-cursor" 
                         id="quick-wo-btn"
                         style="border-radius: 12px; border-left: 4px solid var(--vscode-warning) !important;">
                        <div class="card-body p-4 d-flex align-items-center">
                            <div class="rounded-3 bg-warning bg-opacity-10 p-3 me-3">
                                <i class="bi bi-file-earmark-plus text-warning fs-3"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-1 text-white">Buat Antrian Baru</h5>
                                <p class="text-white-50 small mb-0">Kelola Work Order dan instalasi pemasangan baru.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-4">
                    <div class="card bg-vscode border-0 h-100 shadow-sm hover-scale transition-300 pointer-cursor" 
                         id="quick-map-btn"
                         style="border-radius: 12px; border-left: 4px solid var(--vscode-accent) !important;">
                        <div class="card-body p-4 d-flex align-items-center">
                            <div class="rounded-3 bg-info bg-opacity-10 p-3 me-3">
                                <i class="bi bi-pin-map text-info fs-3"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-1 text-white">Pantau Lokasi</h5>
                                <p class="text-white-50 small mb-0">Lihat persebaran pelanggan di peta interaktif.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mt-2">
                <div class="col-12">
                    <h5 class="text-white-50 mb-3 px-1 fw-bold" style="letter-spacing: 1px; font-size: 0.8rem;">RINGKASAN SISTEM</h5>
                    <div class="row g-3">
                         <div class="col-6 col-sm-3">
                            <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center">
                                <div class="text-white-50 small mb-1">Total Pelanggan</div>
                                <div class="h4 fw-bold text-white mb-0" id="stat-total-customers">-</div>
                            </div>
                         </div>
                         <div class="col-6 col-sm-3">
                            <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center">
                                <div class="text-white-50 small mb-1">Antrian Aktif</div>
                                <div class="h4 fw-bold text-white mb-0" id="stat-active-wo">-</div>
                            </div>
                         </div>
                         <div class="col-6 col-sm-3">
                            <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center">
                                <div class="text-white-50 small mb-1">Karyawan Aktif</div>
                                <div class="h4 fw-bold text-white mb-0" id="stat-total-employees">-</div>
                            </div>
                         </div>
                         <div class="col-6 col-sm-3">
                            <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center">
                                <div class="text-white-50 small mb-1">Paket Layanan</div>
                                <div class="h4 fw-bold text-white mb-0" id="stat-total-packages">-</div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('quick-add-customer-btn').onclick = () => {
        document.dispatchEvent(new CustomEvent('navigate', { detail: 'add-customer-view-content' }));
    };

    document.getElementById('quick-wo-btn').onclick = () => {
        document.dispatchEvent(new CustomEvent('navigate', { detail: 'work-orders-content' }));
    };

    document.getElementById('quick-map-btn').onclick = () => {
        document.dispatchEvent(new CustomEvent('navigate', { detail: 'customer-map-view-content' }));
    };

    // Load simple stats
    loadDashboardStats();

    // [WO-005] Load today's queue widget
    loadTodayQueue();
}

async function loadDashboardStats() {
    try {
        const { apiCall } = await import('../../../api/supabase.js');
        const stats = await apiCall('/dashboard/stats');

        document.getElementById('stat-total-customers').innerText = stats.totalCustomers ?? 0;
        document.getElementById('stat-active-wo').innerText = stats.activeWorkOrders ?? 0;
        document.getElementById('stat-total-employees').innerText = stats.activeEmployees ?? 0;
        document.getElementById('stat-total-packages').innerText = stats.totalPackages ?? 0;
    } catch (err) {
        console.error("Dashboard stats error:", err);
    }
}

/**
 * [WO-005] Load and render the "Today's Active Queue" widget.
 */
async function loadTodayQueue() {
    const container = document.querySelector('.container-fluid.py-4');
    if (!container) return;

    const widgetHtml = `
        <div class="row g-4 mt-2">
            <div class="col-12">
                <div id="today-queue-widget">
                    <div class="d-flex justify-content-between align-items-center mb-3 px-1">
                         <h5 class="text-white-50 fw-bold" style="letter-spacing: 1px; font-size: 0.8rem;">ANTRIAN AKTIF HARI INI</h5>
                         <button class="btn btn-link btn-sm text-white-50" id="view-all-wo-link">Lihat Semua →</button>
                    </div>
                    <div class="card bg-vscode border-secondary border-opacity-25">
                        <div class="card-body p-2" id="today-queue-list" style="max-height: 320px; overflow-y: auto;">
                            <div class="text-center p-5">
                                <div class="spinner-border text-white-50" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-2 text-white-50">Memuat antrian...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', widgetHtml);

    document.getElementById('view-all-wo-link').onclick = () => {
        document.dispatchEvent(new CustomEvent('navigate', { detail: 'work-orders-content' }));
    };

    const listContainer = document.getElementById('today-queue-list');
    const { supabase } = await import('../../../api/supabase.js');
    const { getStatusColor, getStatusDisplayText } = await import('./work-orders/utils.js');

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('work_orders')
        .select(`*, customers(name, phone), employees!employee_id(name), master_queue_types(name, color, icon)`)
        .or(`registration_date.eq.${today},status.in.(confirmed,open)`)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        listContainer.innerHTML = `<div class="p-3 text-danger">Error: ${error.message}</div>`;
        return;
    }

    if (data.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center p-5">
                <i class="bi bi-check2-circle fs-1 text-success"></i>
                <p class="mt-2 text-white-50">Tidak ada antrian aktif untuk hari ini. Santai!</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = data.map(wo => {
        const type = wo.master_queue_types;
        const customer = wo.customers;
        const employee = wo.employees;
        const statusColor = getStatusColor(wo.status);
        const statusText = getStatusDisplayText(wo.status);

        return `
            <div class="list-group-item list-group-item-action bg-transparent text-white border-bottom border-secondary border-opacity-25 p-3">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <span class="badge rounded-pill me-3" style="background-color:${type?.color || '#6b7280'}; padding: 0.5em 0.7em;">
                            <i class="bi ${type?.icon || 'bi-ticket-detailed'}"></i>
                        </span>
                        <div>
                            <h6 class="mb-0 fw-bold">${customer?.name || 'N/A'}</h6>
                            <small class="text-white-50">${customer?.phone || ''} &middot; ${type?.name || 'Tiket'}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center text-nowrap">
                        <div class="text-end me-3 d-none d-sm-block">
                            <span class="badge" style="background-color:${statusColor}; color:var(--vscode-text-bright);">${statusText}</span>
                            <br>
                            <small class="text-white-50">${employee?.name || 'Belum ditugaskan'}</small>
                        </div>
                        ${wo.status === 'waiting' ? `
                            <button class="btn btn-sm btn-success dashboard-confirm-wo" data-wo-id="${wo.id}" title="Konfirmasi & Tugaskan">
                                Konfirmasi
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Event listener for the confirm buttons
    listContainer.querySelectorAll('.dashboard-confirm-wo').forEach(btn => {
        btn.onclick = async () => {
            const woId = btn.dataset.woId;
            const { initWorkOrders } = await import('./work-orders/index.js');
            
            // This is a workaround to get access to the confirmation panel function.
            // A better approach would be a more robust event bus or shared utility.
            document.dispatchEvent(new CustomEvent('request-wo-confirmation', { detail: { woId } }));
        };
    });
}
