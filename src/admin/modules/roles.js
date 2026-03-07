import { supabase } from '../../api/supabase.js';

export async function initRoles() {
    const listContainer = document.getElementById('roles-list');
    const addBtn = document.getElementById('add-role-btn');

    if (addBtn) addBtn.onclick = () => showRoleModal();

    async function loadRoles() {
        listContainer.innerHTML = '<div class="card-body text-center py-5">Memuat data role...</div>';
        const { data, error } = await supabase.from('roles').select('*').order('name');

        if (error) {
            listContainer.innerHTML = `<div class="card-body text-center py-5 text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="card-body text-center py-5 text-muted">Tidak ada data role ditemukan.</div>';
            return;
        }

        listContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Nama Role</th>
                            <th>Kode</th>
                            <th>Keterangan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(role => `
                            <tr>
                                <td class="fw-bold">${role.name}</td>
                                <td><span class="badge bg-info text-dark">${role.code}</span></td>
                                <td class="small text-white-50">${role.description || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-role" data-id="${role.id}">Edit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.querySelectorAll('.edit-role').forEach(btn => {
            btn.onclick = () => showRoleModal(data.find(r => r.id === btn.dataset.id));
        });
    }

    function showRoleModal(role = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = role ? 'Edit Role' : 'Tambah Role';
        modalBody.innerHTML = `
            <form id="role-form">
                <div class="mb-3">
                    <label class="form-label">Nama Role</label>
                    <input type="text" class="form-control" id="role-name" value="${role?.name || ''}" placeholder="Contoh: Administrator" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Kode Role</label>
                    <input type="text" class="form-control" id="role-code" value="${role?.code || ''}" placeholder="Contoh: ADM" ${role ? 'disabled' : ''} required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Keterangan</label>
                    <textarea class="form-control" id="role-desc" rows="2">${role?.description || ''}</textarea>
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const name = document.getElementById('role-name').value;
            const code = document.getElementById('role-code').value.toUpperCase();
            const description = document.getElementById('role-desc').value;

            if (!name || !code) return alert('Nama dan Kode wajib diisi.');

            const payload = { name, code, description };

            let result;
            if (role) {
                result = await supabase.from('roles').update({ name, description }).eq('id', role.id);
            } else {
                result = await supabase.from('roles').insert([payload]);
            }

            if (result.error) {
                alert('Gagal menyimpan: ' + result.error.message);
            } else {
                modal.hide();
                loadRoles();
            }
        };

        modal.show();
    }

    loadRoles();
}
