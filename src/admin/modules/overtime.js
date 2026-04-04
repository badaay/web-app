/**
 * Module: Overtime Management
 * Full implementation: list, add modal with multi-technician assignment
 */
import { supabase, apiCall } from '../../api/supabase.js';

const fmt = new Intl.NumberFormat('id-ID');

export async function initOvertime() {
    const container = document.getElementById('overtime-content');
    if (!container) return;

    container.innerHTML = `
        <div class="card bg-dark border-secondary">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Rekap Lembur</h5>
                <button class="btn btn-primary btn-sm" id="btn-add-overtime">
                    <i class="bi bi-plus-lg"></i> Tambah Lembur
                </button>
            </div>
            <div class="card-body">
                <!-- Filters -->
                <div class="row g-2 mb-3">
                    <div class="col-md-3">
                        <label class="form-label small text-muted">Dari Tanggal</label>
                        <input type="date" class="form-control form-control-sm" id="ot-filter-from">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small text-muted">Sampai Tanggal</label>
                        <input type="date" class="form-control form-control-sm" id="ot-filter-to">
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-outline-light btn-sm w-100" id="btn-ot-filter">
                            <i class="bi bi-funnel"></i> Filter
                        </button>
                    </div>
                </div>
                <!-- Table -->
                <div class="table-responsive">
                    <table class="table table-dark table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Tanggal</th><th>Deskripsi</th><th>Jam</th>
                                <th>Total Jam</th><th>Total Bayar</th><th>Teknisi</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="ot-table-body">
                            <tr><td colspan="7" class="text-center text-muted py-5">
                                <div class="spinner-border spinner-border-sm me-2"></div>Memuat...
                            </td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const now     = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const lastDay  = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];
    document.getElementById('ot-filter-from').value = firstDay;
    document.getElementById('ot-filter-to').value   = lastDay;

    await loadOvertime();
    document.getElementById('btn-ot-filter').addEventListener('click', loadOvertime);
    document.getElementById('btn-add-overtime').addEventListener('click', openOvertimeModal);
}

async function loadOvertime() {
    const tbody = document.getElementById('ot-table-body');
    const from  = document.getElementById('ot-filter-from').value;
    const to    = document.getElementById('ot-filter-to').value;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">
        <div class="spinner-border spinner-border-sm me-2"></div>Memuat...
    </td></tr>`;

    try {
        const res     = await apiCall(`/overtime?date_from=${from}&date_to=${to}&limit=100`);
        const records = res.data || [];

        if (!records.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>Tidak ada data lembur
            </td></tr>`;
            return;
        }

        tbody.innerHTML = records.map(r => {
            const techNames = (r.overtime_assignments || [])
                .map(a => a.employees?.name || '–')
                .join(', ');
            const perPerson = r.overtime_assignments?.[0]?.amount_earned
                ? 'Rp ' + fmt.format(r.overtime_assignments[0].amount_earned) + '/org'
                : '–';
            return `<tr>
                <td>${new Date(r.overtime_date).toLocaleDateString('id-ID')}</td>
                <td>
                    ${r.description}
                    ${r.overtime_type ? `<span class="badge bg-secondary ms-1">${r.overtime_type}</span>` : ''}
                </td>
                <td class="text-muted small">${r.start_time?.slice(0,5)} – ${r.end_time?.slice(0,5)}</td>
                <td>${r.total_hours} jam</td>
                <td class="text-success">Rp ${fmt.format(r.total_amount)}<br><small class="text-muted">${perPerson}</small></td>
                <td><small>${techNames || '–'}</small></td>
                <td>
                    <button class="btn btn-xs btn-outline-danger" onclick="window.deleteOvertime('${r.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${err.message}</td></tr>`;
    }
}

async function openOvertimeModal() {
    const { data: employees } = await supabase.from('employees').select('id, name').eq('status', 'Aktif').order('name');

    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody  = document.getElementById('crudModalBody');
    const saveBtn    = document.getElementById('save-crud-btn');
    if (!modalTitle || !modalBody) return;

    modalTitle.textContent = 'Tambah Lembur';
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-6 mb-3">
                <label class="form-label">Tanggal Lembur *</label>
                <input type="date" class="form-control" id="ot-date" required>
            </div>
            <div class="col-3 mb-3">
                <label class="form-label">Jam Mulai *</label>
                <input type="time" class="form-control" id="ot-start" required>
            </div>
            <div class="col-3 mb-3">
                <label class="form-label">Jam Selesai *</label>
                <input type="time" class="form-control" id="ot-end" required>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Deskripsi *</label>
            <input type="text" class="form-control" id="ot-desc" placeholder="e.g. Penarikan Kabel RT 05" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Jenis Lembur</label>
            <select class="form-select" id="ot-type">
                <option value="">– Pilih Jenis –</option>
                <option value="psb">PSB</option>
                <option value="backbone">Backbone</option>
                <option value="repair">Repair</option>
                <option value="cable_pull">Penarikan Kabel</option>
                <option value="other">Lainnya</option>
            </select>
        </div>
        <div class="mb-3">
            <label class="form-label">Teknisi yang Terlibat *</label>
            <div class="border border-secondary rounded p-2" style="max-height:150px;overflow-y:auto">
                ${(employees||[]).map(e => `
                    <div class="form-check">
                        <input class="form-check-input ot-tech-check" type="checkbox" value="${e.id}" id="ot-tech-${e.id}">
                        <label class="form-check-label" for="ot-tech-${e.id}">${e.name}</label>
                    </div>
                `).join('')}
            </div>
            <small class="text-muted">Total lembur akan dibagi rata antar teknisi dipilih.</small>
        </div>
    `;

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('crudModal'));
    modal.show();

    saveBtn.onclick = async () => {
        const techIds = [...document.querySelectorAll('.ot-tech-check:checked')].map(c => c.value);
        if (!techIds.length) { showToast('warning', 'Pilih minimal satu teknisi'); return; }

        const payload = {
            overtime_date: document.getElementById('ot-date').value,
            start_time:    document.getElementById('ot-start').value,
            end_time:      document.getElementById('ot-end').value,
            description:   document.getElementById('ot-desc').value,
            overtime_type: document.getElementById('ot-type').value || null,
            technician_ids: techIds
        };
        try {
            await apiCall('/overtime', { method: 'POST', body: JSON.stringify(payload) });
            showToast('success', 'Lembur berhasil dicatat');
            modal.hide();
            loadOvertime();
        } catch (err) { showToast('error', 'Error: ' + err.message); }
    };
}

window.deleteOvertime = async (id) => {
    if (!confirm('Hapus data lembur ini?')) return;
    try {
        await apiCall(`/overtime/${id}`, { method: 'DELETE' });
        showToast('info', 'Data lembur dihapus');
        loadOvertime();
    } catch (err) { showToast('error', err.message); }
};
