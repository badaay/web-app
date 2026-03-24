import { supabase, apiCall } from '../../api/supabase.js';
import { adminResetPassword, generatePassword } from '../../api/registration-service.js';
import { populatePackagesDropdown, getGoogleMapsLink, showSharedMap, createStandardMarker, getSpinner } from '../utils/ui-common.js';
import { showToast } from '../utils/toast.js';
import { APP_BASE_URL } from '../../config.js';

export async function initCustomers() {
    const listContainer = document.getElementById('customers-list');
    const addBtn = document.getElementById('add-customer-view-btn');

    let customersData = [];

    if (addBtn) {
        addBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('navigate', { detail: 'add-customer-view-content' }));
        };
    }


    async function loadCustomers() {
        listContainer.innerHTML = getSpinner('Memuat pelanggan...');

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
            listContainer.innerHTML = `
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-people-fill fs-1 d-block mb-3"></i>
                    Tidak ada pelanggan ditemukan.
                </div>`;
            return;
        }

        listContainer.innerHTML = `
            <div class="table-container shadow-sm">
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
                                    <div class="fw-bold">
                                        <a href="${APP_BASE_URL}/enduser/dashboard.html?cid=${cust.customer_code || cust.id}&customer=true" class="text-info text-decoration-none" target="_blank">
                                            <i class="bi bi-box-arrow-in-right me-1 small"></i>${cust.name}
                                        </a>
                                    </div>
                                    <div class="small text-white-50 text-uppercase" style="letter-spacing: 1px; font-size: 0.7rem;">${cust.customer_code || 'Belum Ada Kode'}</div>
                                    ${cust.email && !cust.email.includes('@sifatih.id') ? `<div class="smaller text-info opacity-75 mt-1" style="font-size: 0.65rem;"><i class="bi bi-envelope me-1"></i>${cust.email}</div>` : ''}
                                </td>
                                <td>
                                    <span class="badge bg-vscode-header border border-secondary text-white fw-normal">${cust.packet || '-'}</span>
                                </td>
                                <td>
                                    <div class="small text-wrap" style="max-width: 250px;">${cust.address}</div>
                                </td>
                                <td>
                                    <div class="small font-monospace">${cust.mac_address || '-'}</div>
                                    <div class="small fw-bold ${cust.damping < -28 ? 'text-danger' : 'text-success'}">${cust.damping || '-'} dBm</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-cust" data-id="${cust.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-outline-warning reset-pass" data-id="${cust.id}" data-name="${cust.name}" title="Reset Password"><i class="bi bi-shield-lock"></i></button>
                                        <button class="btn btn-outline-success quick-repair" data-id="${cust.id}" title="Buat Tiket Perbaikan"><i class="bi bi-tools"></i></button>
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

        document.querySelectorAll('.quick-repair').forEach(btn => {
            btn.onclick = () => {
                const cust = customersData.find(c => String(c.id) === btn.dataset.id);
                document.dispatchEvent(new CustomEvent('navigate', { detail: 'work-orders-content' }));
                // We need a way to trigger the "Add WO" modal with this customer selected
                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('quick-wo', { detail: cust }));
                }, 500);
            };
        });

        document.querySelectorAll('.reset-pass').forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const userId = btn.dataset.id;
                const userName = btn.dataset.name;

                if (!confirm(`Apakah Anda yakin ingin mengatur ulang kata sandi untuk "${userName}"?`)) return;

                const newPass = generatePassword();
                const icon = btn.querySelector('i');
                const originalClass = icon.className;

                try {
                    btn.disabled = true;
                    icon.className = 'spinner-border spinner-border-sm';

                    await adminResetPassword(userId, newPass);

                    showToast('success', `Kata sandi berhasil diatur ulang!\n\nUser: ${userName}\nPassword Baru: ${newPass}`);
                } catch (err) {
                    console.error("Reset password error:", err);
                    showToast('error', "Gagal mengatur ulang kata sandi: " + err.message);
                } finally {
                    btn.disabled = false;
                    icon.className = originalClass;
                }
            };
        });
    }

    function showMap(lat, lng, cust) {
        if (!lat || !lng) return showToast('warning', 'Koordinat tidak disetel untuk pelanggan ini.');

        const mapsUrl = getGoogleMapsLink(lat, lng);
        const popupHtml = `
            <div style="font-family:sans-serif; min-width:210px;">
                <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:8px 12px;margin:-7px -7px 10px;border-radius:4px 4px 0 0;">
                    <div style="font-weight:700;font-size:13px;">${cust.name}</div>
                    <div style="font-size:11px;opacity:0.85;">${cust.customer_code || ''}</div>
                </div>
                <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    <tr><td style="color:#666;padding:2px 4px;">🏠 Alamat</td><td>${cust.address || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📱 No HP</td><td>${cust.phone || '-'}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📦 Paket</td><td style="font-weight:600;">${cust.packet || '-'}</td></tr>
                </table>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
                    <a href="${mapsUrl}" target="_blank" class="btn btn-sm btn-success w-100 text-white" style="font-size:11px;">
                        <i class="bi bi-google me-1"></i> Buka Google Maps
                    </a>
                </div>
            </div>
        `;

        showSharedMap(lat, lng, `Lokasi: ${cust?.name}`, popupHtml);
    }


    // --------- CRUD Modal ---------
    async function showCustomerModal(cust = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = cust ? `Edit Pelanggan: ${cust.name}` : 'Tambah Pelanggan';

        modalBody.innerHTML = `
            <form id="customer-form" class="row g-3">
                <!-- Section 1: Kredensial & Akun -->
                <div class="col-12">
                    <div class="card bg-vscode border-secondary mb-3 shadow-sm">
                        <div class="card-header bg-vscode-header border-0 py-2">
                            <h6 class="mb-0 text-info fw-bold small"><i class="bi bi-shield-lock me-2"></i>Akses Login</h6>
                        </div>
                        <div class="card-body p-3">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label text-white-50 small fw-bold">ID Login (Customer Code)</label>
                                    <input type="text" class="form-control form-control-sm bg-dark text-info fw-bold" id="cust-code" value="${cust?.customer_code || ''}" readonly>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-white-50 small fw-bold">Password Baru (Optional)</label>
                                    <div class="input-group input-group-sm">
                                        <input type="password" id="cust-new-password" class="form-control" placeholder="Kosongkan jika tidak diubah">
                                        <button class="btn btn-outline-secondary" type="button" id="btn-gen-new-pass">
                                            <i class="bi bi-magic"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" type="button" id="toggle-new-pass">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </div>
                                    <div id="new-pass-msg" class="smaller text-warning mt-1 d-none">Password akan diupdate saat simpan.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Informasi Profil -->
                <div class="col-md-6">
                    <div class="bg-vscode border-0 p-0 shadow-none">
                         <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">Nama Lengkap</label>
                                <input type="text" class="form-control" id="cust-name" value="${cust?.name || ''}" required>
                            </div>
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">Email Kontak (Opsional)</label>
                                <input type="text" class="form-control" id="cust-email" value="${cust?.email && !cust?.email.includes('@sifatih.id') ? cust.email : ''}" placeholder="Alamat email aktif">
                            </div>
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">NIK / KTP</label>
                                <input type="text" class="form-control" id="cust-ktp" value="${cust?.ktp || ''}">
                            </div>
                            <div class="col-6">
                                <label class="form-label text-white-50 small fw-bold">No. HP Utama</label>
                                <input type="text" class="form-control" id="cust-phone" value="${cust?.phone || ''}">
                            </div>
                            <div class="col-6">
                                <label class="form-label text-white-50 small fw-bold">No. HP Alternatif</label>
                                <input type="text" class="form-control" id="cust-alt-phone" value="${cust?.alt_phone || ''}">
                            </div>
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">Paket Layanan</label>
                                <select class="form-select" id="cust-packet-select">
                                    <option value="">Memuat paket...</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">Alamat Pemasangan</label>
                                <textarea class="form-control" id="cust-address" rows="3" required>${cust?.address || ''}</textarea>
                            </div>
                            <div class="col-12">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <label class="form-label text-white-50 small fw-bold mb-0">Koordinat Lokasi</label>
                                    <a id="edit-google-maps-link" href="${cust?.lat ? getGoogleMapsLink(cust.lat, cust.lng) : '#'}" target="_blank" class="btn btn-link text-success p-0 text-decoration-none smaller ${cust?.lat ? '' : 'd-none'}">
                                        <i class="bi bi-google me-1"></i> Google Maps
                                    </a>
                                </div>
                                <div class="input-group input-group-sm mb-2">
                                    <input type="number" step="any" class="form-control" id="cust-lat" value="${cust?.lat || ''}" placeholder="Lat">
                                    <input type="number" step="any" class="form-control" id="cust-lng" value="${cust?.lng || ''}" placeholder="Lng">
                                </div>
                                <div id="edit-location-picker-map" class="rounded border border-secondary" style="height: 200px; background: #1e1e1e; z-index: 1;"></div>
                            </div>
                         </div>
                    </div>
                </div>

                <!-- Section 3: Teknis & Media -->
                <div class="col-md-6">
                    <div class="row g-3">
                        <div class="col-md-12">
                            <label class="form-label text-white-50 small fw-bold">Username PPPoE</label>
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="cust-username" value="${cust?.username || ''}" placeholder="Username">
                            </div>
                        </div>
                         <div class="col-md-12">
                            <label class="form-label text-white-50 small fw-bold">MAC Address</label>
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="cust-mac" value="${cust?.mac_address || ''}" placeholder="MAC Address">
                            </div>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label text-white-50 small fw-bold">Redaman (dBm)</label>
                            <input type="text" class="form-control form-control-sm" id="cust-damping" value="${cust?.damping || ''}">
                        </div>
                        <div class="col-md-12">
                            <label class="form-label text-white-50 small fw-bold">Tgl Pasang</label>
                            <input type="date" class="form-control form-control-sm" id="cust-install-date" value="${cust?.install_date || ''}">
                        </div>
                        <div class="col-md-12">
                            <div class="row g-2">
                                <div class="col-6">
                                    <label class="form-label text-white-50 small fw-bold d-block"><i class="bi bi-person-bounding-box me-1"></i>Foto KTP</label>
                                    <input type="file" class="form-control form-control-sm" id="cust-ktp-file" accept="image/*">
                                    <div id="edit-ktp-preview-container" class="${cust?.photo_ktp ? '' : 'd-none'} mt-1 text-center">
                                        <img src="${cust?.photo_ktp || ''}" class="img-thumbnail bg-dark" style="max-height: 80px;">
                                    </div>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-white-50 small fw-bold d-block"><i class="bi bi-house me-1"></i>Foto Rumah</label>
                                    <input type="file" class="form-control form-control-sm" id="cust-house-file" accept="image/*">
                                    <div id="edit-house-preview-container" class="${cust?.photo_rumah ? '' : 'd-none'} mt-1 text-center">
                                        <img src="${cust?.photo_rumah || ''}" class="img-thumbnail bg-dark" style="max-height: 80px;">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

        // Interactive Map Selector Logic
        setTimeout(() => {
            const latInput = document.getElementById('cust-lat');
            const lngInput = document.getElementById('cust-lng');
            const gLink = document.getElementById('edit-google-maps-link');
            
            const initialLat = parseFloat(latInput.value) || -6.2000;
            const initialLng = parseFloat(lngInput.value) || 106.8166;
            
            const editMap = L.map('edit-location-picker-map').setView([initialLat, initialLng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(editMap);
            
            let editMarker;
            if (parseFloat(latInput.value) && parseFloat(lngInput.value)) {
                editMarker = L.marker([initialLat, initialLng]).addTo(editMap);
            }

            const updateMap = (lat, lng) => {
                if (editMarker) editMarker.setLatLng([lat, lng]);
                else editMarker = L.marker([lat, lng]).addTo(editMap);
                editMap.panTo([lat, lng]);
                
                const url = getGoogleMapsLink(lat, lng);
                if (url) {
                    gLink.href = url;
                    gLink.classList.remove('d-none');
                }
            };

            editMap.on('click', (e) => {
                const { lat, lng } = e.latlng;
                latInput.value = lat.toFixed(7);
                lngInput.value = lng.toFixed(7);
                updateMap(lat, lng);
            });

            [latInput, lngInput].forEach(el => {
                el.oninput = () => {
                    const l = parseFloat(latInput.value);
                    const n = parseFloat(lngInput.value);
                    if (!isNaN(l) && !isNaN(n)) updateMap(l, n);
                };
            });
            
            // Re-invalidate size to fix grey tiles in modal
            setTimeout(() => editMap.invalidateSize(), 300);
        }, 500);

        // Populate Packages
        populatePackagesDropdown('cust-packet-select', cust?.packet);

        // Logic for Password handling in Edit
        const genPassBtn = document.getElementById('btn-gen-new-pass');
        const togglePassBtn = document.getElementById('toggle-new-pass');
        const passInput = document.getElementById('cust-new-password');
        const passMsg = document.getElementById('new-pass-msg');

        if (genPassBtn) {
            genPassBtn.onclick = () => {
                passInput.value = generatePassword();
                passInput.type = 'text';
                passMsg.classList.remove('d-none');
            };
        }

        if (togglePassBtn) {
            togglePassBtn.onclick = () => {
                const icon = togglePassBtn.querySelector('i');
                if (passInput.type === 'password') {
                    passInput.type = 'text';
                    icon.classList.replace('bi-eye', 'bi-eye-slash');
                } else {
                    passInput.type = 'password';
                    icon.classList.replace('bi-eye-slash', 'bi-eye');
                }
            };
        }

        // Media handlers (Base64)
        let newPhotoKTP = cust?.photo_ktp || null;
        let newPhotoHouse = cust?.photo_rumah || null;

        const setupFileHandler = (id, previewId, containerId, setter) => {
            const input = document.getElementById(id);
            if (!input) return;
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target.result;
                        setter(base64);
                        const cont = document.getElementById(containerId);
                        cont.classList.remove('d-none');
                        cont.querySelector('img').src = base64;
                    };
                    reader.readAsDataURL(file);
                }
            };
        };

        setupFileHandler('cust-ktp-file', 'edit-ktp-preview', 'edit-ktp-preview-container', (v) => newPhotoKTP = v);
        setupFileHandler('cust-house-file', 'edit-house-preview', 'edit-house-preview-container', (v) => newPhotoHouse = v);

        saveBtn.onclick = async () => {
            const formData = {
                name: document.getElementById('cust-name').value.trim(),
                customer_code: document.getElementById('cust-code').value.trim(),
                ktp: document.getElementById('cust-ktp').value.trim(),
                phone: document.getElementById('cust-phone').value.trim(),
                alt_phone: document.getElementById('cust-alt-phone').value.trim(),
                packet: document.getElementById('cust-packet-select').value,
                install_date: document.getElementById('cust-install-date').value || null,
                address: document.getElementById('cust-address').value.trim(),
                username: document.getElementById('cust-username').value.trim(),
                mac_address: document.getElementById('cust-mac').value.trim(),
                damping: document.getElementById('cust-damping').value.trim(),
                lat: parseFloat(document.getElementById('cust-lat').value) || null,
                lng: parseFloat(document.getElementById('cust-lng').value) || null,
                photo_ktp: newPhotoKTP,
                photo_rumah: newPhotoHouse,
                email: document.getElementById('cust-email').value.trim() || (cust?.email && !cust?.email.includes('@sifatih.id') ? cust.email : null)
            };

            if (!formData.name || !formData.address) return showToast('warning', 'Nama dan Alamat wajib diisi.');

            saveBtn.disabled = true;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

            try {
                // 1. Update Password if set
                if (passInput.value.trim().length > 0) {
                    await adminResetPassword(cust.id, passInput.value.trim());
                    console.log("Password updated successfully");
                }

                // 2. Update Customer Data via server-side API
                await apiCall(`/customers/${cust.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(formData),
                });

                showToast('success', 'Data pelanggan berhasil diperbarui!');
                modal.hide();
                loadCustomers();
            } catch (err) {
                console.error("Save edit error:", err);
                showToast('error', 'Gagal menyimpan: ' + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        };

        modal.show();
    }

    loadCustomers();
}
