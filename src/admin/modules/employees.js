import { supabase } from '../../api/supabase.js';

export async function initEmployees() {
    const listContainer = document.getElementById('employees-list');
    const addBtn = document.getElementById('add-employee-btn');

    if (addBtn) addBtn.onclick = () => showEmployeeModal();

    async function loadEmployees() {
        listContainer.innerHTML = 'Memuat karyawan...';
        // Fetch employees with their roles
        const { data, error } = await supabase
            .from('employees')
            .select('*, roles(name)')
            .order('name');

        if (error) {
            listContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="text-muted text-center py-4">Tidak ada data karyawan ditemukan.</div>';
            return;
        }

        listContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Nama / ID</th>
                            <th>Role / Jabatan</th>
                            <th>Status</th>
                            <th>Masuk</th>
                            <th>Pendidikan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(emp => `
                            <tr>
                                <td>
                                    <div class="fw-bold">${emp.name}</div>
                                    <div class="small text-white-50">${emp.employee_id}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${emp.roles?.name || '-'}</div>
                                    <div class="small text-white-50">${emp.position}</div>
                                </td>
                                <td>
                                    <span class="badge ${emp.status === 'Aktif' ? 'bg-success' : 'bg-danger'}">
                                        ${emp.status}
                                    </span>
                                </td>
                                <td>${emp.join_date || '-'}</td>
                                <td>${emp.education || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-emp" data-id="${emp.id}">Edit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.querySelectorAll('.edit-emp').forEach(btn => {
            btn.onclick = () => showEmployeeModal(data.find(e => e.id === btn.dataset.id));
        });
    }

    async function showEmployeeModal(emp = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        // Fetch roles for dropdown
        const { data: roles } = await supabase.from('roles').select('id, name').order('name');

        modalTitle.innerText = emp ? 'Edit Karyawan' : 'Tambah Karyawan';
        modalBody.innerHTML = `
            <form id="employee-form" class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nama Lengkap</label>
                    <input type="text" class="form-control" id="emp-name" value="${emp?.name || ''}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">ID Karyawan</label>
                    <input type="text" class="form-control" id="emp-id" value="${emp?.employee_id || ''}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Role Aplikasi</label>
                    <select class="form-select" id="emp-role-id">
                        <option value="">Pilih Role...</option>
                        ${roles?.map(r => `<option value="${r.id}" ${emp?.role_id === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Jabatan (Struktural)</label>
                    <input type="text" class="form-control" id="emp-position" value="${emp?.position || ''}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Status</label>
                    <select class="form-select" id="emp-status">
                        <option value="Aktif" ${emp?.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
                        <option value="Non-Aktif" ${emp?.status === 'Non-Aktif' ? 'selected' : ''}>Non-Aktif</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tempat Lahir</label>
                    <input type="text" class="form-control" id="emp-birthplace" value="${emp?.birth_place || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tanggal Lahir</label>
                    <input type="date" class="form-control" id="emp-birthdate" value="${emp?.birth_date || ''}">
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label">Alamat</label>
                    <textarea class="form-control" id="emp-address" rows="2">${emp?.address || ''}</textarea>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tanggal Masuk</label>
                    <input type="date" class="form-control" id="emp-join-date" value="${emp?.join_date || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Pendidikan Terakhir</label>
                    <input type="text" class="form-control" id="emp-education" value="${emp?.education || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Training</label>
                    <select class="form-select" id="emp-training">
                        <option value="Ya" ${emp?.training === 'Ya' ? 'selected' : ''}>Ya</option>
                        <option value="Tidak" ${emp?.training === 'Tidak' ? 'selected' : ''}>Tidak</option>
                    </select>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">BPJS</label>
                    <select class="form-select" id="emp-bpjs">
                        <option value="Ya" ${emp?.bpjs === 'Ya' ? 'selected' : ''}>Ya</option>
                        <option value="Tidak" ${emp?.bpjs === 'Tidak' ? 'selected' : ''}>Tidak</option>
                    </select>
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const formData = {
                name: document.getElementById('emp-name').value,
                employee_id: document.getElementById('emp-id').value,
                role_id: document.getElementById('emp-role-id').value || null,
                position: document.getElementById('emp-position').value,
                status: document.getElementById('emp-status').value,
                birth_place: document.getElementById('emp-birthplace').value,
                birth_date: document.getElementById('emp-birthdate').value,
                address: document.getElementById('emp-address').value,
                join_date: document.getElementById('emp-join-date').value,
                education: document.getElementById('emp-education').value,
                training: document.getElementById('emp-training').value,
                bpjs: document.getElementById('emp-bpjs').value
            };

            if (!formData.name || !formData.employee_id) return alert('Nama dan ID wajib diisi.');

            let result;
            if (emp) {
                result = await supabase.from('employees').update(formData).eq('id', emp.id);
            } else {
                result = await supabase.from('employees').insert([formData]);
            }

            if (result.error) {
                alert('Gagal menyimpan: ' + result.error.message);
            } else {
                modal.hide();
                loadEmployees();
            }
        };

        modal.show();
    }

    loadEmployees();
}
