import { supabase } from '../../api/supabase.js';
import { generatePassword, generateCustomerCode, adminCreateCustomer } from '../../api/registration-service.js';
import { populatePackagesDropdown, getGoogleMapsLink } from '../utils/ui-common.js';
import { showToast } from '../utils/toast.js';

export async function initAddCustomerView() {
    const container = document.getElementById('add-customer-view-container');
    const backBtn = document.getElementById('back-to-customers-btn');

    if (backBtn) {
        backBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('navigate', { detail: 'customers-content' }));
        };
    }

    container.innerHTML = `
        <div class="row">
            <div class="col-lg-8 mx-auto">
                <form id="add-customer-view-form" class="row g-4">
                    <!-- Section 1: Kredensial & Akun Login -->
                    <div class="col-12">
                        <div class="card bg-vscode border-0 shadow-sm">
                            <div class="card-header bg-vscode-header border-0 py-3">
                                <h6 class="mb-0 text-info fw-bold"><i class="bi bi-shield-lock me-2"></i>Kredensial & Akun Login</h6>
                            </div>
                            <div class="card-body p-4">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="p-3 rounded border border-secondary border-opacity-25" style="background: rgba(0,0,0,0.2);">
                                            <label class="form-label text-white-50 small fw-bold mb-1">ID Login (Customer Code)</label>
                                            <div class="h4 mb-0 text-info fw-bold font-monospace" id="adv-reg-id-display">--------</div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">Password Login</label>
                                        <div class="input-group">
                                            <input type="password" id="adv-reg-password" class="form-control" readonly placeholder="Klik generate...">
                                            <button class="btn btn-outline-secondary border-secondary" type="button" id="adv-toggle-pass">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <button type="button" id="adv-btn-gen-credentials" class="btn btn-info w-100 py-2 shadow-sm">
                                            <i class="bi bi-magic me-2"></i> Buat Kredensial Otomatis
                                        </button>
                                        <p class="text-white-50 smaller mt-2 mb-0"><i class="bi bi-info-circle me-1"></i> ID Login dihasilkan otomatis.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Detail Profil -->
                    <div class="col-12">
                        <div class="card bg-vscode border-0 shadow-sm">
                            <div class="card-header bg-vscode-header border-0 py-3">
                                <h6 class="mb-0 text-info fw-bold"><i class="bi bi-person-vcard me-2"></i>Detail Profil</h6>
                            </div>
                            <div class="card-body p-4">
                                <div class="row g-3">
                                    <div class="col-md-12">
                                        <label class="form-label text-white-50 small fw-bold">Nama Lengkap</label>
                                        <input type="text" class="form-control" id="adv-cust-name" placeholder="Nama sesuai KTP" required>
                                    </div>
                                    <div class="col-md-12">
                                        <label class="form-label text-white-50 small fw-bold">Email Kontak Pelanggan (Opsional)</label>
                                        <input type="text" class="form-control" id="adv-cust-email" placeholder="contoh@gmail.com">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">NIK / KTP</label>
                                        <input type="text" class="form-control" id="adv-cust-ktp" placeholder="16 Digit NIK">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">No. HP Utama</label>
                                        <input type="text" class="form-control" id="adv-cust-phone" placeholder="08xxxxxxxxxx" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">No. HP Alternatif</label>
                                        <input type="text" class="form-control" id="adv-cust-alt-phone" placeholder="No. HP lain / Darurat">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">Paket Layanan</label>
                                        <select class="form-select" id="adv-cust-package">
                                            <option value="">Memuat paket...</option>
                                        </select>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="p-3 rounded border border-secondary border-opacity-10">
                                            <label class="form-label text-white-50 small fw-bold mb-1 d-block"><i class="bi bi-person-bounding-box me-1"></i>Foto KTP</label>
                                            <input type="file" class="form-control form-control-sm mb-2" id="adv-cust-ktp-file" accept="image/*">
                                            <div id="ktp-preview-container" class="d-none">
                                                <img id="ktp-preview" src="" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px;">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="p-3 rounded border border-secondary border-opacity-10">
                                            <label class="form-label text-white-50 small fw-bold mb-1 d-block"><i class="bi bi-house me-1"></i>Foto Rumah / Lokasi</label>
                                            <input type="file" class="form-control form-control-sm mb-2" id="adv-cust-house-file" accept="image/*">
                                            <div id="house-preview-container" class="d-none">
                                                <img id="house-preview" src="" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px;">
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-12">
                                        <label class="form-label text-white-50 small fw-bold">Alamat Pemasangan</label>
                                        <textarea class="form-control" id="adv-cust-address" rows="3" placeholder="Alamat lengkap lokasi pemasangan" required></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 3: Lokasi Pemasangan -->
                    <div class="col-12">
                        <div class="card bg-vscode border-0 shadow-sm">
                            <div class="card-header bg-vscode-header border-0 py-3 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 text-info fw-bold"><i class="bi bi-geo-alt me-2"></i>Lokasi Pemasangan</h6>
                                <a id="adv-google-maps-link" href="#" target="_blank" class="btn btn-outline-success btn-sm d-none">
                                    <i class="bi bi-google me-1"></i> Buka Google Maps
                                </a>
                            </div>
                            <div class="card-body p-4">
                                <div id="location-picker-map" class="rounded border border-secondary mb-3" style="height: 350px; background: #1e1e1e; z-index: 1;"></div>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">Latitude</label>
                                        <input type="number" step="any" class="form-control" id="adv-cust-lat" placeholder="Koordinat Latitude">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">Longitude</label>
                                        <input type="number" step="any" class="form-control" id="adv-cust-lng" placeholder="Koordinat Longitude">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 mt-4 text-center">
                        <button type="button" class="btn btn-primary px-5 py-3 shadow fw-bold rounded-pill" id="save-adv-customer-btn">
                            <i class="bi bi-person-check me-2 fs-5"></i> Daftarkan Pelanggan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Elements
    const idDisplay = document.getElementById('adv-reg-id-display');
    const passInput = document.getElementById('adv-reg-password');
    const btnGen = document.getElementById('adv-btn-gen-credentials');
    const togglePassBtn = document.getElementById('adv-toggle-pass');

    // Photo elements
    const ktpFileInput = document.getElementById('adv-cust-ktp-file');
    const ktpPreview = document.getElementById('ktp-preview');
    const ktpPreviewContainer = document.getElementById('ktp-preview-container');

    const houseFileInput = document.getElementById('adv-cust-house-file');
    const housePreview = document.getElementById('house-preview');
    const housePreviewContainer = document.getElementById('house-preview-container');

    const latInput = document.getElementById('adv-cust-lat');
    const lngInput = document.getElementById('adv-cust-lng');

    let currentCredentials = null;
    let photoKTPBase64 = null;
    let photoHouseBase64 = null;

    // Credentials logic
    if (btnGen) {
        btnGen.onclick = () => {
            const pass = generatePassword();
            const code = generateCustomerCode();
            passInput.value = pass;
            idDisplay.innerText = code;
            idDisplay.classList.add('text-info');
            currentCredentials = { pass, code };
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

    // Photo handlers
    const setupPhotoHandler = (inputEl, previewEl, containerEl, setter) => {
        inputEl.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setter(event.target.result);
                    previewEl.src = event.target.result;
                    containerEl.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        };
    };

    setupPhotoHandler(ktpFileInput, ktpPreview, ktpPreviewContainer, (val) => photoKTPBase64 = val);
    setupPhotoHandler(houseFileInput, housePreview, housePreviewContainer, (val) => photoHouseBase64 = val);

    // Dynamic Packages
    populatePackagesDropdown('adv-cust-package');

    // Initialize Map
    let pickMap;
    let marker;
    const defaultPos = [-7.150970, 112.721245];

    setTimeout(() => {
        if (pickMap) pickMap.remove();
        pickMap = L.map('location-picker-map').setView(defaultPos, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickMap);

        const updateMarker = (lat, lng) => {
            if (marker) marker.setLatLng([lat, lng]);
            else marker = L.marker([lat, lng]).addTo(pickMap);
            pickMap.panTo([lat, lng]);

            // Update Google Maps Link
            const gMapsLink = document.getElementById('adv-google-maps-link');
            if (gMapsLink) {
                const url = getGoogleMapsLink(lat, lng);
                gMapsLink.href = url;
                gMapsLink.classList.remove('d-none');
            }
        };

        pickMap.on('click', (e) => {
            const { lat, lng } = e.latlng;
            latInput.value = lat.toFixed(7);
            lngInput.value = lng.toFixed(7);
            updateMarker(lat, lng);
        });

        [latInput, lngInput].forEach(el => {
            el.oninput = () => {
                const lat = parseFloat(latInput.value);
                const lng = parseFloat(lngInput.value);
                if (!isNaN(lat) && !isNaN(lng)) updateMarker(lat, lng);
            };
        });
    }, 500);

    // Save Logic
    document.getElementById('save-adv-customer-btn').onclick = async () => {
        if (!currentCredentials) return showToast('warning', 'Silakan klik "Buat Kredensial Otomatis" terlebih dahulu.');

        const profileData = {
            name: document.getElementById('adv-cust-name').value.trim(),
            ktp: document.getElementById('adv-cust-ktp').value.trim(),
            phone: document.getElementById('adv-cust-phone').value.trim(),
            alt_phone: document.getElementById('adv-cust-alt-phone').value.trim(),
            packet: document.getElementById('adv-cust-package').value,
            address: document.getElementById('adv-cust-address').value.trim(),
            lat: parseFloat(latInput.value) || null,
            lng: parseFloat(lngInput.value) || null,
            photo_ktp: photoKTPBase64,
            photo_rumah: photoHouseBase64,
            customer_code: currentCredentials.code
        };

        if (!profileData.name || !profileData.phone || !profileData.address) {
            return showToast('warning', 'Nama, No. HP, dan Alamat wajib diisi.');
        }

        const btnSave = document.getElementById('save-adv-customer-btn');
        const originalText = btnSave.innerHTML;
        btnSave.disabled = true;
        btnSave.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mendaftarkan...';

        try {
            const contactEmail = document.getElementById('adv-cust-email').value.trim();

            // 1. Create User via Admin API (Auth + Base Table Insert)
            // Use customer_code as the login ID
            const regResult = await adminCreateCustomer(currentCredentials.code, currentCredentials.pass, currentCredentials.code, contactEmail);
            const userId = regResult.user.id;

            // 2. Update the profile with remaining data
            const { error: updateError } = await supabase
                .from('customers')
                .update(profileData)
                .eq('id', userId);

            if (updateError) throw updateError;

            showToast('success', `Sukses! Pelanggan "${profileData.name}" berhasil didaftarkan.\n\nID LOGIN: ${currentCredentials.code}\nPASSWORD: ${currentCredentials.pass}`);

            document.dispatchEvent(new CustomEvent('navigate', { detail: 'customers-content' }));
        } catch (err) {
            console.error("Save customer error:", err);
            showToast('error', "Terjadi kesalahan: " + err.message);
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = originalText;
        }
    };
}
