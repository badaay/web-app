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
                    <thead class="table-light">
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
                                    <button class="btn btn-sm btn-outline-primary edit-emp" data-id="${emp.id}">
                                        <i class="bi bi-pencil me-1"></i> Edit
                                    </button>
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
        
        // Use tabs if editing existing employee
        if (emp) {
            modalBody.innerHTML = `
                <ul class="nav nav-tabs admin-tabs-custom mb-3" id="empEditTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="emp-general-tab" data-bs-toggle="tab" data-bs-target="#emp-general-pane" type="button" role="tab">Data Umum</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="emp-salary-tab" data-bs-toggle="tab" data-bs-target="#emp-salary-pane" type="button" role="tab">Gaji & Payroll</button>
                    </li>
                </ul>
                <div class="tab-content" id="empEditTabsContent">
                    <div class="tab-pane fade show active" id="emp-general-pane" role="tabpanel">
                        <form id="employee-form" class="row">
                            ${getGeneralFormHtml(emp, roles)}
                        </form>
                    </div>
                    <div class="tab-pane fade" id="emp-salary-pane" role="tabpanel">
                        <div id="salary-config-container" class="py-2">
                            <div class="text-center py-4 text-white-50"><small>Memuat data gaji...</small></div>
                        </div>
                    </div>
                </div>
            `;
            // Trigger salary load when tab is shown
            document.getElementById('emp-salary-tab').addEventListener('shown.bs.tab', () => loadSalaryConfig(emp.id));
        } else {
            modalBody.innerHTML = `
                <form id="employee-form" class="row">
                    ${getGeneralFormHtml(emp, roles)}
                </form>
            `;
        }

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

            if (!formData.name || !formData.employee_id) return showToast('warning', 'Nama dan ID wajib diisi.');

            let result;
            if (emp) {
                result = await supabase.from('employees').update(formData).eq('id', emp.id);
                if (result.error) {
                    showToast('error', 'Gagal menyimpan: ' + result.error.message);
                } else {
                    showToast('success', 'Data karyawan diperbarui.');
                    modal.hide();
                    loadEmployees();
                }
            } else {
                // Create employee via secure server-side API (uses Service Role Key)
                const empEmail = `${formData.employee_id.toLowerCase()}@fatih.com`;
                const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
                try {
                    await apiCall('/admin/create-user', {
                        method: 'POST',
                        body: JSON.stringify({
                            email: empEmail,
                            password: tempPassword,
                            metadata: { role: 'teknisi', employee_id: formData.employee_id },
                            employeeData: { ...formData, email: empEmail }
                        })
                    });
                    showToast('success', 'Karyawan baru berhasil didaftarkan.');
                    modal.hide();
                    loadEmployees();
                } catch (err) {
                    showToast('error', 'Gagal mendaftarkan: ' + err.message);
                }
            }
        };

        modal.show();
    }

    function getGeneralFormHtml(emp, roles) {
        return `
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">Nama Lengkap</label>
                <input type="text" class="form-control bg-vscode-input border-secondary text-white" id="emp-name" value="${emp?.name || ''}" required>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">ID Karyawan</label>
                <input type="text" class="form-control bg-vscode-input border-secondary text-white" id="emp-id" value="${emp?.employee_id || ''}" required>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">Role Aplikasi</label>
                <select class="form-select bg-vscode-input border-secondary text-white" id="emp-role-id">
                    <option value="">Pilih Role...</option>
                    ${roles?.map(r => `<option value="${r.id}" ${emp?.role_id === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">Jabatan (Struktural)</label>
                <input type="text" class="form-control bg-vscode-input border-secondary text-white" id="emp-position" value="${emp?.position || ''}" required>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">Status</label>
                <select class="form-select bg-vscode-input border-secondary text-white" id="emp-status">
                    <option value="Aktif" ${emp?.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
                    <option value="Non-Aktif" ${emp?.status === 'Non-Aktif' ? 'selected' : ''}>Non-Aktif</option>
                </select>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">Tempat Lahir</label>
                <input type="text" class="form-control bg-vscode-input border-secondary text-white" id="emp-birthplace" value="${emp?.birth_place || ''}">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">Tanggal Lahir</label>
                <input type="date" class="form-control bg-vscode-input border-secondary text-white" id="emp-birthdate" value="${emp?.birth_date || ''}">
            </div>
            <div class="col-12 mb-3">
                <label class="form-label small text-white-50">Alamat</label>
                <textarea class="form-control bg-vscode-input border-secondary text-white" id="emp-address" rows="2">${emp?.address || ''}</textarea>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">Tanggal Masuk</label>
                <input type="date" class="form-control bg-vscode-input border-secondary text-white" id="emp-join-date" value="${emp?.join_date || ''}">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">Pendidikan Terakhir</label>
                <input type="text" class="form-control bg-vscode-input border-secondary text-white" id="emp-education" value="${emp?.education || ''}">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">Training</label>
                <select class="form-select bg-vscode-input border-secondary text-white" id="emp-training">
                    <option value="Ya" ${emp?.training === 'Ya' ? 'selected' : ''}>Ya</option>
                    <option value="Tidak" ${emp?.training === 'Tidak' ? 'selected' : ''}>Tidak</option>
                </select>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label small text-white-50">BPJS</label>
                <select class="form-select bg-vscode-input border-secondary text-white" id="emp-bpjs">
                    <option value="Ya" ${emp?.bpjs === 'Ya' ? 'selected' : ''}>Ya</option>
                    <option value="Tidak" ${emp?.bpjs === 'Tidak' ? 'selected' : ''}>Tidak</option>
                </select>
            </div>
        `;
    }

    async function loadSalaryConfig(employeeId) {
        const container = document.getElementById('salary-config-container');
        try {
            const response = await fetch(`/api/admin/salary-config?employee_id=${employeeId}`);
            const configs = await response.json();
            
            const config = configs && configs.length > 0 ? configs[0] : null;

            // Fetch target points from employee table
            const { data: empData } = await supabase.from('employees').select('target_monthly_points, base_salary').eq('id', employeeId).single();

            container.innerHTML = `
                <form id="salary-config-form" class="row g-3">
                    <input type="hidden" name="id" value="${config?.id || ''}">
                    <input type="hidden" name="employee_id" value="${employeeId}">
                    
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">Gaji Pokok (Base Salary)</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="base_salary" value="${empData?.base_salary || 0}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">Target Poin Bulanan</label>
                        <input type="number" class="form-control bg-vscode-input border-secondary text-white" name="target_monthly_points" value="${empData?.target_monthly_points || 0}">
                    </div>
                    
                    <div class="col-12"><hr class="border-secondary opacity-25"></div>
                    <div class="col-12"><h6 class="text-white-50 small text-uppercase fw-bold">Tunjangan (Allowances)</h6></div>

                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Tunj. Jabatan</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="position_allowance" value="${config?.position_allowance || 0}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Tunj. Tambahan</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="additional_allowance" value="${config?.additional_allowance || 0}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Tunj. Kuota</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="quota_allowance" value="${config?.quota_allowance || 0}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Tunj. Pendidikan</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="education_allowance" value="${config?.education_allowance || 0}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Tunj. Makan & Transport</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="transport_meal_allowance" value="${config?.transport_meal_allowance || 0}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Tunj. Lapangan</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="field_allowance" value="${config?.field_allowance || 0}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Tunj. Komunikasi</label>
                        <input type="text" class="form-control bg-vscode-input border-secondary text-white currency-mask" name="communication_allowance" value="${config?.communication_allowance || 0}">
                    </div>

                    <div class="col-12 mt-4">
                        <button type="button" class="btn btn-teal btn-sm w-100" id="save-salary-btn">
                            <i class="bi bi-save me-1"></i> Simpan Konfigurasi Gaji
                        </button>
                    </div>
                </form>
            `;

            initCurrencyMask('.currency-mask');

            document.getElementById('save-salary-btn').onclick = async () => {
                const formData = new FormData(document.getElementById('salary-config-form'));
                const data = Object.fromEntries(formData.entries());
                
                // Convert numeric fields using rawValue from the input elements
                const formElements = document.getElementById('salary-config-form').elements;
                ['base_salary', 'position_allowance', 'additional_allowance', 'quota_allowance', 'education_allowance', 'transport_meal_allowance', 'field_allowance', 'communication_allowance'].forEach(k => {
                    data[k] = formElements[k].rawValue || 0;
                });
                data.target_monthly_points = parseInt(data.target_monthly_points || 0);

                // Also update base_salary in employees table via the same API or separate
                // The API handler for salary-config already updates employees.target_monthly_points
                // Let's make sure it also updates base_salary
                
                setBtnLoading(document.getElementById('save-salary-btn'), true);
                try {
                    const res = await fetch('/api/admin/salary-config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (!res.ok) throw new Error('Gagal menyimpan konfigurasi gaji');
                    
                    // Manual update for base_salary since we might need it in employees table
                    await supabase.from('employees').update({ base_salary: data.base_salary }).eq('id', employeeId);

                    showToast('success', 'Konfigurasi gaji berhasil disimpan');
                    loadSalaryConfig(employeeId);
                } catch (err) {
                    showToast('error', err.message);
                } finally {
                    setBtnLoading(document.getElementById('save-salary-btn'), false);
                }
            };

        } catch (err) {
            container.innerHTML = `<div class="text-danger small">Error: ${err.message}</div>`;
        }
    }

    loadEmployees();
}
