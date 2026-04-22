/**
 * Module: Overtime Management
 * Full implementation: list, add modal with multi-technician assignment
 */
import { supabase, apiCall } from '../../../api/supabase.js';

const fmt = new Intl.NumberFormat('id-ID');
let currentPage = 1;
const pageSize = 15;

export async function initOvertime() {
    const container = document.getElementById('overtime-content');
    if (!container) return;

    container.innerHTML = `
        <div class="card bg-dark border-secondary">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Rekap Lembur</h5>
                <div class="d-flex align-items-center gap-3">
                    <span id="ot-total-count" class="badge bg-secondary">Total: 0</span>
                    <button class="btn btn-primary btn-sm" id="btn-add-overtime">
                        <i class="bi bi-plus-lg"></i> Tambah Lembur
                    </button>
                </div>
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
                    <div class="col-md-2 mb-3 d-flex align-items-end">
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
                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="text-muted small" id="ot-pagination-info">Menampilkan 0 - 0</div>
                    <nav>
                        <ul class="pagination pagination-sm mb-0" id="ot-pagination-controls">
                            <!-- Pagination buttons injected here -->
                        </ul>
                    </nav>
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
    document.getElementById('btn-ot-filter').addEventListener('click', () => {
        currentPage = 1;
        loadOvertime();
    });
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
        const offset = (currentPage - 1) * pageSize;
        const res = await apiCall(`/overtime?date_from=${from}&date_to=${to}&limit=${pageSize}&offset=${offset}`);
        const records = res.data || [];
        const total = res.count || 0;

        document.getElementById('ot-total-count').innerText = `Total: ${total}`;

        if (!records.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>Tidak ada data lembur
            </td></tr>`;
            renderPagination(0);
            return;
        }

        tbody.innerHTML = records.map(r => {
            return `<tr>
                <td>${new Date(r.overtime_date).toLocaleDateString('id-ID')}</td>
                <td>
                    ${r.description}
                    ${r.overtime_type ? `<span class="badge bg-secondary ms-1">${r.overtime_type}</span>` : ''}
                </td>
                <td class="text-muted small">${r.start_time?.slice(0,5)} – ${r.end_time?.slice(0,5)}</td>
                <td>${r.total_hours} jam</td>
                <td class="text-success">Rp ${fmt.format(r.total_amount)}</td>
                <td>
                    <div>${r.technician_name}</div>
                    <small class="text-muted">${r.technician_code}</small>
                </td>
                <td>
                    <button class="btn btn-xs btn-outline-danger" onclick="window.deleteOvertime('${r.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

        renderPagination(total);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${err.message}</td></tr>`;
    }
}

function renderPagination(total) {
    const controls = document.getElementById('ot-pagination-controls');
    const info = document.getElementById('ot-pagination-info');
    if (!controls || !info) return;

    const totalPages = Math.ceil(total / pageSize);
    const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);

    info.innerText = `Menampilkan ${start} - ${end} dari ${total}`;

    let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="window.changeOvertimePage(${currentPage - 1})"><i class="bi bi-chevron-left"></i></button>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="window.changeOvertimePage(${i})">${i}</button>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    html += `
        <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
            <button class="page-link" onclick="window.changeOvertimePage(${currentPage + 1})"><i class="bi bi-chevron-right"></i></button>
        </li>
    `;

    controls.innerHTML = html;
}

window.changeOvertimePage = (page) => {
    currentPage = page;
    loadOvertime();
};

function generateTimeOptions() {
    let options = '';
    // Generate 30-minute intervals from 16:00 to 21:00
    for (let hour = 16; hour <= 21; hour++) {
        for (let min of ['00', '30']) {
            // Stop exactly at 21:00
            if (hour === 21 && min === '30') break;
            const time = `${String(hour).padStart(2, '0')}:${min}`;
            options += `<option value="${time}">${time}</option>`;
        }
    }
    return options;
}

async function openOvertimeModal() {
    // Fetch only Technicians and SPV Technicians for assignment
    const { data: employees } = await supabase
        .from('employees')
        .select('id, name, roles!inner(code)')
        .eq('status', 'Aktif')
        .in('roles.code', ['TECH', 'SPV_TECH'])
        .order('name');

    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody  = document.getElementById('crudModalBody');
    const saveBtn    = document.getElementById('save-crud-btn');
    if (!modalTitle || !modalBody) return;

    const timeOptions = generateTimeOptions();
    const today = new Date().toISOString().split('T')[0];

    modalTitle.textContent = 'Tambah Lembur';
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-6 mb-3">
                <label class="form-label">Tanggal Lembur *</label>
                <input type="date" class="form-control" id="ot-date" value="${today}" required>
            </div>
            <div class="col-3 mb-3">
                <label class="form-label">Jam Mulai *</label>
                <select class="form-select font-monospace" id="ot-start" required>
                    ${timeOptions}
                </select>
            </div>
            <div class="col-3 mb-3">
                <label class="form-label">Jam Selesai *</label>
                <select class="form-select font-monospace" id="ot-end" required>
                    ${timeOptions}
                </select>
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
            <div class="tech-scroll-box">
                ${(employees||[]).map(e => `
                    <label class="tech-item" for="ot-tech-${e.id}">
                        <input class="form-check-input ot-tech-check m-0 me-3" type="checkbox" value="${e.id}" id="ot-tech-${e.id}">
                        <span class="text-light fs-6">${e.name}</span>
                    </label>
                `).join('')}
            </div>
            <small class="text-muted">Total lembur akan dibagi rata antar teknisi dipilih.</small>
        </div>
    `;

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('crudModal'));
    
    // Set default times within the 16:00-21:00 range
    document.getElementById('ot-start').value = '16:00';
    document.getElementById('ot-end').value   = '18:00';
    
    const startEl = document.getElementById('ot-start');
    const endEl   = document.getElementById('ot-end');
    
    const validateTimes = () => {
        if (endEl.value && startEl.value && endEl.value <= startEl.value) {
            showToast('warning', 'Jam selesai harus lebih dari jam mulai');
            endEl.classList.add('is-invalid');
        } else {
            endEl.classList.remove('is-invalid');
        }
    };
    
    startEl.addEventListener('change', validateTimes);
    endEl.addEventListener('change', validateTimes);
    
    modal.show();

    saveBtn.onclick = async () => {
        const techIds = [...document.querySelectorAll('.ot-tech-check:checked')].map(c => c.value);
        if (!techIds.length) { showToast('warning', 'Pilih minimal satu teknisi'); return; }

        const date      = document.getElementById('ot-date').value;
        const startTime = document.getElementById('ot-start').value;
        const endTime   = document.getElementById('ot-end').value;

        if (!date) { showToast('warning', 'Tanggal harus diisi'); return; }
        if (endTime <= startTime) {
            showToast('warning', 'Jam selesai harus lebih dari jam mulai');
            return;
        }

        const payload = {
            overtime_date: date,
            start_time:    startTime,
            end_time:      endTime,
            description:   document.getElementById('ot-desc').value,
            overtime_type: document.getElementById('ot-type').value || null,
            technician_ids: techIds
        };

        const originalHtml = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...`;

        try {
            await apiCall('/overtime', { method: 'POST', body: JSON.stringify(payload) });
            showToast('success', 'Lembur berhasil dicatat');
            modal.hide();
            loadOvertime();
        } catch (err) { 
            showToast('error', 'Error: ' + err.message); 
            // Revert button if error
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;
        }
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
