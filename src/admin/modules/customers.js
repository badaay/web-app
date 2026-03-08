import { supabase } from '../../api/supabase.js';

export async function initCustomers() {
    const listContainer = document.getElementById('customers-list');
    const addBtn = document.getElementById('add-customer-view-btn');
    const viewAllMapBtn = document.getElementById('view-all-customers-map-btn');

    let customersData = [];

    if (addBtn) {
        addBtn.onclick = () => {
            if (window.switchAdminModule) {
                window.switchAdminModule('add-customer-view-content');
            }
        };
    }

    if (viewAllMapBtn) viewAllMapBtn.onclick = () => showAllCustomersMap();

    async function loadCustomers() {
        listContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-white-50">Memuat pelanggan...</div></div>';

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
                                </td>
                                <td>
                                    <div class="small">${cust.mac_address || '-'}</div>
                                    <div class="small ${cust.damping < -28 ? 'text-danger' : 'text-success'}">${cust.damping || '-'} dBm</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-cust" data-id="${cust.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                                        ${cust.lat ? `<button class="btn btn-outline-info view-map" data-id="${cust.id}" data-lat="${cust.lat}" data-lng="${cust.lng}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>` : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.querySelectorAll('.view-map').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const cust = customersData.find(c => String(c.id) === btn.dataset.id);
                showMap(parseFloat(btn.dataset.lat), parseFloat(btn.dataset.lng), cust);
            };
        });

        document.querySelectorAll('.edit-cust').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showCustomerModal(customersData.find(c => String(c.id) === btn.dataset.id));
            };
        });
    }

    // --------- MAP helpers ---------

    function buildCustomerPopup(cust) {
        const mapsUrl = cust.lat ? `https://www.google.com/maps?q=${cust.lat},${cust.lng}` : null;
        const dampColor = cust.damping && cust.damping < -28 ? '#ef4444' : '#22c55e';
        const installDate = cust.install_date ? new Date(cust.install_date).toLocaleDateString('id-ID') : '-';

        return `
            <div style="min-width:220px;font-family:sans-serif;">
                <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:8px 12px;margin:-7px -7px 10px;border-radius:4px 4px 0 0;">
                    <div style="font-weight:700;font-size:13px;">${cust.name}</div>
                    <div style="font-size:11px;opacity:0.85;">${cust.customer_code || 'Kode belum diatur'}</div>
                </div>
                <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    <tr><td style="color:#666;padding:2px 4px;white-space:nowrap;">📦 Paket</td><td style="font-weight:600;">${cust.packet || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📱 No HP</td><td>${cust.phone || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">🏠 Alamat</td><td>${cust.address || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📅 Pasang</td><td>${installDate}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">💻 Username</td><td>${cust.username || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📡 MAC</td><td style="font-family:monospace;font-size:11px;">${cust.mac_address || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📶 Redaman</td><td style="color:${dampColor};font-weight:600;">${cust.damping ? cust.damping + ' dBm' : '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">🪪 KTP</td><td style="font-size:11px;">${cust.ktp || '-'}</td></tr>
                </table>
                ${mapsUrl ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
                    <a href="${mapsUrl}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">
                        <i class="bi bi-map"></i> Buka Google Maps
                    </a>
                </div>` : ''}
            </div>
        `;
    }

    function createCustomerMarker(lat, lng, cust) {
        return L.marker([lat, lng], {
            icon: L.divIcon({
                className: '',
                html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
                    <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
                    <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
                </svg>`,
                iconSize: [28, 36],
                iconAnchor: [14, 36],
                popupAnchor: [0, -36]
            })
        }).bindPopup(buildCustomerPopup(cust), { maxWidth: 280 });
    }

    function showMap(lat, lng, cust) {
        if (!lat || !lng) return alert('Koordinat tidak disetel untuk pelanggan ini.');

        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        modal.show();

        // Update modal title
        setTimeout(() => {
            const mTitle = document.querySelector('#mapModal .modal-title');
            if (mTitle) mTitle.innerHTML = `<i class="bi bi-geo-alt me-2 text-info"></i>${cust?.name || 'Lokasi Pelanggan'}`;
        }, 50);

        setTimeout(() => {
            if (window.adminModalMap) {
                window.adminModalMap.remove();
                window.adminModalMap = null;
            }
            const map = L.map('admin-map').setView([lat, lng], 16);
            window.adminModalMap = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            createCustomerMarker(lat, lng, cust).addTo(map).openPopup();
        }, 300);
    }

    function showAllCustomersMap() {
        if (customersData.length === 0) return alert('Tidak ada data pelanggan untuk ditampilkan.');

        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        modal.show();

        setTimeout(() => {
            const mTitle = document.querySelector('#mapModal .modal-title');
            if (mTitle) mTitle.innerHTML = `<i class="bi bi-map me-2 text-info"></i>Peta Semua Pelanggan`;
        }, 50);

        setTimeout(() => {
            if (window.adminModalMap) {
                window.adminModalMap.remove();
                window.adminModalMap = null;
            }

            const validCustomers = customersData.filter(c => c.lat && c.lng);
            if (validCustomers.length === 0) return alert('Tidak ada pelanggan dengan koordinat yang valid.');

            const first = validCustomers[0];
            const map = L.map('admin-map').setView([first.lat, first.lng], 12);
            window.adminModalMap = map;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            // Counter badge
            const counter = L.control({ position: 'topright' });
            counter.onAdd = () => {
                const div = L.DomUtil.create('div');
                div.style.cssText = 'background:rgba(30,30,30,0.85);color:#fff;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;border:1px solid #444;';
                div.innerHTML = `<i style="color:#3b82f6;">●</i> ${validCustomers.length} Pelanggan`;
                return div;
            };
            counter.addTo(map);

            const markers = [];
            validCustomers.forEach(cust => {
                const marker = createCustomerMarker(cust.lat, cust.lng, cust).addTo(map);
                markers.push(marker);
            });

            if (validCustomers.length > 1) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.12));
            }
        }, 300);
    }

    // --------- CRUD Modal ---------
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
