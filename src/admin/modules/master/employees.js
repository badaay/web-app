import { supabase, apiCall } from '../../../api/supabase.js';
import { showToast } from '../../utils/toast.js';
import { getSpinner } from '../../utils/ui-common.js';
import { APP_BASE_URL } from '../../../config.js';
import { initCurrencyMask } from '../../utils/masking.js';

export async function initEmployees() {
    const listContainer = document.getElementById('employees-list');
    const addBtn = document.getElementById('add-employee-btn');

    if (addBtn) addBtn.onclick = () => showEmployeeModal();

    async function loadEmployees() {
        listContainer.innerHTML = getSpinner('Memuat karyawan...');
        const { data, error } = await supabase
            .from('employees')
            .select('*, roles(name)')
            .order('name');

        if (error) {
            listContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        if (data.length === 0) {
            listContainer.innerHTML = `
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-person-x fs-1 d-block mb-3"></i>
                    Tidak ada data karyawan ditemukan.
                </div>`;
            return;
        }

        listContainer.innerHTML = `
            <div class="table-container shadow-sm">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light text-dark">
                        <tr>
                            <th>Nama / ID</th>
                            <th>Role / Jabatan</th>
                            <th>Status</th>
                            <th>Masuk</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(emp => `
                            <tr>
                                <td>
                                    <div class="fw-bold">
                                        <a href="${APP_BASE_URL}/activity.html?eid=${emp.employee_id}" class="text-info text-decoration-none" target="_blank">
                                            <i class="bi bi-person-badge me-1 small"></i>${emp.name}
                                        </a>
                                    </div>
                                    <div class="small text-white-50">${emp.employee_id}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${emp.roles?.name || '-'}</div>
                                    <div class="small text-white-50">${emp.position}</div>
                                </td>
                                <td>
                                    <span class="badge rounded-pill px-3 ${emp.status === 'Aktif' ? 'bg-success' : 'bg-danger'}">
                                        ${emp.status}
                                    </span>
                                </td>
                                <td>${emp.join_date || '-'}</td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary edit-emp" data-id="${emp.id}" title="Edit Profil">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success salary-emp" data-id="${emp.id}" title="Konfigurasi Gaji">
                                            <i class="bi bi-currency-dollar"></i>
                                        </button>
                                    </div>
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

        document.querySelectorAll('.salary-emp').forEach(btn => {
            btn.onclick = () => showSalaryModal(btn.dataset.id);
        });
    }

    async function showEmployeeModal(emp = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        const { data: roles } = await supabase.from('roles').select('id, name').order('name');

        modalTitle.innerText = emp ? 'Edit Profil Karyawan' : 'Tambah Karyawan Baru';
        modalBody.innerHTML = `
            <form id="employee-form" class="row g-3">
                <input type="hidden" name="id" value="${emp?.id || ''}">
                <div class="col-md-6">
                    <label class="form-label text-white-50 small">Nama Lengkap</label>
                    <input type="text" class="form-control bg-vscode-input border-secondary text-white" name="name" value="${emp?.name || ''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label text-white-50 small">ID Karyawan</label>
                    <input type="text" class="form-control bg-vscode-input border-secondary text-white" name="employee_id" value="${emp?.employee_id || ''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label text-white-50 small">Email</label>
                    <input type="email" class="form-control bg-vscode-input border-secondary text-white" name="email" value="${emp?.email || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label text-white-50 small">No. WhatsApp</label>
                    <input type="text" class="form-control bg-vscode-input border-secondary text-white" name="phone" value="${emp?.phone || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label text-white-50 small">Jabatan</label>
                    <input type="text" class="form-control bg-vscode-input border-secondary text-white" name="position" value="${emp?.position || ''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label text-white-50 small">Role Sistem</label>
                    <select class="form-select bg-vscode-input border-secondary text-white" name="role_id">
                        <option value="">Pilih Role...</option>
                        ${roles?.map(r => `<option value="${r.id}" ${emp?.role_id === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label text-white-50 small">Tgl Lahir</label>
                    <input type="date" class="form-control bg-vscode-input border-secondary text-white" name="birth_date" value="${emp?.birth_date || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label text-white-50 small">Tgl Bergabung</label>
                    <input type="date" class="form-control bg-vscode-input border-secondary text-white" name="join_date" value="${emp?.join_date || ''}">
                </div>
                <div class="col-md-12">
                    <label class="form-label text-white-50 small">Status</label>
                    <select class="form-select bg-vscode-input border-secondary text-white" name="status">
                        <option value="Aktif" ${emp?.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
                        <option value="Non-Aktif" ${emp?.status === 'Non-Aktif' ? 'selected' : ''}>Non-Aktif</option>
                    </select>
                </div>
            </form>
        `;

        modal.show();

        saveBtn.onclick = async () => {
            const formElement = document.getElementById('employee-form');
            if (!formElement.reportValidity()) return;

            const formData = new FormData(formElement);
            const data = Object.fromEntries(formData.entries());
            
            // Sanitize dates
            if (data.birth_date === "") data.birth_date = null;
            if (data.join_date === "") data.join_date = null;

            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

            try {
                if (data.id) {
                    await apiCall(`/admin/create-user`, {
                        method: 'PATCH',
                        body: JSON.stringify(data)
                    });
                } else {
                    await apiCall(`/admin/create-user`, {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                }

                showToast(data.id ? 'Profil diperbarui' : 'Karyawan ditambahkan', 'success');
                modal.hide();
                loadEmployees();
            } catch (err) {
                showToast(err.message || 'Terjadi kesalahan sistem saat menyimpan profil', 'danger');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = 'Simpan';
            }
        };
    }

    async function showSalaryModal(employeeId) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = 'Memuat Konfigurasi Gaji...';
        modalBody.innerHTML = getSpinner('Mengambil data payroll...');
        modal.show();

        try {
            const [configs, empData] = await Promise.all([
                apiCall('/admin/salary-config?employee_id=' + employeeId).catch(e => { throw new Error('Gagal mengambil konfigurasi: ' + (e.message || 'Unknown error')); }),
                supabase.from('employees').select('name, target_monthly_points, base_salary').eq('id', employeeId).single()
            ]);
            
            if (empData.error) throw new Error('Gagal mengambil data karyawan: ' + empData.error.message);

            const config = Array.isArray(configs) && configs.length > 0 ? configs[0] : null;
            const empName = empData.data?.name || 'Karyawan';

            modalTitle.innerText = `Konfigurasi Gaji: ${empName}`;
            modalBody.innerHTML = `
                <form id="salary-config-form" class="row g-3">
                    <input type="hidden" name="id" value="${config?.id || ''}">
                    <input type="hidden" name="employee_id" value="${employeeId}">
                    
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Gaji Pokok</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="base_salary" value="${empData.data?.base_salary || 0}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Target Poin/Bulan</label>
                        <input type="number" class="form-control bg-vscode-input border-secondary text-white" name="target_monthly_points" value="${empData.data?.target_monthly_points || 0}">
                    </div>
                    
                    <hr class="border-secondary my-3">
                    <h6 class="text-info mb-2 small fw-bold"><i class="bi bi-plus-circle me-2"></i>Tunjangan Tetap</h6>
                    
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Tunj. Jabatan</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="position_allowance" value="${config?.position_allowance || 0}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Tunj. Tambahan</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="additional_allowance" value="${config?.additional_allowance || 0}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Tunj. Kuota/Internet</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="quota_allowance" value="${config?.quota_allowance || 0}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Tunj. Pendidikan</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="education_allowance" value="${config?.education_allowance || 0}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Tunj. Makan & Transpor</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="transport_meal_allowance" value="${config?.transport_meal_allowance || 0}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Tunj. Lapangan</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="field_allowance" value="${config?.field_allowance || 0}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Tunj. Komunikasi</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="communication_allowance" value="${config?.communication_allowance || 0}">
                    </div>
                </form>
            `;

            initCurrencyMask('.currency-mask');

            saveBtn.onclick = async () => {
                const formElement = document.getElementById('salary-config-form');
                if (!formElement.reportValidity()) return;

                const formData = new FormData(formElement);
                const data = Object.fromEntries(formData.entries());
                
                const formElements = document.getElementById('salary-config-form').elements;
                const numericFields = ['base_salary', 'position_allowance', 'additional_allowance', 'quota_allowance', 'education_allowance', 'transport_meal_allowance', 'field_allowance', 'communication_allowance'];
                numericFields.forEach(k => {
                    const rawVal = formElements[k].rawValue;
                    const parsedVal = parseInt(formElements[k].value.replace(/\D/g, ''), 10);
                    data[k] = rawVal !== undefined ? rawVal : (parsedVal || 0);
                });
                
                data['target_monthly_points'] = parseInt(formElements['target_monthly_points'].value, 10) || 0;

                // Inject timezone-safe effective_from to prevent UTC misalignment on the Edge Function
                if (!data['effective_from']) {
                    const localDate = new Date();
                    const offset = localDate.getTimezoneOffset() * 60000;
                    data['effective_from'] = new Date(localDate.getTime() - offset).toISOString().split('T')[0];
                }

                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

                try {
                    await apiCall('/admin/salary-config', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    showToast('Konfigurasi gaji disimpan', 'success');
                    modal.hide();
                    loadEmployees(); // Reload to reflect any base_salary changes in list if needed
                } catch (err) {
                    showToast(err.message || 'Gagal menyimpan konfigurasi gaji', 'danger');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerText = 'Simpan';
                }
            };
        } catch (err) {
            modalBody.innerHTML = `<div class="text-danger p-3">Gagal memuat: ${err.message || 'Terjadi kesalahan sistem'}</div>`;
        }
    }

    // Initial load
    loadEmployees();
}
