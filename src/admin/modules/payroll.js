/**
 * Module: Payroll Management
 * Full implementation: periods list, create period, trigger calculation,
 * approve, view per-employee breakdown
 */
import { supabase, apiCall } from '../../api/supabase.js';

const fmt = new Intl.NumberFormat('id-ID');
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export async function initPayroll() {
    const container = document.getElementById('payroll-content');
    if (!container) return;

    container.innerHTML = `
        <div class="row g-3">
            <!-- Left: Periods List -->
            <div class="col-md-4">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0"><i class="bi bi-calendar3 me-2"></i>Periode Payroll</h6>
                        <button class="btn btn-primary btn-sm" id="btn-create-period">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div id="period-list" class="list-group list-group-flush">
                            <div class="text-center text-muted py-4">
                                <div class="spinner-border spinner-border-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Right: Detail Panel -->
            <div class="col-md-8">
                <div id="payroll-detail" class="card bg-dark border-secondary h-100">
                    <div class="card-body d-flex align-items-center justify-content-center text-muted">
                        <div class="text-center">
                            <i class="bi bi-arrow-left fs-1 d-block mb-2"></i>
                            Pilih periode untuk melihat detail
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    await loadPeriods();
    document.getElementById('btn-create-period').addEventListener('click', openCreatePeriodModal);
}

async function loadPeriods() {
    const list = document.getElementById('period-list');
    try {
        const { data } = await supabase
            .from('payroll_periods')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(24);

        if (!data?.length) {
            list.innerHTML = `<div class="text-center text-muted py-4 px-3 small">Belum ada periode payroll</div>`;
            return;
        }

        list.innerHTML = data.map(p => {
            const statusColor = {
                draft: 'secondary', calculating: 'warning', calculated: 'info',
                approved: 'primary', paid: 'success'
            }[p.status] || 'secondary';
            return `<button class="list-group-item list-group-item-action bg-dark border-secondary payroll-period-btn"
                data-id="${p.id}" onclick="window.selectPeriod('${p.id}', ${JSON.stringify(p).replace(/"/g,'&quot;')})">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${MONTH_NAMES[p.month-1]} ${p.year}</strong>
                        <div class="small text-muted">${p.period_start} – ${p.period_end}</div>
                    </div>
                    <span class="badge bg-${statusColor}">${p.status}</span>
                </div>
            </button>`;
        }).join('');
    } catch (err) {
        list.innerHTML = `<div class="text-center text-danger py-4 small">${err.message}</div>`;
    }
}

window.selectPeriod = async (id, period) => {
    // Highlight selected
    document.querySelectorAll('.payroll-period-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-id="${id}"]`)?.classList.add('active');

    const detail = document.getElementById('payroll-detail');
    detail.innerHTML = `<div class="card-body"><div class="spinner-border spinner-border-sm me-2"></div>Memuat...</div>`;

    try {
        const { data: summaries } = await supabase
            .from('payroll_summaries')
            .select('*, employees(name, employee_id)')
            .eq('payroll_period_id', id)
            .order('employees(name)');

        const canCalculate = ['draft','calculated'].includes(period.status);
        const canApprove   = period.status === 'calculated';
        const canMarkPaid  = period.status === 'approved';

        const totalNet = (summaries||[]).reduce((s, r) => s + r.take_home_pay, 0);

        detail.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">${MONTH_NAMES[period.month-1]} ${period.year}
                    <span class="badge bg-${getStatusColor(period.status)} ms-2">${period.status}</span>
                </h6>
                <div class="d-flex gap-2">
                    ${canCalculate ? `<button class="btn btn-outline-info btn-sm" onclick="window.calculatePayroll('${id}')">
                        <i class="bi bi-calculator"></i> Hitung
                    </button>` : ''}
                    ${canApprove ? `<button class="btn btn-outline-success btn-sm" onclick="window.approvePayroll('${id}')">
                        <i class="bi bi-check-circle"></i> Setujui
                    </button>` : ''}
                    ${canMarkPaid ? `<button class="btn btn-success btn-sm" onclick="window.markPayrollPaid('${id}')">
                        <i class="bi bi-cash-stack"></i> Lunas
                    </button>` : ''}
                </div>
            </div>
            <div class="card-body">
                ${summaries?.length ? `
                    <div class="alert alert-dark d-flex justify-content-between align-items-center py-2 mb-3">
                        <span><i class="bi bi-people me-2"></i>${summaries.length} Karyawan</span>
                        <strong class="text-success">Total Take-Home: Rp ${fmt.format(totalNet)}</strong>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-dark table-sm align-middle mb-0">
                            <thead><tr>
                                <th>Karyawan</th><th>Penghasilan Kotor</th><th>Potongan</th>
                                <th class="text-success">Take-Home</th><th>Poin</th><th></th>
                            </tr></thead>
                            <tbody>
                                ${summaries.map(s => `<tr>
                                    <td>
                                        <div>${s.employees?.name || '–'}</div>
                                        <small class="text-muted">${s.employees?.employee_id||''}</small>
                                    </td>
                                    <td>Rp ${fmt.format(s.gross_earnings)}</td>
                                    <td class="text-danger">Rp ${fmt.format(s.total_deductions)}</td>
                                    <td class="text-success fw-bold">Rp ${fmt.format(s.take_home_pay)}</td>
                                    <td>
                                        <span class="badge bg-${s.actual_points >= s.target_points ? 'success' : 'warning'}">
                                            ${s.actual_points}/${s.target_points}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-xs btn-outline-secondary" onclick="window.viewPayslip('${id}','${s.employee_id}')">
                                            <i class="bi bi-receipt"></i>
                                        </button>
                                    </td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `<div class="text-center text-muted py-5">
                    <i class="bi bi-calculator fs-1 d-block mb-2"></i>
                    Payroll belum dihitung. Klik <strong>Hitung</strong> untuk memulai.
                </div>`}
            </div>
        `;
    } catch (err) {
        detail.innerHTML = `<div class="card-body text-danger">${err.message}</div>`;
    }
};

function getStatusColor(status) {
    return {draft:'secondary',calculating:'warning',calculated:'info',approved:'primary',paid:'success'}[status]||'secondary';
}

window.calculatePayroll = async (periodId) => {
    if (!confirm('Mulai hitung payroll? Ini akan menghitung ulang semua data.')) return;
    const btn = event.target.closest('button');
    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menghitung...';
    try {
        await apiCall('/payroll/calculate', { method: 'POST', body: JSON.stringify({ period_id: periodId }) });
        showToast('success', 'Payroll berhasil dihitung');
        await loadPeriods();
        const { data: p } = await supabase.from('payroll_periods').select('*').eq('id', periodId).single();
        window.selectPeriod(periodId, p);
    } catch (err) {
        showToast('error', 'Gagal: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-calculator"></i> Hitung';
    }
};

window.approvePayroll = async (periodId) => {
    if (!confirm('Setujui payroll ini? Status akan berubah menjadi "approved".')) return;
    try {
        await apiCall(`/payroll/approve`, { method: 'POST', body: JSON.stringify({ period_id: periodId }) });
        showToast('success', 'Payroll disetujui');
        await loadPeriods();
        const { data: p } = await supabase.from('payroll_periods').select('*').eq('id', periodId).single();
        window.selectPeriod(periodId, p);
    } catch (err) { showToast('error', 'Gagal: ' + err.message); }
};

window.markPayrollPaid = async (periodId) => {
    if (!confirm('Tandai payroll periode ini sebagai LUNAS?')) return;
    try {
        const { error } = await supabase.from('payroll_periods').update({
            status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }).eq('id', periodId);
        if (error) throw error;
        showToast('success', 'Status periode diupdate: Lunas');
        await loadPeriods();
        const { data: p } = await supabase.from('payroll_periods').select('*').eq('id', periodId).single();
        window.selectPeriod(periodId, p);
    } catch (err) { showToast('error', 'Gagal: ' + err.message); }
};

window.viewPayslip = (periodId, employeeId) => {
    window.open(`/payroll/slip?period=${periodId}&employee=${employeeId}`, '_blank');
};

function openCreatePeriodModal() {
    const now   = new Date();
    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody  = document.getElementById('crudModalBody');
    const saveBtn    = document.getElementById('save-crud-btn');
    if (!modalTitle || !modalBody) return;

    modalTitle.textContent = 'Buat Periode Payroll Baru';
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-6 mb-3">
                <label class="form-label">Tahun *</label>
                <input type="number" class="form-control" id="pp-year" value="${now.getFullYear()}" min="2020" max="2099" required>
            </div>
            <div class="col-6 mb-3">
                <label class="form-label">Bulan *</label>
                <select class="form-select" id="pp-month" required>
                    ${MONTH_NAMES.map((m,i) => `<option value="${i+1}" ${i===now.getMonth()?'selected':''}>${m}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col-6 mb-3">
                <label class="form-label">Awal Periode *</label>
                <input type="date" class="form-control" id="pp-start" required>
            </div>
            <div class="col-6 mb-3">
                <label class="form-label">Akhir Periode *</label>
                <input type="date" class="form-control" id="pp-end" required>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Catatan</label>
            <input type="text" class="form-control" id="pp-notes">
        </div>
    `;

    // Auto-fill period dates
    const autoFill = () => {
        const y = parseInt(document.getElementById('pp-year').value);
        const m = parseInt(document.getElementById('pp-month').value);
        document.getElementById('pp-start').value = `${y}-${String(m).padStart(2,'0')}-01`;
        const last = new Date(y, m, 0);
        document.getElementById('pp-end').value = last.toISOString().split('T')[0];
    };
    autoFill();
    setTimeout(() => {
        document.getElementById('pp-year')?.addEventListener('change', autoFill);
        document.getElementById('pp-month')?.addEventListener('change', autoFill);
    }, 100);

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('crudModal'));
    modal.show();

    saveBtn.onclick = async () => {
        const payload = {
            year:         parseInt(document.getElementById('pp-year').value),
            month:        parseInt(document.getElementById('pp-month').value),
            period_start: document.getElementById('pp-start').value,
            period_end:   document.getElementById('pp-end').value,
            notes:        document.getElementById('pp-notes').value || null,
        };
        try {
            const { error } = await supabase.from('payroll_periods').insert(payload);
            if (error) throw error;
            showToast('success', 'Periode baru dibuat');
            modal.hide();
            loadPeriods();
        } catch (err) { showToast('error', 'Gagal: ' + err.message); }
    };
}
