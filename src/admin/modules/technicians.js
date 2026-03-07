import { supabase } from '../../api/supabase.js';

export async function initTechnicians() {
    const listContainer = document.getElementById('technicians-list');
    const addBtn = document.getElementById('add-tech-btn');

    if (addBtn) addBtn.onclick = () => showTechModal();

    async function loadTechnicians() {
        listContainer.innerHTML = 'Memuat teknisi...';
        const { data, error } = await supabase
            .from('technicians')
            .select('*')
            .order('name');

        if (error) {
            listContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="text-muted">Tidak ada teknisi ditemukan.</div>';
            return;
        }

        listContainer.innerHTML = `
            <table class="table table-dark table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Telepon</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(tech => `
                        <tr>
                            <td>${tech.name}</td>
                            <td>${tech.email}</td>
                            <td>${tech.phone || '-'}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary edit-tech" data-id="${tech.id}">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.edit-tech').forEach(btn => {
            btn.onclick = () => showTechModal(data.find(t => t.id === btn.dataset.id));
        });
    }

    async function showTechModal(tech = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = tech ? 'Edit Teknisi' : 'Tambah Teknisi';
        modalBody.innerHTML = `
            <form id="tech-form">
                <div class="mb-3">
                    <label class="form-label">Nama Lengkap</label>
                    <input type="text" class="form-control" id="tech-name" value="${tech?.name || ''}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="tech-email" value="${tech?.email || ''}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Telepon</label>
                    <input type="text" class="form-control" id="tech-phone" value="${tech?.phone || ''}">
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const formData = {
                name: document.getElementById('tech-name').value,
                email: document.getElementById('tech-email').value,
                phone: document.getElementById('tech-phone').value
            };

            if (!formData.name || !formData.email) return alert('Nama dan Email wajib diisi.');

            let result;
            if (tech) {
                result = await supabase.from('technicians').update(formData).eq('id', tech.id);
            } else {
                // Set default role to 'Teknisi'
                const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'Teknisi').single();
                if (roleData) formData.role_id = roleData.id;

                result = await supabase.from('technicians').insert([formData]);
            }

            if (result.error) {
                alert('Gagal menyimpan: ' + result.error.message);
            } else {
                modal.hide();
                loadTechnicians();
            }
        };

        modal.show();
    }

    loadTechnicians();
}
