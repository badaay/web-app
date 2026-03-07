import { supabase } from '../../api/supabase.js';

export async function initPackages() {
    const listContainer = document.getElementById('packages-list');
    const addBtn = document.getElementById('add-package-btn');

    if (addBtn) addBtn.onclick = () => showPackageModal();

    async function loadPackages() {
        listContainer.innerHTML = 'Memuat paket...';
        const { data, error } = await supabase.from('internet_packages').select('*').order('price');

        if (error) {
            listContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="text-muted text-center py-4">Tidak ada data paket ditemukan.</div>';
            return;
        }

        listContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Nama Paket</th>
                            <th>Kecepatan</th>
                            <th>Harga</th>
                            <th>Keterangan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(pkg => `
                            <tr>
                                <td class="fw-bold">${pkg.name}</td>
                                <td>${pkg.speed || '-'}</td>
                                <td>Rp ${new Intl.NumberFormat('id-ID').format(pkg.price)}</td>
                                <td class="small text-white-50">${pkg.description || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-pkg" data-id="${pkg.id}">Edit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.querySelectorAll('.edit-pkg').forEach(btn => {
            btn.onclick = () => showPackageModal(data.find(p => p.id === btn.dataset.id));
        });
    }

    function showPackageModal(pkg = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = pkg ? 'Edit Paket' : 'Tambah Paket';
        modalBody.innerHTML = `
            <form id="package-form">
                <div class="mb-3">
                    <label class="form-label">Nama Paket</label>
                    <input type="text" class="form-control" id="pkg-name" value="${pkg?.name || ''}" placeholder="Contoh: 175K 20Mbps" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Harga (Rp)</label>
                        <input type="number" class="form-control" id="pkg-price" value="${pkg?.price || ''}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Kecepatan</label>
                        <input type="text" class="form-control" id="pkg-speed" value="${pkg?.speed || ''}" placeholder="Contoh: 20Mbps">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Keterangan</label>
                    <textarea class="form-control" id="pkg-desc" rows="2">${pkg?.description || ''}</textarea>
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const name = document.getElementById('pkg-name').value;
            const price = parseFloat(document.getElementById('pkg-price').value);
            const speed = document.getElementById('pkg-speed').value;
            const description = document.getElementById('pkg-desc').value;

            if (!name || isNaN(price)) return alert('Nama dan Harga wajib diisi.');

            const payload = { name, price, speed, description };

            let result;
            if (pkg) {
                result = await supabase.from('internet_packages').update(payload).eq('id', pkg.id);
            } else {
                result = await supabase.from('internet_packages').insert([payload]);
            }

            if (result.error) {
                alert('Gagal menyimpan: ' + result.error.message);
            } else {
                modal.hide();
                loadPackages();
            }
        };

        modal.show();
    }

    loadPackages();
}
