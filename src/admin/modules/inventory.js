import { supabase } from '../../api/supabase.js';
import { showToast } from '../utils/toast.js';
import { getSpinner } from '../utils/ui-common.js';

export async function initInventory() {
    const listContainer = document.getElementById('inventory-list');
    const addBtn = document.getElementById('add-inventory-btn');

    if (addBtn) addBtn.onclick = () => showInventoryModal();

    async function loadInventory() {
        listContainer.innerHTML = getSpinner('Memuat inventaris...');
        const { data, error } = await supabase.from('inventory_items').select('*').order('name');

        if (error) {
            listContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        if (data.length === 0) {
            listContainer.innerHTML = `
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-box-seam fs-1 d-block mb-3"></i>
                    Tidak ada barang inventaris ditemukan.
                </div>`;
            return;
        }

        listContainer.innerHTML = `
            <div class="table-container shadow-sm">
                <table class="table table-dark table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Nama Barang</th>
                            <th>Stok</th>
                            <th>Satuan</th>
                            <th>Kategori</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td class="fw-bold">${item.name}</td>
                                <td>
                                    <span class="badge bg-vscode-header border border-secondary text-white px-3 fs-6">${item.stock}</span>
                                </td>
                                <td>${item.unit}</td>
                                <td>
                                    <span class="badge bg-secondary opacity-75 fw-normal">${item.category || '-'}</span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-item" data-id="${item.id}">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.querySelectorAll('.edit-item').forEach(btn => {
            btn.onclick = () => showInventoryModal(data.find(i => i.id === btn.dataset.id));
        });
    }

    function showInventoryModal(item = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = item ? 'Edit Barang' : 'Tambah Barang';
        modalBody.innerHTML = `
            <form id="inventory-form">
                <div class="mb-3">
                    <label class="form-label">Nama Barang</label>
                    <input type="text" class="form-control" id="item-name" value="${item?.name || ''}" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Stok</label>
                        <input type="number" class="form-control" id="item-stock" value="${item?.stock || 0}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Satuan</label>
                        <input type="text" class="form-control" id="item-unit" placeholder="pcs, kg, dll." value="${item?.unit || ''}" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Kategori</label>
                    <input type="text" class="form-control" id="item-category" value="${item?.category || ''}">
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const name = document.getElementById('item-name').value;
            const stock = parseInt(document.getElementById('item-stock').value);
            const unit = document.getElementById('item-unit').value;
            const category = document.getElementById('item-category').value;

            if (!name || isNaN(stock) || !unit) return showToast('warning', 'Nama, Stok, dan Satuan wajib diisi.');

            let result;
            if (item) {
                result = await supabase.from('inventory_items').update({ name, stock, unit, category }).eq('id', item.id);
            } else {
                result = await supabase.from('inventory_items').insert([{ name, stock, unit, category }]);
            }

            if (result.error) {
                showToast('error', 'Gagal menyimpan: ' + result.error.message);
            } else {
                showToast('success', 'Barang berhasil disimpan!');
                modal.hide();
                loadInventory();
            }
        };

        modal.show();
    }

    loadInventory();
}
