import { supabase } from '../../api/supabase.js';

export async function initCustomers() {
    const listContainer = document.getElementById('customers-list');
    const addBtn = document.getElementById('add-customer-btn');

    addBtn.onclick = () => showCustomerModal();

    async function loadCustomers() {
        listContainer.innerHTML = 'Memuat pelanggan...';
        const { data, error } = await supabase.from('customers').select('*').order('name');

        if (error) {
            listContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="text-muted">Tidak ada pelanggan ditemukan.</div>';
            return;
        }

        listContainer.innerHTML = `
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Nama</th>
                        <th>Alamat</th>
                        <th>Lokasi</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(cust => `
                        <tr>
                            <td>${cust.name}</td>
                            <td>${cust.address}</td>
                            <td><small>${cust.lat?.toFixed(4)}, ${cust.lng?.toFixed(4)}</small></td>
                            <td>
                                <button class="btn btn-sm btn-outline-info view-map" data-lat="${cust.lat}" data-lng="${cust.lng}" data-name="${cust.name}">Peta</button>
                                <button class="btn btn-sm btn-outline-primary edit-cust" data-id="${cust.id}">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.view-map').forEach(btn => {
            btn.onclick = () => showMap(parseFloat(btn.dataset.lat), parseFloat(btn.dataset.lng), btn.dataset.name);
        });

        document.querySelectorAll('.edit-cust').forEach(btn => {
            btn.onclick = () => showCustomerModal(data.find(c => c.id === btn.dataset.id));
        });
    }

    let map;
    function showMap(lat, lng, name) {
        if (!lat || !lng) return alert('Koordinat tidak disetel untuk pelanggan ini.');

        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        modal.show();

        // Initialize map after modal is shown to ensure dimensions are correct
        setTimeout(() => {
            if (map) map.remove();
            map = L.map('admin-map').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.marker([lat, lng]).addTo(map).bindPopup(name).openPopup();
        }, 300);
    }

    function showCustomerModal(cust = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = cust ? 'Edit Pelanggan' : 'Tambah Pelanggan';
        modalBody.innerHTML = `
            <form id="customer-form">
                <div class="mb-3">
                    <label class="form-label">Nama Pelanggan</label>
                    <input type="text" class="form-control" id="cust-name" value="${cust?.name || ''}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Alamat</label>
                    <textarea class="form-control" id="cust-address" rows="2" required>${cust?.address || ''}</textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Lintang (Latitude)</label>
                        <input type="number" step="any" class="form-control" id="cust-lat" value="${cust?.lat || ''}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Bujur (Longitude)</label>
                        <input type="number" step="any" class="form-control" id="cust-lng" value="${cust?.lng || ''}">
                    </div>
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const name = document.getElementById('cust-name').value;
            const address = document.getElementById('cust-address').value;
            const lat = parseFloat(document.getElementById('cust-lat').value);
            const lng = parseFloat(document.getElementById('cust-lng').value);

            if (!name || !address) return alert('Nama dan Alamat wajib diisi.');

            let result;
            if (cust) {
                result = await supabase.from('customers').update({ name, address, lat, lng }).eq('id', cust.id);
            } else {
                result = await supabase.from('customers').insert([{ name, address, lat, lng }]);
            }

            if (result.error) {
                alert('Gagal menyimpan: ' + result.error.message);
            } else {
                modal.hide();
                loadCustomers();
            }
        };

        modal.show();
    }

    loadCustomers();
}
