/**
 * Module: Payroll Management
 * Task 5.5: Payroll UI - periods, calculate, approve, payslip
 * Ref: pre-planning/08-salary-calculation-flow.md
 */

import { supabase, apiCall } from '../../api/supabase.js';

export async function initPayroll() {
    const container = document.getElementById('payroll-content');
    if (!container) return;

    // Set page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Penggajian';

    // TODO: Task 5.5 - Implement payroll module
    //
    // Features:
    // 1. Period list with status badges (draft, calculated, approved, paid)
    // 2. "Create Period" button with month/year picker
    // 3. "Calculate" button (shows progress, updates status)
    // 4. Period detail: employee breakdown table
    // 5. Click employee → payslip modal
    // 6. "Approve" button for calculated periods
    //
    // API calls:
    // - GET /api/payroll/periods (list)
    // - POST /api/payroll/periods (create)
    // - GET /api/payroll/periods/:id (detail with employees)
    // - POST /api/payroll/calculate (trigger calculation)
    // - POST /api/payroll/approve (approve period)
    // - GET /api/payroll/slip/:id?employee_id= (payslip data)

    container.innerHTML = `
        <div class="card bg-dark border-secondary">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-cash-stack me-2"></i>Penggajian</h5>
                <button class="btn btn-primary btn-sm" id="btn-create-period">
                    <i class="bi bi-plus-lg"></i> Buat Periode
                </button>
            </div>
            <div class="card-body">
                <!-- Period List -->
                <div class="row" id="period-list">
                    <div class="col-12 text-center text-muted py-4">
                        <i class="bi bi-calendar3 fs-1 d-block mb-2"></i>
                        Memuat data periode...
                    </div>
                </div>
            </div>
        </div>

        <!-- Period Detail Section (shown when period selected) -->
        <div class="card bg-dark border-secondary mt-3 d-none" id="period-detail-card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <i class="bi bi-file-earmark-spreadsheet me-2"></i>
                    Detail Periode: <span id="period-detail-title">-</span>
                </h5>
                <div>
                    <button class="btn btn-warning btn-sm me-2 d-none" id="btn-calculate">
                        <i class="bi bi-calculator"></i> Hitung Gaji
                    </button>
                    <button class="btn btn-success btn-sm d-none" id="btn-approve">
                        <i class="bi bi-check-lg"></i> Setujui
                    </button>
                </div>
            </div>
            <div class="card-body">
                <!-- Period Stats -->
                <div class="row mb-3" id="period-stats">
                    <div class="col-md-3">
                        <div class="card bg-secondary bg-opacity-25">
                            <div class="card-body text-center py-2">
                                <div class="h5 mb-0" id="stat-employees">-</div>
                                <small>Karyawan</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success bg-opacity-25">
                            <div class="card-body text-center py-2">
                                <div class="h5 mb-0" id="stat-gross">-</div>
                                <small>Total Bruto</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-danger bg-opacity-25">
                            <div class="card-body text-center py-2">
                                <div class="h5 mb-0" id="stat-deductions">-</div>
                                <small>Total Potongan</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-primary bg-opacity-25">
                            <div class="card-body text-center py-2">
                                <div class="h5 mb-0" id="stat-net">-</div>
                                <small>Total Bersih</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Employee Table -->
                <div class="table-responsive">
                    <table class="table table-dark table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Karyawan</th>
                                <th>Gaji Pokok</th>
                                <th>Tunjangan</th>
                                <th>Lembur</th>
                                <th>Potongan</th>
                                <th>Take Home Pay</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="payroll-table-body">
                            <tr>
                                <td colspan="7" class="text-center text-muted py-4">
                                    Pilih periode untuk melihat detail
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // TODO: Implement
    // - loadPeriods() - fetch and render period cards
    // - createPeriod(year, month) - create new period
    // - loadPeriodDetail(periodId) - fetch and show employee breakdown
    // - calculatePayroll(periodId) - trigger calculation
    // - approvePayroll(periodId) - approve period
    // - showPayslip(periodId, employeeId) - show payslip modal
    // - renderPeriodCard(period) - render single period card
    // - renderEmployeeRow(summary) - render employee row
    // - formatCurrency(amount) - format Rupiah
}

// Status badge helper
function getStatusBadge(status) {
    const badges = {
        'draft': '<span class="badge bg-secondary">Draft</span>',
        'calculating': '<span class="badge bg-warning">Menghitung...</span>',
        'calculated': '<span class="badge bg-info">Dihitung</span>',
        'approved': '<span class="badge bg-success">Disetujui</span>',
        'paid': '<span class="badge bg-primary">Dibayar</span>'
    };
    return badges[status] || badges['draft'];
}

// Currency formatter
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}
