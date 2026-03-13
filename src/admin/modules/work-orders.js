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
                            <th>Teknisi</th>
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
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-wo" data-id="${wo.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-outline-info view-wo-map" data-id="${wo.id}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>
                                        <button class="btn btn-outline-light copy-wo-format" data-id="${wo.id}" title="Salin Format"><i class="bi bi-clipboard"></i></button>
                                        ${wo.status === 'Konfirmasi' || wo.status === 'Completed' || wo.status === 'Selesai' ? `<button class="btn btn-outline-success monitor-wo" data-id="${wo.id}" title="Pantau Pemasangan"><i class="bi bi-tools"></i></button>` : ''}
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
        document.querySelectorAll('.monitor-wo').forEach(btn => {
            btn.onclick = () => showInstallationMonitoringModal(allWorkOrders.find(w => w.id === btn.dataset.id));
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

        let monitoringData = null;
        if (wo) {
            const { data: monData } = await supabase.from('installation_monitorings').select('*').eq('work_order_id', wo.id).maybeSingle();
            monitoringData = monData;
        }

        modalTitle.innerText = wo ? 'Edit Antrian PSB' : 'Tambah Antrian PSB Baru';
        modalBody.innerHTML = `
            <form id="work-order-form" class="row">
                <!-- LEFT COLUMN: CUSTOMER -->
                <div class="col-md-6 border-end border-secondary">
                    <h6 class="text-accent mb-3"><i class="bi bi-person"></i> Data Pelanggan</h6>
                    
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Cari / Pilih Pelanggan (Sedia Ada)</label>
                        <select class="form-select" id="wo-customer-select">
                            <option value="">-- Buat Pelanggan Baru --</option>
                            ${customers?.map(c => `<option value="${c.id}" ${wo?.customer_id === c.id ? 'selected' : ''} 
                                data-name="${c.name || ''}" data-phone="${c.phone || ''}" data-address="${c.address || ''}" 
                                data-lat="${c.lat || ''}" data-lng="${c.lng || ''}" data-ktp="${c.ktp || ''}">
                                ${c.name} - ${c.phone || ''}
                            </option>`).join('')}
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-white-50">Nama Pelanggan (Wajib)</label>
                        <input type="text" class="form-control" id="wo-cust-name" value="${wo?.customers?.name || ''}" required placeholder="Nama Sesuai KTP">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-white-50">No Handphone (Wajib)</label>
                        <input type="text" class="form-control" id="wo-cust-phone" value="${wo?.customers?.phone || ''}" required placeholder="08xxxxxxxx">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Alamat Lengkap</label>
                        <textarea class="form-control" id="wo-cust-address" rows="2" placeholder="Detail Alamat">${wo?.customers?.address || ''}</textarea>
                    </div>
                    <div class="row g-2 mb-3 align-items-center">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Latitude</label>
                            <input type="number" step="any" class="form-control" id="wo-cust-lat" value="${wo?.customers?.lat || ''}" placeholder="-7.xxxxx">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Longitude</label>
                            <input type="number" step="any" class="form-control" id="wo-cust-lng" value="${wo?.customers?.lng || ''}" placeholder="112.xxxxx">
                        </div>
                        <div class="col-12 mt-2">
                            <div class="position-relative">
                                <div id="wo-location-picker" class="rounded border border-secondary shadow-sm" style="height: 200px; background: #1e1e1e; z-index: 1;"></div>
                                <button type="button" id="wo-btn-get-location" class="btn btn-sm btn-dark border-secondary position-absolute" style="top: 10px; right: 10px; z-index: 1000;">
                                    <i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi
                                </button>
                            </div>
                        </div>
                        <div class="col-12 mt-1">
                            <a href="#" id="wo-maps-link" target="_blank" class="small text-info text-decoration-none" style="display: none;">
                                <i class="bi bi-geo-alt-fill"></i> Buka Titik di Google Maps
                            </a>
                        </div>
                    </div>

                    <div class="row g-2 mb-3">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Foto Rumah</label>
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="wo-photo-rumah" value="${wo?.photo_url || ''}" placeholder="URL / File">
                                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('wo-file-rumah').click()"><i class="bi bi-upload"></i></button>
                                <input type="file" id="wo-file-rumah" class="d-none" accept="image/*">
                            </div>
                            <div id="wo-preview-rumah" class="mt-2 text-center" style="${wo?.photo_url ? 'display:block;' : 'display:none;'}">
                                <img src="${wo?.photo_url || ''}" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px; object-fit: cover; border-radius: 6px;">
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Foto KTP</label>
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="wo-photo-ktp" value="${wo?.customers?.ktp || ''}" placeholder="URL / File">
                                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('wo-file-ktp').click()"><i class="bi bi-upload"></i></button>
                                <input type="file" id="wo-file-ktp" class="d-none" accept="image/*">
                            </div>
                            <div id="wo-preview-ktp" class="mt-2 text-center" style="${wo?.customers?.ktp ? 'display:block;' : 'display:none;'}">
                                <img src="${wo?.customers?.ktp || ''}" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px; object-fit: cover; border-radius: 6px;">
                            </div>
                        </div>
                        <div class="col-12 small text-white-50 fst-italic mt-1" style="font-size:0.75rem;">* Anda bisa input URL langsung atau upload file gambar dari perangkat Anda.</div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: WORK ORDER & INSTALLATION -->
                <div class="col-md-6">
                    <h6 class="text-accent mb-3"><i class="bi bi-card-checklist"></i> Antrian & Pemasangan</h6>
                    
                    <div class="row g-2 mb-3">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Tanggal Daftar (Wajib)</label>
                            <input type="date" class="form-control" id="wo-reg-date" value="${wo?.registration_date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="col-sm-6">
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
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Teknisi / Petugas</label>
                        <select class="form-select" id="wo-employee-id">
                            <option value="">Belum Ditugaskan...</option>
                            ${employees?.map(e => `<option value="${e.id}" ${wo?.employee_id === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="row g-2 mb-3">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Pembayaran</label>
                            <input type="text" class="form-control" id="wo-payment" value="${wo?.payment_status || ''}" placeholder="Cth: Lunas via TF">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Keterangan Paket</label>
                            <input type="text" class="form-control" id="wo-ket" value="${wo?.ket || ''}" placeholder="Cth: Paket Up to 30Mbps">
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Catatan Internal</label>
                        <textarea class="form-control" id="wo-description" rows="2" placeholder="Catatan tambahan...">${wo?.description || ''}</textarea>
                    </div>

                    <!-- Installation Specifics -->
                    <h6 class="text-accent mb-2 mt-4 border-top border-secondary pt-3"><i class="bi bi-calendar-event"></i> Jadwal Pemasangan</h6>
                    <div class="row g-2 mb-3">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Rencana Tgl Pemasangan</label>
                            <input type="date" class="form-control" id="wo-planned-date" value="${monitoringData?.planned_date || ''}">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Aktual Terpasang</label>
                            <input type="date" class="form-control" id="wo-actual-date" value="${monitoringData?.actual_date || ''}">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Tanggal Aktif Billing</label>
                            <input type="date" class="form-control" id="wo-activation-date" value="${monitoringData?.activation_date || ''}">
                        </div>
                        <div class="col-sm-6 d-flex align-items-end mb-1">
                            <div class="form-check form-switch w-100">
                                <input class="form-check-input" type="checkbox" role="switch" id="wo-is-confirmed" ${monitoringData?.is_confirmed ? 'checked' : ''}>
                                <label class="form-check-label small text-white" for="wo-is-confirmed">Pemasangan Dikonfirmasi</label>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

        // Logic UI Events
        setTimeout(() => {
            let pickMap, marker;

            const updateMapLink = () => {
                const lat = document.getElementById('wo-cust-lat').value;
                const lng = document.getElementById('wo-cust-lng').value;
                const mapLink = document.getElementById('wo-maps-link');
                if (lat && lng) {
                    mapLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
                    mapLink.style.display = 'inline-block';
                    if (marker) marker.setLatLng([lat, lng]);
                } else {
                    mapLink.style.display = 'none';
                }
            };

            const initLat = parseFloat(document.getElementById('wo-cust-lat').value) || -7.150970;
            const initLng = parseFloat(document.getElementById('wo-cust-lng').value) || 112.721245;

            pickMap = L.map('wo-location-picker').setView([initLat, initLng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickMap);

            if (document.getElementById('wo-cust-lat').value && document.getElementById('wo-cust-lng').value) {
                marker = L.marker([initLat, initLng]).addTo(pickMap);
            }

            const setPin = (lat, lng) => {
                document.getElementById('wo-cust-lat').value = lat.toFixed(7);
                document.getElementById('wo-cust-lng').value = lng.toFixed(7);
                if (marker) marker.remove();
                marker = L.marker([lat, lng]).addTo(pickMap);
                pickMap.setView([lat, lng], 16);
                updateMapLink();
            };

            pickMap.on('click', (e) => setPin(e.latlng.lat, e.latlng.lng));

            document.getElementById('wo-btn-get-location').onclick = () => {
                if (!navigator.geolocation) return alert('Geolokasi tidak didukung.');
                document.getElementById('wo-btn-get-location').innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>...';
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        setPin(pos.coords.latitude, pos.coords.longitude);
                        document.getElementById('wo-btn-get-location').innerHTML = '<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya';
                    },
                    err => {
                        alert('Gagal: ' + err.message);
                        document.getElementById('wo-btn-get-location').innerHTML = '<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya';
                    }
                );
            };

            // Force map resize after transition ends
            setTimeout(() => pickMap.invalidateSize(), 300);

            const setupPhotoUpload = (inputId, textId, previewId) => {
                const fileIn = document.getElementById(inputId);
                const textIn = document.getElementById(textId);
                const prevDiv = document.getElementById(previewId);
                const prevImg = prevDiv.querySelector('img');

                fileIn.addEventListener('change', e => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                            textIn.value = ev.target.result;
                            prevImg.src = ev.target.result;
                            prevDiv.style.display = 'block';
                        };
                        reader.readAsDataURL(file);
                    }
                });

                textIn.addEventListener('input', e => {
                    if (e.target.value) {
                        prevImg.src = e.target.value;
                        prevDiv.style.display = 'block';
                    } else {
                        prevDiv.style.display = 'none';
                    }
                });
            };

            setupPhotoUpload('wo-file-rumah', 'wo-photo-rumah', 'wo-preview-rumah');
            setupPhotoUpload('wo-file-ktp', 'wo-photo-ktp', 'wo-preview-ktp');

            const latInput = document.getElementById('wo-cust-lat');
            const lngInput = document.getElementById('wo-cust-lng');
            if (latInput && lngInput) {
                latInput.addEventListener('input', updateMapLink);
                lngInput.addEventListener('input', updateMapLink);
                updateMapLink();
            }

            const custSelect = document.getElementById('wo-customer-select');
            if (custSelect) {
                custSelect.addEventListener('change', (e) => {
                    const opt = e.target.options[e.target.selectedIndex];
                    if (e.target.value) {
                        document.getElementById('wo-cust-name').value = opt.dataset.name || '';
                        document.getElementById('wo-cust-phone').value = opt.dataset.phone || '';
                        document.getElementById('wo-cust-address').value = opt.dataset.address || '';
                        document.getElementById('wo-cust-lat').value = opt.dataset.lat || '';
                        document.getElementById('wo-cust-lng').value = opt.dataset.lng || '';
                        document.getElementById('wo-photo-ktp').value = opt.dataset.ktp || '';
                    } else {
                        document.getElementById('wo-cust-name').value = '';
                        document.getElementById('wo-cust-phone').value = '';
                        document.getElementById('wo-cust-address').value = '';
                        document.getElementById('wo-cust-lat').value = '';
                        document.getElementById('wo-cust-lng').value = '';
                        document.getElementById('wo-photo-ktp').value = '';
                    }
                    updateMapLink();
                });
            }
        }, 100);

        saveBtn.onclick = async () => {
            const custId = document.getElementById('wo-customer-select').value;
            const custName = document.getElementById('wo-cust-name').value;
            const custPhone = document.getElementById('wo-cust-phone').value;
            const custAddress = document.getElementById('wo-cust-address').value;
            const custLat = document.getElementById('wo-cust-lat').value;
            const custLng = document.getElementById('wo-cust-lng').value;
            const photoKtp = document.getElementById('wo-photo-ktp').value;

            const regDate = document.getElementById('wo-reg-date').value;
            const status = document.getElementById('wo-status').value;
            const empId = document.getElementById('wo-employee-id').value || null;
            const payment = document.getElementById('wo-payment').value;
            const ket = document.getElementById('wo-ket').value;
            const notes = document.getElementById('wo-description').value;
            const photoRumah = document.getElementById('wo-photo-rumah').value;

            const plannedDate = document.getElementById('wo-planned-date').value || null;
            const actualDate = document.getElementById('wo-actual-date').value || null;
            const actDate = document.getElementById('wo-activation-date').value || null;
            const isConfirmed = document.getElementById('wo-is-confirmed').checked;

            if (!custName || !custPhone || !regDate) {
                return alert('Mohon isi field Wajib (Nama, No HP, Tanggal Daftar).');
            }

            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
            saveBtn.disabled = true;

            try {
                let activeCustomerId = custId;

                // Set default Customer role ID if needed
                const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'Customer').maybeSingle();
                const defaultRoleId = roleData ? roleData.id : null;

                const custPayload = {
                    name: custName, phone: custPhone, address: custAddress,
                    lat: custLat ? parseFloat(custLat) : null, lng: custLng ? parseFloat(custLng) : null,
                    ktp: photoKtp, role_id: defaultRoleId
                };

                if (custId) {
                    await supabase.from('customers').update(custPayload).eq('id', custId);
                } else {
                    const { data: newCust, error } = await supabase.from('customers').insert([custPayload]).select().single();
                    if (error) throw error;
                    activeCustomerId = newCust.id;
                }

                const woData = {
                    customer_id: activeCustomerId,
                    employee_id: empId,
                    status: status,
                    title: 'Pemasangan Baru (PSB)',
                    payment_status: payment,
                    ket: ket,
                    description: notes,
                    photo_url: photoRumah,
                    registration_date: regDate,
                    updated_at: new Date().toISOString()
                };

                let activeWoId = wo?.id;
                if (wo) {
                    const { error } = await supabase.from('work_orders').update(woData).eq('id', wo.id);
                    if (error) throw error;
                } else {
                    const { data: newWo, error } = await supabase.from('work_orders').insert([woData]).select().single();
                    if (error) throw error;
                    activeWoId = newWo.id;
                }

                // Installation Monitoring Sync
                if (status === 'Konfirmasi' || status === 'Completed' || status === 'Selesai' || plannedDate || actualDate || actDate || isConfirmed || monitoringData) {
                    const monData = {
                        work_order_id: activeWoId,
                        customer_id: activeCustomerId,
                        employee_id: empId,
                        planned_date: plannedDate,
                        actual_date: actualDate,
                        activation_date: actDate,
                        is_confirmed: isConfirmed,
                        updated_at: new Date().toISOString()
                    };

                    if (monitoringData) {
                        await supabase.from('installation_monitorings').update(monData).eq('id', monitoringData.id);
                    } else {
                        await supabase.from('installation_monitorings').insert([monData]);
                    }
                }

                modal.hide();
                loadWorkOrders();
            } catch (err) {
                alert('Gagal menyimpan: ' + err.message);
            } finally {
                saveBtn.innerHTML = 'Simpan';
                saveBtn.disabled = false;
            }
        };

        modal.show();
    }

    // ---------- Modal Installation Monitoring ----------
    async function showInstallationMonitoringModal(wo) {
        if (!wo) return;
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerHTML = `<i class="bi bi-tools text-success me-2"></i> Pantau Proses Pemasangan`;
        modalBody.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>`;
        modal.show();

        const { data: monData, error } = await supabase.from('installation_monitorings').select('*').eq('work_order_id', wo.id).maybeSingle();

        const m = monData || {};

        modalBody.innerHTML = `
            <form id="monitor-form">
                <div class="alert bg-dark border-secondary text-white-50 mb-4 p-3 shadow-sm">
                    <table>
                        <tr><td style="width: 80px;" class="fw-bold">Pelanggan</td><td>: ${wo.customers?.name || '-'}</td></tr>
                        <tr><td class="fw-bold">No HP</td><td>: ${wo.customers?.phone || '-'}</td></tr>
                        <tr><td class="fw-bold">Teknisi</td><td>: ${wo.employees?.name || '-'}</td></tr>
                        <tr><td class="fw-bold">Alamat</td><td>: ${wo.customers?.address || '-'}</td></tr>
                    </table>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">Rencana Pemasangan</label>
                        <input type="date" class="form-control" id="mon-planned-date" value="${m.planned_date || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">Aktual Pemasangan</label>
                        <input type="date" class="form-control" id="mon-actual-date" value="${m.actual_date || ''}">
                    </div>
                    <div class="col-md-12">
                        <label class="form-label small text-white-50">Bukti Foto Instalasi</label>
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" id="mon-photo" value="${m.photo_proof || ''}" placeholder="URL / File">
                            <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('mon-file-photo').click()"><i class="bi bi-upload"></i></button>
                            <input type="file" id="mon-file-photo" class="d-none" accept="image/*">
                        </div>
                        <div id="mon-preview-photo" class="mt-2 text-center" style="${m.photo_proof ? 'display:block;' : 'display:none;'}">
                            <img src="${m.photo_proof || ''}" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" onerror="this.style.display='none'">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">MAC Address Modem</label>
                        <input type="text" class="form-control" id="mon-mac" value="${m.mac_address || ''}" placeholder="Cth: 1A:2B:3C:4D:5E:6F">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">SN Modem (Serial Number)</label>
                        <input type="text" class="form-control" id="mon-sn" value="${m.sn_modem || ''}" placeholder="Cth: ZTE12345678">
                    </div>
                    <div class="col-12 mt-4 p-3 bg-dark border border-secondary rounded shadow-sm">
                        <div class="form-check form-switch fs-6 mb-0 d-flex align-items-center">
                            <input class="form-check-input mt-0 me-3" type="checkbox" role="switch" id="mon-is-confirmed" ${m.is_confirmed ? 'checked' : ''} style="transform: scale(1.3);">
                            <label class="form-check-label text-white fw-bold" for="mon-is-confirmed">Pemasangan Selesai Dikerjakan (Dikonfirmasi)</label>
                        </div>
                    </div>
                </div>
            </form>
        `;

        setTimeout(() => {
            const setupPhotoUpload = (inputId, textId, previewId) => {
                const fileIn = document.getElementById(inputId);
                const textIn = document.getElementById(textId);
                const prevDiv = document.getElementById(previewId);
                const prevImg = prevDiv.querySelector('img');

                fileIn.addEventListener('change', e => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                            textIn.value = ev.target.result;
                            prevImg.src = ev.target.result;
                            prevDiv.style.display = 'block';
                        };
                        reader.readAsDataURL(file);
                    }
                });

                textIn.addEventListener('input', e => {
                    if (e.target.value) {
                        prevImg.src = e.target.value;
                        prevDiv.style.display = 'block';
                    } else {
                        prevDiv.style.display = 'none';
                    }
                });
            };

            setupPhotoUpload('mon-file-photo', 'mon-photo', 'mon-preview-photo');
        }, 100);

        saveBtn.onclick = async () => {
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
            saveBtn.disabled = true;

            try {
                const monPayload = {
                    work_order_id: wo.id,
                    customer_id: wo.customer_id,
                    employee_id: wo.employee_id,
                    planned_date: document.getElementById('mon-planned-date').value || null,
                    actual_date: document.getElementById('mon-actual-date').value || null,
                    photo_proof: document.getElementById('mon-photo').value,
                    mac_address: document.getElementById('mon-mac').value,
                    sn_modem: document.getElementById('mon-sn').value,
                    is_confirmed: document.getElementById('mon-is-confirmed').checked,
                    updated_at: new Date().toISOString()
                };

                if (m.id) {
                    await supabase.from('installation_monitorings').update(monPayload).eq('id', m.id);
                } else {
                    await supabase.from('installation_monitorings').insert([monPayload]);
                }

                // Also optionally update the wo table if confirmed
                if (monPayload.is_confirmed && wo.status !== 'Completed' && wo.status !== 'Selesai') {
                    if (confirm('Pemasangan dikonfirmasi. Ganti status antrian PSB menjadi Selesai?')) {
                        await supabase.from('work_orders').update({ status: 'Selesai' }).eq('id', wo.id);
                    }
                }

                modal.hide();
                loadWorkOrders();
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                saveBtn.innerHTML = 'Simpan';
                saveBtn.disabled = false;
            }
        };
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
