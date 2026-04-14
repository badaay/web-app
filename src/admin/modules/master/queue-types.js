import { supabase, apiCall } from '../../../api/supabase.js';
import { showToast } from '../../utils/toast.js';
import { getSpinner } from '../../utils/ui-common.js';

export async function initQueueTypes() {
    const listContainer = document.getElementById('queue-types-list');
    const addBtn = document.getElementById('add-queue-type-btn');

    if (addBtn) addBtn.onclick = () => showQueueTypeModal();

    async function loadQueueTypes() {
        listContainer.innerHTML = getSpinner('Memuat data...');
        const { data, error } = await supabase.from('master_queue_types').select('*').order('name');

        if (error) {
            listContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        if (data.length === 0) {
            listContainer.innerHTML = `
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-ticket-detailed fs-1 d-block mb-3"></i>
                    Tidak ada tipe point ditemukan.
                </div>`;
            return;
        }

        listContainer.innerHTML = `
            <div class="table-container shadow-sm">
                <table class="table table-dark table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Preview</th>
                            <th>Nama Tipe</th>
                            <th>Base Point</th>
                            <th>Icon Class</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center justify-content-center border rounded" style="width: 40px; height: 40px; background-color: rgba(0,0,0,0.2); border-color: ${item.color} !important;">
                                        <i class="bi ${item.icon || 'bi-ticket-detailed'} fs-5" style="color: ${item.color || '#fff'};"></i>
                                    </div>
                                </td>
                                <td class="fw-bold text-accent">${item.name}</td>
                                <td class="fw-bold text-success">+${item.base_point || 0}</td>
                                <td class="small text-white-50 font-monospace">${item.icon || '-'}</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-qt" data-id="${item.id}">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-outline-danger delete-qt" data-id="${item.id}" data-name="${item.name}">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.querySelectorAll('.edit-qt').forEach(btn => {
            btn.onclick = () => showQueueTypeModal(data.find(d => d.id === btn.dataset.id));
        });

        document.querySelectorAll('.delete-qt').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm(`Hapus tipe antrian "${btn.dataset.name}"?`)) return;
                try {
                    btn.disabled = true;
                    await apiCall(`/queue-types/${btn.dataset.id}`, { method: 'DELETE' });
                    showToast('success', 'Tipe point dihapus!');
                    loadQueueTypes();
                } catch (err) {
                    showToast('error', 'Gagal menghapus: ' + err.message);
                    btn.disabled = false;
                }
            };
        });
    }

    function showQueueTypeModal(item = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = item ? 'Edit Tipe Point' : 'Tambah Tipe Point';
        modalBody.innerHTML = `
            <form id="qt-form">
                <div class="mb-3">
                    <label class="form-label">Nama Tipe</label>
                    <input type="text" class="form-control" id="qt-name" value="${item?.name || ''}" placeholder="Contoh: PSB, Repair" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Base Point</label>
                    <input type="number" class="form-control" id="qt-point" value="${item?.base_point || 0}" required>
                    <div class="form-text text-white-50"> Poin yang diberikan ke teknisi saat selesai.</div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Ikon (Bootstrap Icon)</label>
                        <input type="text" class="form-control" id="qt-icon" value="${item?.icon || 'bi-ticket-detailed'}" placeholder="bi-house-add">
                        <div class="form-text text-white-50"><a href="https://icons.getbootstrap.com/" target="_blank">Referensi Ikon</a></div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Warna (Hex)</label>
                        <div class="d-flex align-items-center">
                            <input type="color" class="form-control form-control-color me-2" id="qt-color-picker" value="${item?.color || '#22c55e'}">
                            <input type="text" class="form-control font-monospace" id="qt-color" value="${item?.color || '#22c55e'}">
                        </div>
                    </div>
                </div>
                <div class="mt-3 p-3 bg-dark rounded text-center border" id="qt-preview-container" style="border-color: ${item?.color || '#22c55e'} !important;">
                    <i id="qt-preview-icon" class="bi ${item?.icon || 'bi-ticket-detailed'} fs-1" style="color: ${item?.color || '#22c55e'};"></i>
                    <div class="mt-2 small text-white-50">Preview</div>
                </div>
            </form>
        `;

        // Interactive preview
        const iconInput = document.getElementById('qt-icon');
        const colorInput = document.getElementById('qt-color');
        const colorPicker = document.getElementById('qt-color-picker');
        const previewIcon = document.getElementById('qt-preview-icon');
        const previewContainer = document.getElementById('qt-preview-container');

        const updatePreview = () => {
            const c = colorInput.value || '#ffffff';
            const i = iconInput.value || 'bi-ticket-detailed';
            previewIcon.className = `bi ${i} fs-1`;
            previewIcon.style.color = c;
            // update border color natively without affecting rules
            previewContainer.style.cssText = `border-color: ${c} !important;`;
        };

        iconInput.oninput = updatePreview;
        colorInput.oninput = () => {
            colorPicker.value = colorInput.value;
            updatePreview();
        };
        colorPicker.oninput = () => {
            colorInput.value = colorPicker.value;
            updatePreview();
        };

        saveBtn.onclick = async () => {
            const name = document.getElementById('qt-name').value.trim();
            const base_point = parseInt(document.getElementById('qt-point').value, 10);
            const icon = document.getElementById('qt-icon').value.trim();
            const color = document.getElementById('qt-color').value.trim();

            if (!name) return showToast('warning', 'Nama tipe wajib diisi.');

            const payload = { name, base_point: isNaN(base_point) ? 0 : base_point, icon, color };
            
            saveBtn.disabled = true;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

            try {
                if (item) {
                    await apiCall(`/queue-types/${item.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify(payload)
                    });
                } else {
                    await apiCall('/queue-types', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                }
                showToast('success', 'Tipe point berhasil disimpan!');
                modal.hide();
                loadQueueTypes();
            } catch (err) {
                showToast('error', 'Gagal menyimpan: ' + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        };

        modal.show();
    }

    loadQueueTypes();
}
