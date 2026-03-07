import { supabase } from '../../api/supabase.js';

export async function initSettings() {
    const listContainer = document.getElementById('settings-content');

    async function loadSettings() {
        listContainer.innerHTML = '<div class="card-body text-center py-5">Memuat pengaturan...</div>';
        const { data, error } = await supabase.from('app_settings').select('*').order('setting_key');

        if (error) {
            listContainer.innerHTML = `<div class="card-body text-center py-5 text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        listContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Key</th>
                            <th>Value</th>
                            <th>Deskripsi</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.length === 0 ? '<tr><td colspan="4" class="text-center">Belum ada pengaturan.</td></tr>' : ''}
                        ${data.map(set => `
                            <tr>
                                <td class="fw-bold">${set.setting_key}</td>
                                <td><code>${set.setting_value || '-'}</code></td>
                                <td class="small text-white-50">${set.description || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-setting" data-id="${set.id}">Edit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mt-4">
                <button class="btn btn-primary" id="add-setting-btn">
                    <i class="bi bi-plus-lg me-1"></i> Tambah Pengaturan Baru
                </button>
            </div>
        `;

        document.querySelectorAll('.edit-setting').forEach(btn => {
            btn.onclick = () => showSettingModal(data.find(s => s.id === btn.dataset.id));
        });

        const addBtn = document.getElementById('add-setting-btn');
        if (addBtn) addBtn.onclick = () => showSettingModal();
    }

    function showSettingModal(set = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = set ? 'Edit Pengaturan' : 'Tambah Pengaturan';
        modalBody.innerHTML = `
            <form id="setting-form">
                <div class="mb-3">
                    <label class="form-label">Setting Key</label>
                    <input type="text" class="form-control" id="set-key" value="${set?.setting_key || ''}" placeholder="Contoh: COMPANY_NAME" ${set ? 'disabled' : ''} required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Value</label>
                    <input type="text" class="form-control" id="set-value" value="${set?.setting_value || ''}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Deskripsi</label>
                    <textarea class="form-control" id="set-desc" rows="2">${set?.description || ''}</textarea>
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const key = document.getElementById('set-key').value;
            const value = document.getElementById('set-value').value;
            const description = document.getElementById('set-desc').value;

            if (!key || !value) return alert('Key dan Value wajib diisi.');

            const payload = { setting_key: key, setting_value: value, description };

            let result;
            if (set) {
                result = await supabase.from('app_settings').update({ setting_value: value, description }).eq('id', set.id);
            } else {
                result = await supabase.from('app_settings').insert([payload]);
            }

            if (result.error) {
                alert('Gagal menyimpan: ' + result.error.message);
            } else {
                modal.hide();
                loadSettings();
            }
        };

        modal.show();
    }

    loadSettings();
}
