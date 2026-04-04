/**
 * Module: Attendance Management
 * Full implementation: table, filters, add/edit modal, monthly stats
 */
import { supabase, apiCall } from '../../api/supabase.js';

const fmt = new Intl.NumberFormat('id-ID');

export async function initAttendance() {
    const container = document.getElementById('attendance-content');
    if (!container) return;

    container.innerHTML = `
        <div class="card bg-dark border-secondary">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-calendar-check me-2"></i>Kehadiran Karyawan</h5>
                <button class="btn btn-primary btn-sm" id="btn-add-attendance">
                    <i class="bi bi-plus-lg"></i> Tambah Kehadiran
                </button>
            </div>
            <div class="card-body">
                <!-- Filters -->
                <div class="row g-2 mb-3">
                    <div class="col-md-3">
                        <label class="form-label small text-muted">Dari Tanggal</label>
                        <input type="date" class="form-control form-control-sm" id="att-filter-from">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small text-muted">Sampai Tanggal</label>
                        <input type="date" class="form-control form-control-sm" id="att-filter-to">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-muted">Karyawan</label>
                        <select class="form-select form-select-sm" id="att-filter-emp">
                            <option value="">Semua Karyawan</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-outline-light btn-sm w-100" id="btn-att-filter">
                            <i class="bi bi-funnel"></i> Filter
                        </button>
                    </div>
                </div>
                <!-- Stats -->
                <div class="row g-2 mb-3">
                    <div class="col-4">
                        <div class="card border-success bg-success bg-opacity-10 text-center py-2">
                            <div class="h4 mb-0 text-success" id="att-stat-present">–</div>
                            <small class="text-muted">Hadir</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="card border-warning bg-warning bg-opacity-10 text-center py-2">
                            <div class="h4 mb-0 text-warning" id="att-stat-late">–</div>
                            <small class="text-muted">Terlambat</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="card border-danger bg-danger bg-opacity-10 text-center py-2">
                            <div class="h4 mb-0 text-danger" id="att-stat-absent">–</div>
                            <small class="text-muted">Tidak Hadir</small>
                        </div>
                    </div>
                </div>
                <!-- Table -->
                <div class="table-responsive">
                    <table class="table table-dark table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Tanggal</th><th>Karyawan</th><th>Jam Masuk</th>
                                <th>Terlambat</th><th>Potongan</th><th>Status</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="att-table-body">
                            <tr><td colspan="7" class="text-center text-muted py-5">
                                <div class="spinner-border spinner-border-sm me-2"></div>Memuat...
                            </td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Default month range
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const lastDay  = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];
    document.getElementById('att-filter-from').value = firstDay;
    document.getElementById('att-filter-to').value   = lastDay;

    await loadEmployeeOptions();
    await loadAttendance();

    document.getElementById('btn-att-filter').addEventListener('click', loadAttendance);
    document.getElementById('btn-add-attendance').addEventListener('click', () => openAttendanceModal());
}

async function loadEmployeeOptions() {
    const { data } = await supabase.from('employees').select('id, name').eq('status', 'Aktif').order('name');
    const sel = document.getElementById('att-filter-emp');
    (data || []).forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id; opt.textContent = e.name;
        sel.appendChild(opt);
    });
}

async function loadAttendance() {
    const tbody = document.getElementById('att-table-body');
    const from  = document.getElementById('att-filter-from').value;
    const to    = document.getElementById('att-filter-to').value;
    const emp   = document.getElementById('att-filter-emp').value;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
        <div class="spinner-border spinner-border-sm me-2"></div>Memuat...
    </td></tr>`;

    let url = `/attendance?date_from=${from}&date_to=${to}&limit=200`;
    if (emp) url += `&employee_id=${emp}`;

    try {
        const res = await apiCall(url);
        const records = res.data || [];

        // Update stats
        document.getElementById('att-stat-present').textContent = records.filter(r => !r.is_absent).length;
        document.getElementById('att-stat-late').textContent    = records.filter(r => r.late_minutes > 0).length;
        document.getElementById('att-stat-absent').textContent  = records.filter(r => r.is_absent).length;

        if (!records.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>Tidak ada data kehadiran
            </td></tr>`;
            return;
        }

        tbody.innerHTML = records.map(r => {
            const statusBadge = r.is_absent
                ? `<span class="badge bg-danger">Absen</span>`
                : r.late_minutes > 0
                    ? `<span class="badge bg-warning text-dark">Terlambat ${r.late_minutes} mnt</span>`
                    : `<span class="badge bg-success">Hadir</span>`;
            return `<tr>
                <td>${new Date(r.attendance_date).toLocaleDateString('id-ID')}</td>
                <td>${r.employees?.name || '–'}</td>
                <td>${r.check_in_time || '<span class="text-muted">–</span>'}</td>
                <td>${r.late_minutes > 0 ? r.late_minutes + ' mnt' : '–'}</td>
                <td class="${r.deduction_amount > 0 ? 'text-danger' : ''}">
                    ${r.deduction_amount > 0 ? 'Rp ' + fmt.format(r.deduction_amount) : '–'}
                </td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-xs btn-outline-secondary" onclick="window.editAttendance('${r.id}', ${JSON.stringify(r).replace(/"/g,'&quot;')})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-danger ms-1" onclick="window.deleteAttendance('${r.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${err.message}</td></tr>`;
    }
}

async function openAttendanceModal(existing = null) {
    const { data: employees } = await supabase.from('employees').select('id, name').eq('status', 'Aktif').order('name');

    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody  = document.getElementById('crudModalBody');
    const saveBtn    = document.getElementById('save-crud-btn');
    if (!modalTitle || !modalBody) return;

    modalTitle.textContent = existing ? 'Edit Kehadiran' : 'Tambah Kehadiran';
    modalBody.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Karyawan *</label>
            <select class="form-select" id="att-emp-id" ${existing ? 'disabled' : ''} required>
                <option value="">Pilih...</option>
                ${(employees||[]).map(e => `<option value="${e.id}" ${existing?.employee_id===e.id?'selected':''}>${e.name}</option>`).join('')}
            </select>
        </div>
        <div class="mb-3">
            <label class="form-label">Tanggal *</label>
            <input type="date" class="form-control" id="att-date" value="${existing?.attendance_date||''}" required>
        </div>
        <div class="row">
            <div class="col-6 mb-3">
                <label class="form-label">Jam Masuk</label>
                <input type="time" class="form-control" id="att-check-in" value="${existing?.check_in_time||''}">
            </div>
            <div class="col-6 mb-3">
                <label class="form-label">Jam Keluar</label>
                <input type="time" class="form-control" id="att-check-out" value="${existing?.check_out_time||''}">
            </div>
        </div>
        <div class="mb-3 form-check">
            <input class="form-check-input" type="checkbox" id="att-absent" ${existing?.is_absent?'checked':''}>
            <label class="form-check-label">Tidak Hadir (Absen)</label>
        </div>
        <div class="mb-3">
            <label class="form-label">Catatan</label>
            <input type="text" class="form-control" id="att-notes" value="${existing?.notes||''}">
        </div>
    `;

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('crudModal'));
    modal.show();

    saveBtn.onclick = async () => {
        const payload = {
            employee_id:    existing ? existing.employee_id : document.getElementById('att-emp-id').value,
            attendance_date: document.getElementById('att-date').value,
            check_in_time:  document.getElementById('att-check-in').value  || null,
            check_out_time: document.getElementById('att-check-out').value || null,
            is_absent:      document.getElementById('att-absent').checked,
            notes:          document.getElementById('att-notes').value || null,
        };
        try {
            if (existing) {
                await apiCall(`/attendance/${existing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
            } else {
                await apiCall('/attendance', { method: 'POST', body: JSON.stringify(payload) });
            }
            showToast('success', 'Data kehadiran berhasil disimpan');
            modal.hide();
            loadAttendance();
        } catch (err) { showToast('error', err.message); }
    };
}

window.editAttendance = (id, data) => openAttendanceModal(data);
window.deleteAttendance = async (id) => {
    if (!confirm('Hapus record kehadiran ini?')) return;
    try {
        await apiCall(`/attendance/${id}`, { method: 'DELETE' });
        showToast('info', 'Data dihapus');
        loadAttendance();
    } catch (err) { showToast('error', err.message); }
};
