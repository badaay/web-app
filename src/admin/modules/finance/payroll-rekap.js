/**
 * Module: Payroll Rekap Log (Story 2.4)
 * Master disbursement ledger for all employees per period.
 * Supports: period selection, bulk mark-as-paid, CSV export, payslip links.
 */
import { apiCall, supabaseB } from '../../../api/supabase.js';
import { showToast } from '../../utils/toast.js';

const fmt = new Intl.NumberFormat('id-ID');
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

let currentPeriods = [];
let selectedPeriodId = null;
let currentSummaries = [];

export async function initPayrollRekap() {
    const container = document.getElementById('payroll-rekap-content');
    if (!container) return;

    container.innerHTML = `
        <div class="finance-module-header d-flex justify-content-between align-items-center mb-4 mt-2">
            <div>
                <h4 class="mb-1 text-white fw-bold"><i class="bi bi-journal-text text-accent-gradient me-2"></i>Rekap Payroll & Pencairan</h4>
                <p class="text-white-50 small mb-0">Lihat rekap gaji seluruh karyawan, proses pencairan, dan ekspor laporan.</p>
            </div>
            <div class="d-flex gap-2">
                <button id="rekap-export-btn" class="btn btn-outline-info btn-sm shadow-sm" disabled>
                    <i class="bi bi-file-earmark-spreadsheet me-1"></i> Ekspor CSV
                </button>
                <button id="rekap-mark-paid-btn" class="btn btn-success btn-sm shadow-sm" disabled>
                    <i class="bi bi-cash-stack me-1"></i> Tandai Lunas
                </button>
            </div>
        </div>

        <!-- Period Selector -->
        <div class="card bg-vscode border-secondary shadow-sm mb-3">
            <div class="card-body py-2 px-3">
                <div class="d-flex align-items-center gap-3 flex-wrap">
                    <label class="text-white-50 small fw-bold mb-0"><i class="bi bi-calendar3 me-1"></i>Periode:</label>
                    <select id="rekap-period-select" class="form-select form-select-sm bg-dark text-white border-secondary" style="max-width: 220px;">
                        <option value="">-- Pilih Periode --</option>
                    </select>
                    <span id="rekap-period-status" class="badge bg-secondary rounded-1 px-2 py-1 fw-normal text-capitalize" style="font-size: 0.7rem;"></span>
                    <span id="rekap-period-dates" class="text-white-50 small"></span>
                </div>
            </div>
        </div>

        <!-- Summary Stats Bar -->
        <div id="rekap-stats-bar" class="row g-2 mb-3 d-none">
            <div class="col-md-3">
                <div class="card bg-vscode border-secondary p-3">
                    <span class="text-white-50 tiny text-uppercase fw-bold">Karyawan</span>
                    <h5 class="text-white fw-bold mb-0" id="rekap-stat-employees">0</h5>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-vscode border-secondary p-3">
                    <span class="text-white-50 tiny text-uppercase fw-bold">Penghasilan Kotor</span>
                    <h5 class="text-info fw-bold mb-0" id="rekap-stat-gross">Rp 0</h5>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-vscode border-secondary p-3">
                    <span class="text-white-50 tiny text-uppercase fw-bold">Total Potongan</span>
                    <h5 class="text-danger fw-bold mb-0" id="rekap-stat-deductions">Rp 0</h5>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-vscode border-secondary p-3">
                    <span class="text-white-50 tiny text-uppercase fw-bold">Take-Home Total</span>
                    <h5 class="text-success fw-bold mb-0" id="rekap-stat-net">Rp 0</h5>
                </div>
            </div>
        </div>

        <!-- Master Ledger Table -->
        <div class="card bg-vscode border-secondary shadow-sm">
            <div class="card-body p-0">
                <div id="rekap-table-container" class="table-responsive">
                    <div class="text-center py-5 text-white-50">
                        <i class="bi bi-journal-text fs-1 d-block mb-2"></i>
                        Pilih periode payroll untuk melihat rekap
                    </div>
                </div>
            </div>
        </div>
    `;

    // Event listeners
    document.getElementById('rekap-period-select')?.addEventListener('change', onPeriodChange);
    document.getElementById('rekap-export-btn')?.addEventListener('click', exportCSV);
    document.getElementById('rekap-mark-paid-btn')?.addEventListener('click', markAsPaid);

    // Load periods
    await loadPeriods();
}

async function loadPeriods() {
    const select = document.getElementById('rekap-period-select');
    if (!select) return;

    try {
        const data = await apiCall('/finance/recap?mode=payroll-periods&limit=24');
        currentPeriods = data.data || [];

        if (!currentPeriods.length) {
            select.innerHTML = '<option value="">Belum ada periode payroll</option>';
            return;
        }

        select.innerHTML = '<option value="">-- Pilih Periode --</option>' +
            currentPeriods.map(p =>
                `<option value="${p.id}">${MONTH_NAMES[p.month - 1]} ${p.year} (${p.status})</option>`
            ).join('');

        // Auto-select latest period if only one or most recent
        const latest = currentPeriods.find(p => ['calculated', 'approved', 'paid'].includes(p.status));
        if (latest) {
            select.value = latest.id;
            await onPeriodChange();
        }
    } catch (err) {
        console.error('Load periods error:', err);
        showToast('error', 'Gagal memuat periode: ' + err.message);
    }
}

async function onPeriodChange() {
    const select = document.getElementById('rekap-period-select');
    selectedPeriodId = select?.value;

    if (!selectedPeriodId) {
        document.getElementById('rekap-stats-bar')?.classList.add('d-none');
        document.getElementById('rekap-table-container').innerHTML = `
            <div class="text-center py-5 text-white-50">
                <i class="bi bi-journal-text fs-1 d-block mb-2"></i>
                Pilih periode payroll untuk melihat rekap
            </div>`;
        document.getElementById('rekap-export-btn').disabled = true;
        document.getElementById('rekap-mark-paid-btn').disabled = true;
        return;
    }

    const period = currentPeriods.find(p => p.id === selectedPeriodId);

    // Update period info bar
    const statusBadge = document.getElementById('rekap-period-status');
    if (statusBadge && period) {
        statusBadge.textContent = period.status;
        statusBadge.className = `badge badge-${period.status} rounded-1 px-2 py-1 fw-normal text-capitalize`;
        statusBadge.style.fontSize = '0.7rem';
    }
    const datesSpan = document.getElementById('rekap-period-dates');
    if (datesSpan && period) {
        datesSpan.textContent = `${period.period_start} – ${period.period_end}`;
    }

    // Enable/disable mark-paid button based on status
    const markPaidBtn = document.getElementById('rekap-mark-paid-btn');
    if (markPaidBtn && period) {
        markPaidBtn.disabled = period.status !== 'approved';
    }

    // Load rekap data
    await loadRekap(selectedPeriodId);
}

async function loadRekap(periodId) {
    const tableContainer = document.getElementById('rekap-table-container');
    if (!tableContainer) return;

    tableContainer.innerHTML = `<div class="text-center py-4"><div class="spinner-border spinner-border-sm me-2"></div>Memuat rekap...</div>`;

    try {
        const data = await apiCall(`/finance/recap?mode=payroll-rekap&period_id=${periodId}&limit=100`);
        currentSummaries = data.summaries || [];
        const totals = data.totals || {};

        // Update stats bar
        const statsBar = document.getElementById('rekap-stats-bar');
        if (statsBar) statsBar.classList.remove('d-none');

        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('rekap-stat-employees', totals.employee_count || currentSummaries.length);
        el('rekap-stat-gross', `Rp ${fmt.format(totals.gross_earnings || 0)}`);
        el('rekap-stat-deductions', `Rp ${fmt.format(totals.total_deductions || 0)}`);
        el('rekap-stat-net', `Rp ${fmt.format(totals.take_home_pay || 0)}`);

        // Enable export
        const exportBtn = document.getElementById('rekap-export-btn');
        if (exportBtn) exportBtn.disabled = currentSummaries.length === 0;

        // Render table
        if (!currentSummaries.length) {
            tableContainer.innerHTML = `
                <div class="text-center py-5 text-white-50">
                    <i class="bi bi-calculator fs-1 d-block mb-2"></i>
                    Belum ada data payroll. Hitung payroll terlebih dahulu.
                </div>`;
            return;
        }

        const period = currentPeriods.find(p => p.id === periodId);
        const isPaid = period?.status === 'paid';

        tableContainer.innerHTML = `
            <table class="table table-dark table-hover align-middle mb-0" style="font-size: 0.85rem">
                <thead>
                    <tr class="text-white-50" style="font-size: 0.75rem">
                        <th class="ps-3" style="width: 30px;">
                            <input type="checkbox" class="form-check-input rekap-select-all" id="rekap-select-all">
                        </th>
                        <th>Karyawan</th>
                        <th class="text-end">Penghasilan Kotor</th>
                        <th class="text-end">Potongan</th>
                        <th class="text-end text-success">Take-Home</th>
                        <th class="text-center">Poin</th>
                        <th class="text-center">Status</th>
                        <th style="width: 80px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${currentSummaries.map((s, idx) => `
                        <tr>
                            <td class="ps-3">
                                <input type="checkbox" class="form-check-input rekap-row-check" data-idx="${idx}" data-emp-id="${s.employee_id}">
                            </td>
                            <td>
                                <div class="fw-bold">${s.employee_name || '–'}</div>
                                <small class="text-muted">${s.employee_code || ''}</small>
                            </td>
                            <td class="text-end">Rp ${fmt.format(s.gross_earnings || 0)}</td>
                            <td class="text-end text-danger">Rp ${fmt.format(s.total_deductions || 0)}</td>
                            <td class="text-end text-success fw-bold">Rp ${fmt.format(s.take_home_pay || 0)}</td>
                            <td class="text-center">
                                <span class="badge bg-${(s.actual_points || 0) >= (s.target_points || 0) ? 'success' : 'warning'}" style="font-size: 0.7rem">
                                    ${s.actual_points || 0}/${s.target_points || 0}
                                </span>
                            </td>
                            <td class="text-center">
                                <span class="badge ${isPaid ? 'bg-success' : 'bg-warning'}" style="font-size: 0.7rem">
                                    ${isPaid ? 'Lunas' : 'Pending'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-xs btn-outline-secondary" onclick="window.viewPayslip('${periodId}','${s.employee_id}')" title="Slip Gaji">
                                    <i class="bi bi-receipt"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="border-top border-secondary">
                        <td colspan="2" class="fw-bold ps-3">TOTAL</td>
                        <td class="text-end fw-bold">Rp ${fmt.format(totals.gross_earnings || 0)}</td>
                        <td class="text-end fw-bold text-danger">Rp ${fmt.format(totals.total_deductions || 0)}</td>
                        <td class="text-end fw-bold text-success">Rp ${fmt.format(totals.take_home_pay || 0)}</td>
                        <td colspan="3"></td>
                    </tr>
                </tfoot>
            </table>
        `;

        // Select-all checkbox logic
        document.getElementById('rekap-select-all')?.addEventListener('change', (e) => {
            document.querySelectorAll('.rekap-row-check').forEach(cb => { cb.checked = e.target.checked; });
        });

    } catch (err) {
        console.error('Load rekap error:', err);
        tableContainer.innerHTML = `<div class="text-center py-4 text-danger">${err.message}</div>`;
    }
}

async function markAsPaid() {
    if (!selectedPeriodId) return;

    const period = currentPeriods.find(p => p.id === selectedPeriodId);
    if (!confirm(`Tandai payroll ${MONTH_NAMES[period?.month - 1]} ${period?.year} sebagai LUNAS?`)) return;

    const btn = document.getElementById('rekap-mark-paid-btn');
    window.setBtnLoading?.(btn, true, 'Memproses...');

    try {
        await apiCall('/finance/mark-paid', {
            method: 'POST',
            body: JSON.stringify({ period_id: selectedPeriodId })
        });
        showToast('success', 'Payroll ditandai Lunas');
        await loadPeriods();
        // Re-select the same period
        const select = document.getElementById('rekap-period-select');
        if (select) { select.value = selectedPeriodId; await onPeriodChange(); }
    } catch (err) {
        showToast('error', 'Gagal: ' + err.message);
    } finally {
        window.setBtnLoading?.(btn, false);
    }
}

function exportCSV() {
    if (!currentSummaries.length || !selectedPeriodId) return;

    const period = currentPeriods.find(p => p.id === selectedPeriodId);
    const filename = `rekap_payroll_${period?.year || 'unknown'}_${MONTH_NAMES[(period?.month || 1) - 1]}.csv`;

    const headers = ['No', 'Nama Karyawan', 'Kode', 'Penghasilan Kotor', 'Total Potongan', 'Take-Home Pay', 'Poin Aktual', 'Poin Target', 'Status'];
    const rows = currentSummaries.map((s, i) => [
        i + 1,
        `"${(s.employee_name || '').replace(/"/g, '""')}"`,
        s.employee_code || '',
        s.gross_earnings || 0,
        s.total_deductions || 0,
        s.take_home_pay || 0,
        s.actual_points || 0,
        s.target_points || 0,
        period?.status === 'paid' ? 'Lunas' : 'Pending'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    showToast('success', `Rekap diekspor: ${filename}`);
}

// Payslip link (reuses existing payroll.js function)
window.viewPayslip = (periodId, employeeId) => {
    window.open(`/payroll/slip?period=${periodId}&employee=${employeeId}`, '_blank');
};
