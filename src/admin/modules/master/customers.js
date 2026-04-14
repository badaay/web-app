import { supabase, supabaseA, supabaseB, apiCall, getStorageUrl } from '../../../api/supabase.js';
import { compressImage } from '../../utils/image-utils.js';
import { adminResetPassword, generatePassword } from '../../api/registration-service.js';
import { populatePackagesDropdown, getGoogleMapsLink, showSharedMap, createStandardMarker, getSpinner } from '../../utils/ui-common.js';
import { createLocationPicker, parseCoordsField } from '../../utils/map-kit.js';
import { showToast } from '../../utils/toast.js';
import { APP_BASE_URL } from '../../config.js';
import { APP_CONFIG } from '../../api/config.js';

export async function initCustomers() {
    const listContainer = document.getElementById('customers-list');
    const queuedListContainer = document.getElementById('customers-queued-list');
    const addBtn = document.getElementById('add-customer-view-btn');

    let customersData = [];

    if (addBtn) {
        addBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('navigate', { detail: 'add-customer-view-content' }));
        };
    }

    initImportActions(loadCustomers);


    async function loadCustomers() {
        listContainer.innerHTML = getSpinner('Memuat pelanggan...');
        if (queuedListContainer) queuedListContainer.innerHTML = getSpinner('Memuat pelanggan...');

        const { data, error } = await supabase
            .from('customers')
            .select(`
                *,
                roles(name),
                work_orders(status)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            listContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            if (queuedListContainer) queuedListContainer.innerHTML = `<div class="text-danger">Kesalahan: ${error.message}</div>`;
            return;
        }

        customersData = data || [];

        const installedCustomers = [];
        const queuedCustomers = [];

        customersData.forEach(cust => {
            const wos = cust.work_orders || [];
            const isConfirmedOrOpen = wos.some(wo => wo.status === 'confirmed' || wo.status === 'open');
            const isWaiting = wos.some(wo => wo.status === 'waiting');
            const isInstalled = !!cust.install_date || !!cust.mac_address || wos.some(wo => wo.status === 'closed');

            if (isInstalled) {
                installedCustomers.push(cust);
            } else if (isConfirmedOrOpen) {
                queuedCustomers.push(cust);
            } else if (isWaiting) {
                // Hidden, do not display
            } else {
                // Fallback
                installedCustomers.push(cust);
            }
        });

        function renderTable(container, listData, emptyMessage) {
            if (!container) return;
            if (!listData || listData.length === 0) {
                container.innerHTML = `
                    <div class="text-white-50 text-center py-5">
                        <i class="bi bi-people-fill fs-1 d-block mb-3"></i>
                        ${emptyMessage}
                    </div>`;
                return;
            }

            container.innerHTML = `
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
                            ${listData.map(cust => `
                                <tr>
                                    <td>
                                        <div class="fw-bold">
                                            <a href="${APP_BASE_URL}/enduser/dashboard.html?cid=${cust.customer_code || cust.id}&customer=true" class="text-info text-decoration-none" target="_blank">
                                                <i class="bi bi-box-arrow-in-right me-1 small"></i>${cust.name}
                                            </a>
                                        </div>
                                        <div class="small text-white-50 text-uppercase" style="letter-spacing: 1px; font-size: 0.7rem;">${cust.customer_code || 'Belum Ada Kode'}</div>
                                        ${cust.email && !cust.email.includes(APP_CONFIG.AUTH_DOMAIN_SUFFIX) ? `<div class="smaller text-info opacity-75 mt-1" style="font-size: 0.65rem;"><i class="bi bi-envelope me-1"></i>${cust.email}</div>` : ''}
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
                                            <button class="btn btn-outline-success whatsapp-remind" data-id="${cust.id}" title="Kirim WA Reminder"><i class="bi bi-whatsapp"></i></button>
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
        }

        renderTable(listContainer, installedCustomers, 'Tidak ada pelanggan (Terpasang) ditemukan.');
        renderTable(queuedListContainer, queuedCustomers, 'Tidak ada pelanggan (Dalam Antrian) ditemukan.');

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

        document.querySelectorAll('.whatsapp-remind').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showWhatsAppModal(customersData.find(c => String(c.id) === btn.dataset.id));
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
                                    <label class="form-label text-white-50 small fw-bold">Nomor handphone ( digunakan sebagai login )</label>
                                    <input type="text" class="form-control form-control-sm bg-dark text-info fw-bold" id="cust-phone-login" value="${cust?.phone || ''}" readonly>
                                    <input type="hidden" id="cust-code" value="${cust?.customer_code || ''}">
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
                                <input type="text" class="form-control" id="cust-email" value="${cust?.email && !cust?.email.includes(APP_CONFIG.AUTH_DOMAIN_SUFFIX) ? cust.email : ''}" placeholder="Alamat email aktif">
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
                                <input type="text" class="form-control form-control-sm font-monospace mb-2" id="cust-coords"
                                       value="${cust?.lat && cust?.lng ? `${cust.lat}, ${cust.lng}` : ''}"
                                       placeholder="-7.1234, 112.5678  (atau cari alamat di peta)">
                                <div id="edit-location-picker-map" class="rounded border border-secondary" style="height: 220px; background: #1e1e1e; z-index: 1;"></div>
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

        // Interactive Map Selector — powered by MapKit
        const _initCoords = (cust?.lat && cust?.lng) ? [cust.lat, cust.lng] : null;
        const _picker = createLocationPicker('edit-location-picker-map', 'cust-coords', {
            theme: 'dark',
            initCoords: _initCoords,
            onPin: (lat, lng) => {
                // Keep the Google Maps link in sync
                const gLink = document.getElementById('edit-google-maps-link');
                if (gLink) {
                    gLink.href = getGoogleMapsLink(lat, lng);
                    gLink.classList.remove('d-none');
                }
            }
        });

        // Load images from Storage if they are paths
        setTimeout(() => {
            if (cust?.photo_ktp) {
                getStorageUrl(cust.photo_ktp, 'ktp_vault', true).then(url => {
                    const img = document.querySelector('#edit-ktp-preview-container img');
                    if (img) img.src = url;
                });
            }
            if (cust?.photo_rumah) {
                getStorageUrl(cust.photo_rumah, 'house_photos', false).then(url => {
                    const img = document.querySelector('#edit-house-preview-container img');
                    if (img) img.src = url;
                });
            }
        }, 600);

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

        // Media handlers (Storage)
        let newPhotoKTPFile = null;
        let newPhotoHouseFile = null;
        let currentPhotoKTP = cust?.photo_ktp || null;
        let currentPhotoHouse = cust?.photo_rumah || null;

        const setupFileHandler = (id, previewId, containerId, setter) => {
            const input = document.getElementById(id);
            if (!input) return;
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    setter(file);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const cont = document.getElementById(containerId);
                        cont.classList.remove('d-none');
                        cont.querySelector('img').src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };
        };

        setupFileHandler('cust-ktp-file', 'edit-ktp-preview', 'edit-ktp-preview-container', (v) => newPhotoKTPFile = v);
        setupFileHandler('cust-house-file', 'edit-house-preview', 'edit-house-preview-container', (v) => newPhotoHouseFile = v);

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
                ...((() => { const _c = parseCoordsField(document.getElementById('cust-coords')?.value); return { lat: _c?.lat ?? null, lng: _c?.lng ?? null }; })()),
                photo_ktp: currentPhotoKTP,
                photo_rumah: currentPhotoHouse,
                email: document.getElementById('cust-email').value.trim() || (cust?.email && !cust?.email.includes(APP_CONFIG.AUTH_DOMAIN_SUFFIX) ? cust.email : null)
            };

            if (!formData.name || !formData.address) return showToast('warning', 'Nama dan Alamat wajib diisi.');

            saveBtn.disabled = true;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

            try {
                // 1. Upload new photos if present
                const fileName = `${formData.phone}_${Date.now()}`;

                if (newPhotoKTPFile) {
                    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Upload KTP...';
                    const compressed = await compressImage(newPhotoKTPFile, { maxWidth: 1000, quality: 0.7 });
                    const { data, error } = await supabaseA.storage.from('ktp_vault').upload(`updates/${fileName}_ktp.jpg`, compressed);
                    if (error) throw error;
                    formData.photo_ktp = data.path;
                }

                if (newPhotoHouseFile) {
                    if (!supabaseB) throw new Error('Konfigurasi Storage Project B tidak tersedia.');
                    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Upload Rumah...';
                    const compressed = await compressImage(newPhotoHouseFile, { maxWidth: 1200, quality: 0.8 });
                    const { data, error } = await supabaseB.storage.from('house_photos').upload(`updates/${fileName}_house.jpg`, compressed);
                    if (error) throw error;
                    
                    const { data: { publicUrl } } = supabaseB.storage.from('house_photos').getPublicUrl(data.path);
                    formData.photo_rumah = publicUrl;
                }

                // 2. Update Password if set
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

    // --------- WhatsApp Reminder Modal ---------
    async function showWhatsAppModal(cust) {
        if (!cust.phone) return showToast('warning', 'Pelanggan tidak memiliki nomor HP (WhatsApp).');

        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const sendBtn = document.getElementById('save-crud-btn');

        modalTitle.innerHTML = `<i class="bi bi-whatsapp text-success me-2"></i>Kirim Pengingat: ${cust.name}`;
        sendBtn.innerText = 'Kirim Sekarang';

        const templates = {
            'due_soon': `📅 *PENGINGAT TAGIHAN*\n\nHalo *${cust.name}*,\n\nKami mengingatkan bahwa tagihan internet Anda akan jatuh tempo segera. Mohon lakukan pembayaran tepat waktu agar layanan tetap lancar.\n\nTerima kasih! 🙏`,
            'overdue': `⚠️ *PERINGATAN JATUH TEMPO*\n\nHalo *${cust.name}*,\n\nLayanan internet Anda telah melewati batas jatuh tempo pembayaran. Mohon segera lakukan pelunasan untuk menghindari pemutusan layanan.\n\nTerima kasih.`,
            'custom': ''
        };

        modalBody.innerHTML = `
            <div class="row g-3">
                <div class="col-12">
                    <label class="form-label small text-white-50 fw-bold">Pilih Template</label>
                    <select id="wa-template-select" class="form-select bg-dark text-white border-secondary">
                        <option value="due_soon">Pengingat Menjelang Jatuh Tempo</option>
                        <option value="overdue">Peringatan Melewati Jatuh Tempo</option>
                        <option value="custom">Pesan Kustom...</option>
                    </select>
                </div>
                <div class="col-12">
                    <label class="form-label small text-white-50 fw-bold">Nomor WhatsApp</label>
                    <input type="text" id="wa-target" class="form-control bg-dark text-info fw-bold" value="${cust.phone}" readonly>
                </div>
                <div class="col-12">
                    <label class="form-label small text-white-50 fw-bold">Isi Pesan</label>
                    <textarea id="wa-message-text" class="form-control bg-dark text-white" rows="6">${templates.due_soon}</textarea>
                    <div class="smaller text-white-50 mt-2">
                        <i class="bi bi-info-circle me-1"></i> Gunakan tanda bintang (*) untuk teks tebal.
                    </div>
                </div>
            </div>
        `;

        const templateSelect = document.getElementById('wa-template-select');
        const messageArea = document.getElementById('wa-message-text');

        templateSelect.onchange = () => {
            messageArea.value = templates[templateSelect.value];
            if (templateSelect.value === 'custom') messageArea.focus();
        };

        sendBtn.onclick = async () => {
            const message = messageArea.value.trim();
            if (!message) return showToast('warning', 'Pesan tidak boleh kosong.');

            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Mengirim...';

            try {
                const res = await apiCall('/notifications/send', {
                    method: 'POST',
                    body: JSON.stringify({
                        target: cust.phone,
                        message: message,
                        customer_id: cust.id
                    })
                });

                if (res.success) {
                    showToast('success', 'Pesan WhatsApp berhasil dikirim!');
                    modal.hide();
                } else {
                    throw new Error(res.error || 'Gagal mengirim pesan');
                }
            } catch (err) {
                console.error("WA Send Error:", err);
                showToast('error', 'Gagal: ' + err.message);
            } finally {
                sendBtn.disabled = false;
                sendBtn.innerText = 'Kirim Sekarang';
            }
        };

        modal.show();
    }

    loadCustomers();
}

function initImportActions(onRefresh) {
    const downloadBtn = document.getElementById('download-customer-template-btn');
    const importBtn = document.getElementById('import-customer-btn');
    const fileInput = document.getElementById('customer-import-input');

    if (downloadBtn) {
        downloadBtn.onclick = (e) => {
            e.preventDefault();
            downloadCustomerTemplate();
        };
    }

    if (importBtn && fileInput) {
        importBtn.onclick = (e) => {
            e.preventDefault();
            fileInput.click();
        };

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (confirm(`Apakah Anda yakin ingin mengimpor data dari "${file.name}"?`)) {
                await handleCustomerImport(file, onRefresh);
            }
            fileInput.value = ''; // Reset
        };
    }
}

function downloadCustomerTemplate() {
    const headers = ['Nama', 'NIK', 'No HP', 'No HP Alt', 'Alamat', 'Paket', 'Email', 'Username PPPoE', 'MAC Address', 'Latitude', 'Longitude'];
    const example = ['John Doe', '1234567890123456', '08123456789', '', 'Jl. Merdeka No. 1', 'HOME-10MB', 'john@example.com', 'john_doe', 'AA:BB:CC:DD:EE:FF', '-6.2000', '106.8166'];

    const csvContent = [
        headers.join(','),
        example.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_pelanggan.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Template berhasil diunduh!');
}

async function handleCustomerImport(file, onRefresh) {
    const reader = new FileReader();

    showToast('info', 'Sedang memproses file...');

    reader.onload = async (event) => {
        const text = event.target.result;

        // Robust CSV Parser
        const parseCSV = (text) => {
            const result = [];
            const lines = text.split(/\r?\n/);
            for (let line of lines) {
                if (!line.trim()) continue;
                const row = [];
                let col = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    let char = line[i];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        row.push(col.trim());
                        col = '';
                    } else {
                        col += char;
                    }
                }
                row.push(col.trim());
                result.push(row);
            }
            return result;
        };

        const rows = parseCSV(text);

        if (rows.length < 2) {
            showToast('error', 'File kosong atau tidak valid.');
            return;
        }

        const headers = rows[0].map(h => h.trim().toLowerCase());
        const dataRows = rows.slice(1).filter(row => row.length > 1 && row[0].trim() !== '');

        let successCount = 0;
        let failCount = 0;
        let errors = [];

        for (const row of dataRows) {
            try {
                // Map based on expected headers
                const rowData = {
                    name: row[0]?.trim(),
                    ktp: row[1]?.trim(),
                    phone: row[2]?.trim(),
                    alt_phone: row[3]?.trim(),
                    address: row[4]?.trim(),
                    packet: row[5]?.trim(),
                    email: row[6]?.trim() || null,
                    username: row[7]?.trim(),
                    mac_address: row[8]?.trim(),
                    lat: parseFloat(row[9]) || null,
                    lng: parseFloat(row[10]) || null
                };

                if (!rowData.name || !rowData.phone || !rowData.address) {
                    failCount++;
                    errors.push(`Baris "${rowData.name || 'N/A'}": Nama, No HP, dan Alamat wajib diisi.`);
                    continue;
                }

                // Call API for creating user/customer
                // We use /api/admin/create-user because it handles both Auth and DB entry
                await apiCall('/admin/create-user', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: rowData.email || `${rowData.phone}${APP_CONFIG.AUTH_DOMAIN_SUFFIX}`,
                        password: 'User123!', // Default password
                        metadata: {
                            role: 'customer',
                            name: rowData.name
                        },
                        customerData: {
                            name: rowData.name,
                            phone: rowData.phone,
                            address: rowData.address,
                            packet: rowData.packet,
                            ktp: rowData.ktp,
                            alt_phone: rowData.alt_phone,
                            username: rowData.username,
                            mac_address: rowData.mac_address,
                            lat: rowData.lat,
                            lng: rowData.lng,
                            email: rowData.email || `${rowData.phone}${APP_CONFIG.AUTH_DOMAIN_SUFFIX}`
                        }
                    })
                });

                successCount++;
            } catch (err) {
                console.error("Import row error:", err);
                failCount++;
                errors.push(`Gagal mengimpor "${row[0]}": ${err.message}`);
            }
        }

        if (successCount > 0) {
            showToast('success', `${successCount} pelanggan berhasil diimpor!`);
            if (onRefresh) onRefresh();
        }

        if (failCount > 0) {
            showToast('warning', `${failCount} baris gagal diimpor. Periksa konsol untuk detail.`);
            console.warn("Import errors:", errors);
        }
    };

    reader.onerror = () => {
        showToast('error', 'Gagal membaca file.');
    };

    reader.readAsText(file);
}
