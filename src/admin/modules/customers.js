import { supabase } from '../../api/supabase.js';

export async function initCustomers() {
    const listContainer = document.getElementById('customers-list');
    const addBtn = document.getElementById('add-customer-view-btn');
    const viewAllMapBtn = document.getElementById('view-all-customers-map-btn');

    let customersData = [];

    if (addBtn) {
        addBtn.onclick = () => {
            const tabEl = document.getElementById('add-customer-view-tab');
            if (tabEl) {
                const bsTab = new bootstrap.Tab(tabEl);
                bsTab.show();
            }
        };
    }

    if (viewAllMapBtn) viewAllMapBtn.onclick = () => showAllCustomersMap();

    async function loadCustomers() {
        listContainer.innerHTML = 'Memuat pelanggan...';
        const { data, error } = await supabase
            .from('customers')
            .select('*, roles(name)')
            .order('created_at', { ascending: false });

        if (error) {
            listContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        customersData = data;

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="text-muted text-center py-4">Tidak ada pelanggan ditemukan.</div>';
            return;
        }

        listContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Kode / Nama</th>
                            <th>Paket</th>
                            <th>Alamat / Lokasi</th>
                            <th>MAC / Redaman</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(cust => `
                            <tr>
                                <td>
                                    <div class="fw-bold">${cust.name}</div>
                                    <div class="small text-white-50">${cust.customer_code || '-'}</div>
                                </td>
                                <td>${cust.packet || '-'}</td>
                                <td>
                                    <div class="small">${cust.address}</div>
                                    ${cust.lat ? `<button class="btn btn-link p-0 small text-accent view-map" data-lat="${cust.lat}" data-lng="${cust.lng}" data-name="${cust.name}"><i class="bi bi-geo-alt"></i> Lihat Peta</button>` : ''}
                                </td>
                                <td>
                                    <div class="small">${cust.mac_address || '-'}</div>
                                    <div class="small ${cust.damping < -28 ? 'text-danger' : 'text-success'}">${cust.damping || '-'} dBm</div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-cust" data-id="${cust.id}">Edit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.querySelectorAll('.view-map').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                showMap(parseFloat(btn.dataset.lat), parseFloat(btn.dataset.lng), btn.dataset.name);
            };
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

        setTimeout(() => {
            if (map) map.remove();
            map = L.map('admin-map').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.marker([lat, lng]).addTo(map).bindPopup(name).openPopup();
        }, 300);
    }

    function showAllCustomersMap() {
        if (customersData.length === 0) return alert('Tidak ada data pelanggan untuk ditampilkan.');

        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        modal.show();

        setTimeout(() => {
            if (map) map.remove();

            const validCustomers = customersData.filter(c => c.lat && c.lng);
            if (validCustomers.length === 0) return alert('Tidak ada pelanggan dengan koordinat yang valid.');

            const first = validCustomers[0];
            map = L.map('admin-map').setView([first.lat, first.lng], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            const markers = [];
            validCustomers.forEach(cust => {
                const marker = L.marker([cust.lat, cust.lng]).addTo(map).bindPopup(`<b>${cust.name}</b><br>${cust.address}`);
                markers.push(marker);
            });

            if (validCustomers.length > 1) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }, 300);
    }

    async function showCustomerModal(cust = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = cust ? 'Edit Pelanggan' : 'Tambah Pelanggan';
        modalBody.innerHTML = `
            <form id="customer-form" class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nama Pelanggan</label>
                    <input type="text" class="form-control" id="cust-name" value="${cust?.name || ''}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Kode Pelanggan</label>
                    <input type="text" class="form-control" id="cust-code" value="${cust?.customer_code || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">NIK / KTP</label>
                    <input type="text" class="form-control" id="cust-ktp" value="${cust?.ktp || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">No. HP</label>
                    <input type="text" class="form-control" id="cust-phone" value="${cust?.phone || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Paket Internet</label>
                    <input type="text" class="form-control" id="cust-packet" value="${cust?.packet || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tanggal Pasang</label>
                    <input type="date" class="form-control" id="cust-install-date" value="${cust?.install_date || ''}">
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label">Alamat Pemasangan</label>
                    <textarea class="form-control" id="cust-address" rows="2" required>${cust?.address || ''}</textarea>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Username PPPoE</label>
                    <input type="text" class="form-control" id="cust-username" value="${cust?.username || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">MAC Address</label>
                    <input type="text" class="form-control" id="cust-mac" value="${cust?.mac_address || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Redaman (dBm)</label>
                    <input type="text" class="form-control" id="cust-damping" value="${cust?.damping || ''}">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">Lat</label>
                    <input type="number" step="any" class="form-control" id="cust-lat" value="${cust?.lat || ''}">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">Lng</label>
                    <input type="number" step="any" class="form-control" id="cust-lng" value="${cust?.lng || ''}">
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const formData = {
                name: document.getElementById('cust-name').value,
                customer_code: document.getElementById('cust-code').value,
                ktp: document.getElementById('cust-ktp').value,
                phone: document.getElementById('cust-phone').value,
                packet: document.getElementById('cust-packet').value,
                install_date: document.getElementById('cust-install-date').value,
                address: document.getElementById('cust-address').value,
                username: document.getElementById('cust-username').value,
                mac_address: document.getElementById('cust-mac').value,
                damping: document.getElementById('cust-damping').value,
                lat: parseFloat(document.getElementById('cust-lat').value) || null,
                lng: parseFloat(document.getElementById('cust-lng').value) || null
            };

            if (!formData.name || !formData.address) return alert('Nama dan Alamat wajib diisi.');

            let result;
            if (cust) {
                result = await supabase.from('customers').update(formData).eq('id', cust.id);
            } else {
                // Set default role to 'Customer'
                const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'Customer').single();
                if (roleData) formData.role_id = roleData.id;

                result = await supabase.from('customers').insert([formData]);
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
