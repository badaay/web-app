/**
 * Module: Payroll Management
 * Full implementation: periods list, create period, trigger calculation,
 * approve, view per-employee breakdown
 */
import { supabase, apiCall, supabaseB } from '../../api/supabase.js';

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
        const { data } = await supabaseB
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
                                        <span class="badge bg-${s.actual_points >= s.target_points ? 'success' : 'warning'} cursor-pointer" 
                                            onclick="window.viewPointsDetail('${id}','${s.employee_id}')" title="Klik untuk detail poin">
                                            ${s.actual_points}/${s.target_points}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-xs btn-outline-warning me-1" onclick="window.manageAdjustments('${id}','${s.employee_id}', '${s.employees?.name}')" title="Kelola Bonus/Potongan">
                                            <i class="bi bi-patch-plus"></i>
                                        </button>
                                        <button class="btn btn-xs btn-outline-secondary" onclick="window.viewPayslip('${id}','${s.employee_id}')" title="Lihat Slip Gaji">
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

window.viewPointsDetail = async (periodId, employeeId) => {
    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody  = document.getElementById('crudModalBody');
    const saveBtn    = document.getElementById('save-crud-btn');
    if (!modalTitle || !modalBody) return;

    modalTitle.innerHTML = `<i class="bi bi-star-fill text-warning me-2"></i>Detail Pengerjaan & Poin`;
    modalBody.innerHTML = `<div class="text-center p-4"><div class="spinner-border text-primary"></div></div>`;
    saveBtn.classList.add('d-none'); // Hide save button

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('crudModal'));
    modal.show();

    try {
        const res = await apiCall(`/payroll/points-detail?period_id=${periodId}&employee_id=${employeeId}`);
        if (!res.items?.length) {
            modalBody.innerHTML = `<div class="alert alert-info">Tidak ada data pengerjaan (Closed) di periode ini.</div>`;
            return;
        }

        modalBody.innerHTML = `
            <div class="mb-3 d-flex justify-content-between align-items-center">
                <span class="text-muted small">Periode: ${res.period_range}</span>
                <strong class="text-success">Total: ${res.total_points} Poin</strong>
            </div>
            <div class="table-responsive">
                <table class="table table-dark table-sm align-middle">
                    <thead><tr class="text-muted" style="font-size: 0.75rem">
                        <th>Tanggal</th><th>Pekerjaan</th><th>Customer</th><th class="text-end">Poin</th>
                    </tr></thead>
                    <tbody>
                        ${res.items.map(item => `
                            <tr>
                                <td class="small">${new Date(item.work_orders.completed_at).toLocaleDateString('id-ID')}</td>
                                <td>
                                    <div class="small fw-bold">${item.work_orders.title}</div>
                                    <span class="badge" style="background-color: ${item.work_orders.type?.color || '#333'}; font-size: 0.6rem">
                                        <i class="bi ${item.work_orders.type?.icon || 'bi-dot'} me-1"></i>${item.work_orders.type?.name || 'WO'}
                                    </span>
                                </td>
                                <td>
                                    <div class="small">${item.work_orders.customer?.name || '–'}</div>
                                    <div class="text-muted" style="font-size: 0.7rem">${item.work_orders.customer?.customer_code || ''}</div>
                                </td>
                                <td class="text-end fw-bold text-accent">${item.points_earned}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        modalBody.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }

    // Reset modal on close
    document.getElementById('crudModal').addEventListener('hidden.bs.modal', () => {
        saveBtn.classList.remove('d-none');
    }, { once: true });
};

window.manageAdjustments = async (periodId, employeeId, employeeName) => {
    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody  = document.getElementById('crudModalBody');
    const saveBtn    = document.getElementById('save-crud-btn');
    if (!modalTitle || !modalBody) return;

    modalTitle.innerHTML = `<i class="bi bi-patch-plus me-2"></i>Kelola Bonus & Potongan: ${employeeName}`;
    modalBody.innerHTML = `<div class="text-center p-4"><div class="spinner-border text-primary"></div></div>`;
    saveBtn.innerText = 'Tambah Penyesuaian';
    
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('crudModal'));
    modal.show();

    const loadAdjustments = async () => {
        try {
            const data = await apiCall(`/payroll/adjustments?period_id=${periodId}&employee_id=${employeeId}`);
            modalBody.innerHTML = `
                <div class="mb-4">
                    <h6>Daftar Penyesuaian</h6>
                    <div class="list-group list-group-flush border border-secondary rounded overflow-hidden">
                        ${data?.length ? data.map(adj => `
                            <div class="list-group-item bg-dark border-secondary d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="fw-bold ${adj.adjustment_type === 'bonus' ? 'text-success' : 'text-danger'}">
                                        ${adj.adjustment_type === 'bonus' ? '+' : '-'} Rp ${fmt.format(adj.amount)}
                                    </div>
                                    <div class="small text-white-50">${adj.reason}</div>
                                    <span class="badge ${adj.status === 'approved' ? 'bg-success' : 'bg-warning'} x-small">
                                        ${adj.status}
                                    </span>
                                </div>
                                <button class="btn btn-link text-danger p-0" onclick="window.deleteAdjustment('${adj.id}', '${periodId}', '${employeeId}', '${employeeName}')" title="Hapus">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        `).join('') : '<div class="list-group-item bg-dark border-secondary text-muted small py-3 text-center">Belum ada penyesuaian manual</div>'}
                    </div>
                </div>

                <hr class="border-secondary">

                <h6>Form Penyesuaian Baru</h6>
                <div class="row g-2 mt-1">
                    <div class="col-md-6">
                        <label class="form-label small">Tipe</label>
                        <select id="adj-type" class="form-select form-select-sm">
                            <option value="bonus">Bonus / Insentif (+)</option>
                            <option value="deduction">Potongan (-)</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Jumlah (Rp)</label>
                        <input type="number" id="adj-amount" class="form-control form-control-sm" placeholder="0">
                    </div>
                    <div class="col-12 mt-2">
                        <label class="form-label small">Alasan / Keterangan</label>
                        <input type="text" id="adj-reason" class="form-control form-control-sm" placeholder="Contoh: Bonus lembur proyek">
                    </div>
                </div>
            `;
        } catch (err) {
            modalBody.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    };

    await loadAdjustments();

    saveBtn.onclick = async () => {
        const payload = {
            payroll_period_id: periodId,
            employee_id: employeeId,
            adjustment_type: document.getElementById('adj-type').value,
            amount: parseInt(document.getElementById('adj-amount').value),
            reason: document.getElementById('adj-reason').value,
            status: 'approved' // Direct approval for now since added by Admin
        };

        if (!payload.amount || !payload.reason) {
            showToast('warning', 'Jumlah dan Alasan wajib diisi');
            return;
        }

        try {
            saveBtn.disabled = true;
            await apiCall('/payroll/adjustments', { method: 'POST', body: JSON.stringify(payload) });
            showToast('success', 'Penyesuaian ditambahkan');
            saveBtn.disabled = false;
            await loadAdjustments();
            // Refresh main table if possible, or user can re-calculate
        } catch (err) {
            showToast('error', err.message);
            saveBtn.disabled = false;
        }
    };
};

window.deleteAdjustment = async (adjId, periodId, employeeId, employeeName) => {
    if (!confirm('Hapus penyesuaian ini?')) return;
    try {
        await apiCall(`/payroll/adjustments/${adjId}`, { method: 'DELETE' });
        showToast('success', 'Penyesuaian dihapus');
        window.manageAdjustments(periodId, employeeId, employeeName);
    } catch (err) {
        showToast('error', err.message);
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
