import { supabase } from '../../api/supabase.js';

export async function initWorkOrders() {
    const listContainer = document.getElementById('work-orders-list');
    const addBtn = document.getElementById('add-work-order-btn');

    // State
    let allWorkOrders = [];
    let currentFilter = 'All';
    let searchQuery = '';

    if (addBtn) addBtn.onclick = () => showWorkOrderModal();

    // ---------- Data Loading ----------
    async function loadWorkOrders() {
        if (!listContainer) return;
        listContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-white-50">Memuat Antrian...</div></div>';

        const { data, error } = await supabase
            .from('work_orders')
            .select('*, customers(*), employees(name)')
            .order('created_at', { ascending: false });

        if (error) {
            listContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            return;
        }

        allWorkOrders = data;
        renderStatusSummary();
        renderSearchBar();
        renderWorkOrders();
    }

    // ---------- Status Summary Badges ----------
    function renderStatusSummary() {
        const summaryContainer = document.getElementById('wo-status-summary');
        if (!summaryContainer) return;

        const counts = allWorkOrders.reduce((acc, wo) => {
            acc[wo.status] = (acc[wo.status] || 0) + 1;
            return acc;
        }, {});

        const statuses = ['Antrian', 'Pending', 'Konfirmasi', 'ODP Penuh', 'Cancel', 'Completed'];

        summaryContainer.innerHTML = `
            <button class="badge me-1 mb-1 p-2 border-0 wo-filter-badge ${currentFilter === 'All' ? 'ring-active' : ''}"
                style="background:var(--vscode-accent);color:#fff;cursor:pointer;" 
                data-filter="All">Semua: ${allWorkOrders.length}</button>
            ${statuses.map(s => `
                <button class="badge me-1 mb-1 p-2 border-0 wo-filter-badge ${currentFilter === s ? 'ring-active' : ''}"
                    style="background-color:${getStatusColor(s) || '#6c757d'};color:#fff;cursor:pointer;${s === 'ODP Penuh' ? '' : ''}"
                    data-filter="${s}">${s}: ${counts[s] || 0}</button>
            `).join('')}
        `;

        summaryContainer.querySelectorAll('.wo-filter-badge').forEach(badge => {
            badge.onclick = () => {
                const f = badge.dataset.filter;
                currentFilter = (f === currentFilter && f !== 'All') ? 'All' : f;
                renderStatusSummary();
                renderWorkOrders();
            };
        });
    }

    // ---------- Search Bar ----------
    function renderSearchBar() {
        // Only inject search bar once
        if (document.getElementById('wo-search-bar')) return;

        const container = document.getElementById('work-orders-list');
        const searchWrapper = document.createElement('div');
        searchWrapper.id = 'wo-search-bar';
        searchWrapper.className = 'mb-3 d-flex gap-2 align-items-center';
        searchWrapper.innerHTML = `
            <div class="input-group input-group-sm" style="max-width:320px;">
                <span class="input-group-text bg-vscode-header border-0 text-white-50"><i class="bi bi-search"></i></span>
                <input id="wo-search-input" type="text" class="form-control" placeholder="Cari nama pelanggan, petugas, ket...">
            </div>
            <button class="btn btn-sm btn-outline-secondary" id="wo-clear-search"><i class="bi bi-x"></i></button>
        `;
        container.parentNode.insertBefore(searchWrapper, container);

        document.getElementById('wo-search-input').addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderWorkOrders();
        });

        document.getElementById('wo-clear-search').addEventListener('click', () => {
            searchQuery = '';
            document.getElementById('wo-search-input').value = '';
            renderWorkOrders();
        });
    }

    // ---------- Get Filtered Data ----------
    function getFilteredOrders() {
        let filtered = currentFilter === 'All'
            ? allWorkOrders
            : allWorkOrders.filter(w => w.status === currentFilter);

        if (searchQuery) {
            filtered = filtered.filter(w =>
                (w.customers?.name || '').toLowerCase().includes(searchQuery) ||
                (w.employees?.name || '').toLowerCase().includes(searchQuery) ||
                (w.ket || '').toLowerCase().includes(searchQuery) ||
                (w.description || '').toLowerCase().includes(searchQuery) ||
                (w.status || '').toLowerCase().includes(searchQuery)
            );
        }
        return filtered;
    }

    // ---------- Render Table ----------
    function renderWorkOrders() {
        const filtered = getFilteredOrders();

        listContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Registrasi</th>
                            <th>Status / Ket</th>
                            <th>Pelanggan</th>
                            <th>Petugas / Poin</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `<tr><td colspan="5" class="text-center text-white-50 py-4">Tidak ada data yang cocok.</td></tr>` : ''}
                        ${filtered.map(wo => `
                            <tr>
                                <td>
                                    <div class="fw-bold text-accent">${wo.registration_date || '-'}</div>
                                    <div class="small text-white-50">Daftar: ${new Date(wo.created_at).toLocaleDateString('id-ID')}</div>
                                </td>
                                <td>
                                    <div class="mb-1">
                                        <span class="badge" style="background-color:${getStatusColor(wo.status) || '#6c757d'};color:#fff;">
                                            ${wo.status}
                                        </span>
                                    </div>
                                    <div class="small text-white-50">${wo.ket || wo.title || '-'}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${wo.customers?.name || '-'}</div>
                                    <div class="small text-white-50">${wo.customers?.phone || '-'}</div>
                                    <div class="small fst-italic text-white-50">${wo.customers?.address || '-'}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${wo.employees?.name || '-'}</div>
                                    <div class="small"><i class="bi bi-star-fill text-warning me-1"></i>${wo.points || 0} Poin</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-wo" data-id="${wo.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-outline-info view-wo-map" data-id="${wo.id}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>
                                        <button class="btn btn-outline-light copy-wo-format" data-id="${wo.id}" title="Salin Format"><i class="bi bi-clipboard"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.querySelectorAll('.edit-wo').forEach(btn => {
            btn.onclick = () => showWorkOrderModal(allWorkOrders.find(w => w.id === btn.dataset.id));
        });
        document.querySelectorAll('.view-wo-map').forEach(btn => {
            btn.onclick = () => showSingleMap(allWorkOrders.find(w => w.id === btn.dataset.id));
        });
        document.querySelectorAll('.copy-wo-format').forEach(btn => {
            btn.onclick = () => {
                const wo = allWorkOrders.find(w => w.id === btn.dataset.id);
                const mapLink = wo.customers?.lat ? `https://www.google.com/maps?q=${wo.customers.lat},${wo.customers.lng}` : '(Peta belum set)';
                const format = `${wo.customers?.name || '-'}, ${wo.customers?.address || '-'}, ${wo.customers?.phone || '-'}, ${mapLink}, (${wo.points || 0} poin)`;
                navigator.clipboard.writeText(format);
                showToast('Format PSB berhasil disalin!');
            };
        });
    }

    // ---------- Status Colors ----------
    function getStatusColor(status) {
        const map = {
            'Antrian': '#22c55e',  // green
            'Pending': '#f97316',  // orange
            'Konfirmasi': '#3b82f6', // blue
            'ODP Penuh': '#a16207',  // amber-brown
            'Cancel': '#374151',  // dark gray
            'Completed': '#6b7280',  // gray
            'Selesai': '#6b7280',  // gray
        };
        return map[status] || '#6c757d';
    }

    function getStatusBadgeClass(status) {
        switch (status) {
            case 'Antrian': return 'bg-success';
            case 'Pending': return 'bg-warning text-dark';
            case 'Completed':
            case 'Selesai': return 'bg-secondary';
            case 'Konfirmasi': return 'bg-primary';
            case 'ODP Penuh': return 'bg-brown';
            case 'Cancel': return 'bg-dark border border-secondary';
            default: return 'bg-info text-dark';
        }
    }

    // ---------- Modal CRUD ----------
    async function showWorkOrderModal(wo = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        const { data: customers } = await supabase.from('customers').select('*').order('name');
        const { data: employees } = await supabase.from('employees').select('id, name').order('name');

        modalTitle.innerText = wo ? 'Edit Antrian PSB' : 'Tambah Antrian PSB Baru';
        modalBody.innerHTML = `
            <form id="work-order-form" class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Tanggal Daftar (Wajib)</label>
                    <input type="date" class="form-control" id="wo-reg-date" value="${wo?.registration_date || new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Status Antrian</label>
                    <select class="form-select" id="wo-status">
                        <option value="Antrian" ${wo?.status === 'Antrian' ? 'selected' : ''}>Antrian</option>
                        <option value="Pending" ${wo?.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Konfirmasi" ${wo?.status === 'Konfirmasi' ? 'selected' : ''}>Konfirmasi</option>
                        <option value="ODP Penuh" ${wo?.status === 'ODP Penuh' ? 'selected' : ''}>ODP Penuh</option>
                        <option value="Cancel" ${wo?.status === 'Cancel' ? 'selected' : ''}>Cancel</option>
                        <option value="Completed" ${wo?.status === 'Completed' || wo?.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                    </select>
                </div>
                <div class="col-md-12 mb-3">
                    <label class="form-label small text-white-50">Pelanggan (Wajib)</label>
                    <select class="form-select" id="wo-customer-id" required>
                        <option value="">Pilih Pelanggan...</option>
                        ${customers?.map(c => `<option value="${c.id}" ${wo?.customer_id === c.id ? 'selected' : ''}>${c.name} - ${c.phone || ''}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Teknisi / Petugas</label>
                    <select class="form-select" id="wo-employee-id">
                        <option value="">Pilih Petugas...</option>
                        ${employees?.map(e => `<option value="${e.id}" ${wo?.employee_id === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Pembayaran</label>
                    <input type="text" class="form-control" id="wo-payment" value="${wo?.payment_status || ''}" placeholder="Contoh: Tunai, Transfer">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Nama Referal</label>
                    <input type="text" class="form-control" id="wo-referral" value="${wo?.referral_name || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Ket Singkat</label>
                    <input type="text" class="form-control" id="wo-ket" value="${wo?.ket || ''}" placeholder="Data OK, Data Tidak Lengkap">
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label small text-white-50">Keterangan / Detail (Notes)</label>
                    <textarea class="form-control" id="wo-description" rows="2">${wo?.description || ''}</textarea>
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label small text-white-50">URL Foto Rumah</label>
                    <input type="text" class="form-control" id="wo-photo" value="${wo?.photo_url || ''}" placeholder="https://...">
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const formData = {
                registration_date: document.getElementById('wo-reg-date').value,
                customer_id: document.getElementById('wo-customer-id').value,
                employee_id: document.getElementById('wo-employee-id').value || null,
                status: document.getElementById('wo-status').value,
                title: 'Pemasangan Baru (PSB)',
                payment_status: document.getElementById('wo-payment').value,
                referral_name: document.getElementById('wo-referral').value,
                ket: document.getElementById('wo-ket').value,
                description: document.getElementById('wo-description').value,
                photo_url: document.getElementById('wo-photo').value,
                updated_at: new Date().toISOString()
            };

            if (!formData.registration_date || !formData.customer_id) {
                return alert('Tanggal Daftar dan Pelanggan wajib diisi.');
            }

            let result;
            if (wo) {
                result = await supabase.from('work_orders').update(formData).eq('id', wo.id);
            } else {
                result = await supabase.from('work_orders').insert([formData]);
            }

            if (result.error) {
                alert('Gagal menyimpan: ' + result.error.message);
            } else {
                modal.hide();
                loadWorkOrders();
            }
        };

        modal.show();
    }

    // ---------- Single Map ----------
    function showSingleMap(wo) {
        if (!wo.customers?.lat || !wo.customers?.lng) return alert('Koordinat tidak disetel untuk pelanggan ini.');

        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        modal.show();

        setTimeout(() => {
            if (window.adminModalMap) {
                window.adminModalMap.remove();
                window.adminModalMap = null;
            }
            const map = L.map('admin-map').setView([wo.customers.lat, wo.customers.lng], 15);
            window.adminModalMap = map;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            const color = getStatusColor(wo.status);
            const markerHtml = createMarkerIcon(color);

            L.marker([wo.customers.lat, wo.customers.lng], {
                icon: L.divIcon({
                    className: '',
                    html: markerHtml,
                    iconSize: [32, 40],
                    iconAnchor: [16, 40],
                    popupAnchor: [0, -40]
                })
            }).addTo(map).bindPopup(buildPopup(wo)).openPopup();
        }, 300);
    }

    // ---------- Show All PSB Map (respects current filter) ----------
    window.showAllPSBMap = () => {
        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        modal.show();

        setTimeout(() => {
            if (window.adminModalMap) {
                window.adminModalMap.remove();
                window.adminModalMap = null;
            }

            // Use currently filtered data
            const source = getFilteredOrders();
            const valid = source.filter(w => w.customers?.lat && w.customers?.lng);

            if (valid.length === 0) return alert('Tidak ada data PSB dengan koordinat yang valid untuk filter ini.');

            const map = L.map('admin-map').setView([valid[0].customers.lat, valid[0].customers.lng], 12);
            window.adminModalMap = map;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            // Legend
            addMapLegend(map);

            // Update modal title
            const mTitle = document.querySelector('#mapModal .modal-title');
            if (mTitle) {
                const filterLabel = currentFilter === 'All' ? 'Semua Status' : currentFilter;
                mTitle.innerHTML = `<i class="bi bi-map me-2"></i>Peta PSB — <span class="badge" style="background:${getStatusColor(currentFilter) || 'var(--vscode-accent)'}">${filterLabel}</span> (${valid.length} titik)`;
            }

            const markers = [];
            valid.forEach(wo => {
                const color = getStatusColor(wo.status);
                const marker = L.marker([wo.customers.lat, wo.customers.lng], {
                    icon: L.divIcon({
                        className: '',
                        html: createMarkerIcon(color),
                        iconSize: [28, 36],
                        iconAnchor: [14, 36],
                        popupAnchor: [0, -36]
                    })
                }).addTo(map).bindPopup(buildPopup(wo));
                markers.push(marker);
            });

            if (markers.length > 1) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.15));
            }
        }, 300);
    };

    // ---------- Helpers ----------
    function createMarkerIcon(color) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
        </svg>`;
    }

    function buildPopup(wo) {
        const color = getStatusColor(wo.status);
        const mapsUrl = `https://www.google.com/maps?q=${wo.customers?.lat},${wo.customers?.lng}`;
        return `
            <div style="min-width:200px;font-family:sans-serif;">
                <div style="background:${color};color:#fff;padding:6px 10px;margin:-7px -7px 8px;border-radius:4px 4px 0 0;font-weight:600;">
                    <i class="bi bi-person"></i> ${wo.customers?.name || '-'}
                </div>
                <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    <tr><td style="color:#666;padding:2px 4px;">Status</td><td><span style="background:${color};color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;">${wo.status}</span></td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Daftar</td><td>${wo.registration_date || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">No HP</td><td>${wo.customers?.phone || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Alamat</td><td>${wo.customers?.address || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Petugas</td><td>${wo.employees?.name || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Ket</td><td>${wo.ket || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Bayar</td><td>${wo.payment_status || '-'}</td></tr>
                </table>
                <div style="margin-top:8px;">
                    <a href="${mapsUrl}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">
                        <i class="bi bi-map"></i> Buka Google Maps
                    </a>
                </div>
            </div>
        `;
    }

    function addMapLegend(mapInstance) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-legend');
            const statuses = ['Antrian', 'Pending', 'Konfirmasi', 'ODP Penuh', 'Cancel', 'Completed'];
            div.style.cssText = 'background:rgba(30,30,30,0.9);padding:10px 14px;border-radius:8px;color:#fff;font-size:12px;min-width:130px;border:1px solid #444;';
            div.innerHTML = `<div style="font-weight:600;margin-bottom:6px;border-bottom:1px solid #444;padding-bottom:4px;">Legend Status</div>` +
                statuses.map(s => `
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <span style="width:12px;height:12px;border-radius:50%;background:${getStatusColor(s)};display:inline-block;flex-shrink:0;border:1px solid #fff;"></span>
                        <span>${s}</span>
                    </div>`).join('');
            return div;
        };
        legend.addTo(mapInstance);
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'position-fixed bottom-0 end-0 m-3';
        t.style.zIndex = 9999;
        t.innerHTML = `<div class="toast show align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex"><div class="toast-body">${msg}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    // Brown badge CSS
    if (!document.getElementById('psb-styles')) {
        const style = document.createElement('style');
        style.id = 'psb-styles';
        style.innerHTML = `
            .bg-brown { background-color: #795548; color: #fff; }
            .wo-filter-badge.ring-active { outline: 2px solid #fff; outline-offset: 2px; }
            .wo-filter-badge:hover { opacity: 0.85; }
        `;
        document.head.appendChild(style);
    }

    loadWorkOrders();
}
