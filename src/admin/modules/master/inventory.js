import { supabase } from '../../../api/supabase.js';
import { showToast } from '../../utils/toast.js';
import { getSpinner, copyItemCode } from '../../utils/ui-common.js';
import { initCurrencyMask } from '../../utils/masking.js';

export async function initInventory() {
    const listContainer = document.getElementById('inventory-list');
    const addBtn = document.getElementById('add-inventory-btn');
    const searchInput = document.getElementById('inventory-search-input');
    
    let allItems = [];
    let searchTerm = '';

    // Fetch user role for admin-only fields (AC1)
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (userId) {
        const { data: profile } = await supabase.from('profiles').select('roles(code)').eq('id', userId).single();
        userRole = profile?.roles?.code;
    }
    const isAdmin = ['S_ADM', 'OWNER', 'ADM'].includes(userRole);

    if (addBtn) addBtn.onclick = () => showInventoryModal();
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchTerm = e.target.value.toLowerCase();
            renderTable();
        };
    }

    async function loadInventory() {
        listContainer.innerHTML = getSpinner('Memuat inventaris...');
        const { data, error } = await supabase.from('inventory_items').select('*').order('name');

        if (error) {
            listContainer.innerHTML = `<div class="text-danger p-4 text-center">Kesalahan: ${error.message}</div>`;
            return;
        }
        
        allItems = data;
        renderTable();
    }

    function renderTable() {
        const filtered = allItems.filter(item => {
            const name = item.name?.toLowerCase() || '';
            const cat = item.category?.toLowerCase() || '';
            const code = item.item_code?.toLowerCase() || '';
            return name.includes(searchTerm) || cat.includes(searchTerm) || code.includes(searchTerm);
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-box-seam fs-1 d-block mb-3"></i>
                    ${allItems.length === 0 ? 'Tidak ada barang inventaris ditemukan.' : 'Tidak ada barang yang cocok dengan pencarian.'}
                </div>`;
            return;
        }

        listContainer.innerHTML = `
            <div class="table-container shadow-sm border-0 bg-vscode">
                <table class="table table-dark table-hover align-middle mb-0">
                    <thead class="bg-vscode-header border-bottom border-secondary border-opacity-25">
                        <tr>
                            <th class="ps-4">Kode Item</th>
                            <th>Nama Barang</th>
                            <th>Kategori</th>
                            <th>Stok</th>
                            <th>Satuan</th>
                            <th>Kategori</th>
                            ${isAdmin ? '<th>Harga Satuan</th>' : ''}
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="border-0">
                        ${filtered.map(item => `
                            <tr>
                                <td class="ps-4">
                                    ${item.item_code ? `
                                        <span class="inv-chip-hard" 
                                              data-code="${item.item_code}"
                                              >
                                            <i class="bi bi-upc-scan me-2"></i>${item.item_code}
                                        </span>
                                    ` : '<span class="text-white-50 small">-</span>'}
                                </td>
                                <td class="fw-bold text-white">${item.name}</td>
                                <td>
                                    <span class="badge bg-secondary opacity-75 fw-normal">${item.category || '-'}</span>
                                </td>
                                ${isAdmin ? `<td>Rp ${(item.unit_cost || 0).toLocaleString('id-ID')}</td>` : ''}
                                <td>
                                    <span class="badge bg-vscode-header border border-secondary text-white px-3 fw-bold">${item.stock}</span>
                                </td>
                                <td class="text-white-50">${item.unit}</td>
                                <td class="text-end pe-4">
                                    <button class="btn btn-sm btn-outline-primary border-0 hover-scale edit-item" data-id="${item.id}" title="Edit Barang">
                                        <i class="bi bi-pencil-square fs-6"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Click handlers
        listContainer.querySelectorAll('.edit-item').forEach(btn => {
            btn.onclick = () => showInventoryModal(allItems.find(i => i.id === btn.dataset.id));
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
                ${item?.item_code ? `
                <div class="mb-3">
                    <label class="form-label text-white-50 small"><i class="bi bi-upc-scan me-1"></i>Kode Item</label>
                    <div class="d-block">
                        <span class="inv-chip-hard w-100 justify-content-between" data-code="${item.item_code}" >
                            <span><i class="bi bi-upc-scan me-2"></i>${item.item_code}</span>
                            <i class="bi bi-clipboard small opacity-50"></i>
                        </span>
                    </div>
                </div>
                ` : `
                <div class="alert alert-info small py-2 border-0 mb-3" style="background: rgba(14,165,233,0.1); color: #7dd3fc;">
                    <i class="bi bi-info-circle me-2"></i>
                    Kode item akan di-generate otomatis (Format: INV-CAT-XXX)
                </div>
                `}

                <div class="mb-3">
                    <label class="form-label">Nama Barang</label>
                    <input type="text" class="form-control form-control-sm" id="item-name" value="${item?.name || ''}" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Stok</label>
                        <input type="number" class="form-control form-control-sm" id="item-stock" value="${item?.stock || 0}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Satuan</label>
                        <input type="text" class="form-control form-control-sm" id="item-unit" placeholder="pcs, kg, dll." value="${item?.unit || ''}" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Kategori</label>
                    <input type="text" class="form-control form-control-sm" id="item-category" placeholder="E.g. Router, Cable, etc." value="${item?.category || ''}">
                </div>
                ${isAdmin ? `
                <div class="mb-3">
                    <label class="form-label">Harga Satuan</label>
                    <input type="text" class="form-control currency-mask" id="item-unit-cost" value="${item?.unit_cost || 0}">
                    <div class="form-text text-white-50">Biaya internal untuk perhitungan laba rugi.</div>
                </div>
                ` : ''}
            </form>
        `;

        initCurrencyMask('#item-unit-cost');

        saveBtn.onclick = async () => {
            const name = document.getElementById('item-name').value;
            const stock = parseInt(document.getElementById('item-stock').value);
            const unit = document.getElementById('item-unit').value;
            const category = document.getElementById('item-category').value;
            const unit_cost = isAdmin ? document.getElementById('item-unit-cost').rawValue : (item?.unit_cost || 0);

            if (!name || isNaN(stock) || !unit) return showToast('warning', 'Nama, Stok, dan Satuan wajib diisi.');

            const payload = { name, stock, unit, category };
            if (isAdmin) payload.unit_cost = unit_cost;

            const { apiCall } = await import('../../../api/supabase.js');
            
            try {
                let result;
                if (item) {
                    result = await apiCall(`/inventory/${item.id}`, { 
                        method: 'PATCH', 
                        body: JSON.stringify(payload) 
                    });
                } else {
                    result = await apiCall('/inventory', { 
                        method: 'POST', 
                        body: JSON.stringify(payload) 
                    });
                }
                
                showToast('success', 'Barang berhasil disimpan!');
                modal.hide();
                loadInventory();
            } catch (err) {
                showToast('error', 'Gagal menyimpan: ' + err.message);
            }
        };

        modal.show();
    }

    loadInventory();
}
