import { supabase } from '../../api/supabase.js';
import { APP_BASE_URL } from '../../config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('psb-form-container');
    if (!container) return;

    const showInlineError = (elementId, message) => {
        const el = document.getElementById(elementId);
        if (!el) return;

        const existingInfo = el.parentElement.querySelector('.custom-inline-error');
        if (existingInfo) existingInfo.remove();

        const errNode = document.createElement('div');
        errNode.className = 'custom-inline-error mt-1 fw-bold shadow';
        errNode.style.background = '#da3633';
        errNode.style.color = '#fff';
        errNode.style.padding = '6px 12px';
        errNode.style.borderRadius = '6px';
        errNode.style.fontSize = '0.8rem';
        errNode.style.position = 'absolute';
        errNode.style.zIndex = '1050';
        errNode.style.animation = 'errorFadeIn 0.3s ease';
        errNode.innerHTML = '<i class="bi bi-exclamation-circle-fill me-1"></i> ' + message;

        el.parentElement.style.position = 'relative';

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.classList.add('is-invalid');
            el.parentElement.insertBefore(errNode, el.nextSibling);

            const clearValidity = () => {
                el.classList.remove('is-invalid');
                if (errNode.parentNode) errNode.remove();
            };
            el.addEventListener('input', clearValidity, { once: true });
            el.addEventListener('change', clearValidity, { once: true });
            el.focus();
        } else {
            errNode.style.left = '50%';
            errNode.style.bottom = '10%';
            errNode.style.transform = 'translate(-50%, 0)';
            el.appendChild(errNode);

            const clearValidity = () => { if (errNode.parentNode) errNode.remove(); };
            el.addEventListener('click', clearValidity, { once: true });
            setTimeout(clearValidity, 4000);
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const getRenderHeader = () => `
        <style>
            @keyframes errorFadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .package-card:hover {
                transform: translateY(-5px) !important;
                border-color: #58a6ff !important;
                box-shadow: 0 8px 24px rgba(88, 166, 255, 0.2) !important;
            }
            .package-card:hover .package-body {
                background-color: rgba(88, 166, 255, 0.05);
            }
        </style>
        <div class="row mb-4">
            <div class="col-12 text-center">
                <h3 class="text-white mb-2"><i class="bi bi-person-plus text-primary me-2"></i>Registrasi Pelanggan</h3>
                <p class="text-white-50">Lengkapi form di bawah untuk mendaftar layanan Pemasangan Baru.</p>
            </div>
        </div>

        <!-- STEPPER INDICATORS -->
        <div class="d-flex mb-4 justify-content-center flex-wrap gap-2 gap-md-4">
            <div class="step-indicator active d-flex align-items-center" id="ind-step-1">
                <div class="step-num bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">1</div>
                <span class="small fw-bold text-white">Pilih Paket</span>
            </div>
            <div class="step-indicator opacity-50 d-flex align-items-center" id="ind-step-2">
                <div class="step-num bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">2</div>
                <span class="small fw-bold text-white">Lokasi</span>
            </div>
            <div class="step-indicator opacity-50 d-flex align-items-center" id="ind-step-3">
                <div class="step-num bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">3</div>
                <span class="small fw-bold text-white">Biodata</span>
            </div>
        </div>

        <!-- LOADING OVERLAY -->
        <div id="step-loading" class="d-none text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
            <p class="text-white-50 mt-3">Sedang memproses...</p>
        </div>
    `;

    const getRenderStep1 = () => `
            <!-- ====== STEP 1: PILIH PAKET ====== -->
            <div id="step-1" class="step-section">

                        <div class="row g-3" id="package-cards-container">
                            <div class="col-12 text-center text-white-50 py-4"><div class="spinner-border spinner-border-sm me-2"></div> Memuat opsi paket...</div>
                        </div>
                        <input type="hidden" id="selected-package-name" required>
                        <input type="hidden" id="selected-package-price">
                        <input type="hidden" id="selected-package-speed">

                <div class="text-end">
                    <button type="button" class="btn btn-primary px-4 py-2 fw-bold transition-transform" id="btn-next-2">
                        Selanjutnya <i class="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>
    `;

    const getRenderStep2 = () => `
            <!-- ====== STEP 2: LOKASI PEMASANGAN ====== -->
            <div id="step-2" class="step-section d-none">
                <div class="card bg-vscode border-secondary mb-4 shadow-sm">
                    <div class="card-header border-secondary bg-dark bg-opacity-50 pt-3 pb-2">
                        <h5 class="mb-0 text-white"><span class="badge bg-primary rounded-circle me-2 px-2 py-1">2</span> Instalasi / Lokasi Pemasangan</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-4 d-flex align-items-stretch">
                            <div class="col-md-7">
                                <label class="form-label text-white-50 small mb-2">Pilih Titik Lokasi di Peta</label>
                                <div class="position-relative">
                                    <div id="location-picker-map" class="rounded border border-secondary shadow-sm" style="height: 350px; background: #1e1e1e; z-index: 1;"></div>
                                    <button type="button" id="btn-get-location" class="btn btn-sm btn-dark border-secondary position-absolute" style="top: 10px; right: 10px; z-index: 1000;">
                                        <i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya
                                    </button>
                                </div>
                                <p class="text-white-50 mt-2 mb-0" style="font-size: 0.75rem;"><i class="bi bi-info-circle me-1"></i> Klik pada peta untuk menentukan koordinat pasti lokasi pemasangan.</p>
                                
                                <!-- HIDDEN LAT LONG -->
                                <div class="d-none">
                                    <input type="number" step="any" id="adv-cust-lat" required>
                                    <input type="number" step="any" id="adv-cust-lng" required>
                                </div>
                            </div>
                            <div class="col-md-5 d-flex flex-column bg-dark bg-opacity-25 p-3 rounded border border-secondary">
                                <div class="mb-3 flex-grow-1">
                                    <label class="form-label text-white fw-medium small mb-2">Detail Alamat Pemasangan</label>
                                    <textarea class="form-control bg-dark text-white border-secondary h-100" id="adv-cust-address" style="min-height: 120px;" placeholder="Tuliskan alamat lengkap... (Nama Jalan, Blok, No Rumah, RT/RW, Patokan)" required></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-outline-secondary px-4 py-2" id="btn-back-1">
                        <i class="bi bi-arrow-left me-2"></i> Kembali
                    </button>
                    <button type="button" class="btn btn-primary px-4 py-2 fw-bold transition-transform" id="btn-next-3">
                        Selanjutnya <i class="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>
    `;

    const getRenderStep3 = () => `
            <!-- ====== STEP 3: BIODATA DIRI ====== -->
            <div id="step-3" class="step-section d-none">
                <div class="card bg-vscode border-secondary mb-4 shadow-sm">
                    <div class="card-header border-secondary bg-dark bg-opacity-50 pt-3 pb-2">
                        <h5 class="mb-0 text-white"><span class="badge bg-primary rounded-circle me-2 px-2 py-1">3</span> Biodata Diri</h5>
                    </div>
                    <div class="card-body">
                        <!-- Selected Package Summary Card -->
                        <div class="card bg-gradient border-primary mb-4 shadow" id="summary-package-card" style="display:none; background: linear-gradient(145deg, rgba(13,110,253,0.1) 0%, rgba(0,0,0,0) 100%);">
                            <div class="card-body py-3 px-4">
                                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <div>
                                        <span class="text-white-50 small d-block mb-1">Paket yang dipilih:</span>
                                        <h5 class="text-white mb-0 d-inline-block" id="summary-pkg-name">-</h5>
                                        <span class="badge bg-info text-dark ms-2 align-bottom" id="summary-pkg-speed">-</span>
                                    </div>
                                    <div class="text-end">
                                        <span class="text-white-50 small d-block mb-1">Estimasi Biaya</span>
                                        <h4 class="text-success mb-0" id="summary-pkg-price">-</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">Nama Lengkap</label>
                                <input type="text" class="form-control bg-dark text-white border-secondary" id="adv-cust-name" placeholder="Sesuai KTP" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">Email</label>
                                <input type="email" class="form-control bg-dark text-white border-secondary" id="adv-cust-email" placeholder="email@contoh.com">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">No. Handphone / WhatsApp</label>
                                <input type="text" class="form-control bg-dark text-white border-secondary" id="adv-cust-phone" placeholder="08xxxxxxxxxx" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">No. HP Alternatif</label>
                                <input type="text" class="form-control bg-dark text-white border-secondary" id="adv-cust-alt-phone" placeholder="Keluarga / Kerabat (Opsional)">
                            </div>
                            <div class="col-12 mt-4">
                                <h6 class="text-white mb-3 border-bottom border-secondary pb-2">Dokumen Pendukung</h6>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">Upload Foto Rumah <span class="text-danger">*</span></label>
                                <div class="photo-drop-zone" id="drop-zone-rumah" onclick="document.getElementById('adv-cust-foto-rumah').click()">
                                    <i class="bi bi-house-door fs-2 text-white-50 mb-2 d-block"></i>
                                    <span class="small text-white-50">Klik untuk upload foto rumah</span>
                                    <input type="file" id="adv-cust-foto-rumah" class="d-none" accept="image/*">
                                </div>
                                <div id="preview-rumah" class="mt-2 text-center" style="display:none;">
                                    <img src="" class="img-thumbnail bg-dark border-secondary mb-2" style="max-height: 200px; width: 100%; object-fit: cover; border-radius: 8px;">
                                    <button type="button" class="btn btn-sm btn-outline-danger w-100" id="btn-remove-rumah"><i class="bi bi-trash"></i> Hapus Foto Rumah</button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">Upload Foto KTP <span class="text-danger">*</span></label>
                                <div class="photo-drop-zone" id="drop-zone-ktp" onclick="document.getElementById('adv-cust-foto-ktp').click()">
                                    <i class="bi bi-person-vcard fs-2 text-white-50 mb-2 d-block"></i>
                                    <span class="small text-white-50">Klik untuk upload foto KTP</span>
                                    <input type="file" id="adv-cust-foto-ktp" class="d-none" accept="image/*">
                                </div>
                                <div id="preview-ktp" class="mt-2 text-center" style="display:none;">
                                    <img src="" class="img-thumbnail bg-dark border-secondary mb-2" style="max-height: 200px; width: 100%; object-fit: cover; border-radius: 8px;">
                                    <button type="button" class="btn btn-sm btn-outline-danger w-100" id="btn-remove-ktp"><i class="bi bi-trash"></i> Hapus Foto KTP</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-between flex-wrap gap-3 mt-4">
                    <button type="button" class="btn btn-outline-secondary px-4 py-2" id="btn-back-2">
                        <i class="bi bi-arrow-left me-2"></i> Kembali
                    </button>
                    <button type="button" class="btn btn-success btn-lg px-5 py-2 fw-bold shadow-sm transition-transform" id="save-adv-customer-btn">
                        <i class="bi bi-check-circle-fill me-2"></i> Selesaikan Registrasi
                    </button>
                </div>
            </div>
    `;

    container.innerHTML = getRenderHeader() +
        '<form id="add-psb-registration-form">' +
        getRenderStep1() +
        getRenderStep2() +
        getRenderStep3() +
        '</form>';

    // Setup photo upload previews
    const setupPhotoUpload = (inputId, dropZoneId, previewContainerId, removeBtnId) => {
        const input = document.getElementById(inputId);
        const dropZone = document.getElementById(dropZoneId);
        const previewContainer = document.getElementById(previewContainerId);
        const previewImg = previewContainer.querySelector('img');
        const removeBtn = document.getElementById(removeBtnId);

        if (!input) return;

        input.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImg.src = e.target.result;
                    dropZone.style.display = 'none';
                    previewContainer.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });

        removeBtn.addEventListener('click', function () {
            input.value = '';
            dropZone.style.display = 'block';
            previewContainer.style.display = 'none';
            previewImg.src = '';
        });
    };

    setupPhotoUpload('adv-cust-foto-rumah', 'drop-zone-rumah', 'preview-rumah', 'btn-remove-rumah');
    setupPhotoUpload('adv-cust-foto-ktp', 'drop-zone-ktp', 'preview-ktp', 'btn-remove-ktp');

    // Initialize Map Variables
    let pickMap;
    let marker;
    const defaultPos = [-7.150970, 112.721245];

    // Functions for Step Transitions
    const steps = [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3')
    ];
    const inds = [
        document.getElementById('ind-step-1'),
        document.getElementById('ind-step-2'),
        document.getElementById('ind-step-3')
    ];
    const loader = document.getElementById('step-loading');

    function showLoader(duration = 500) {
        return new Promise(resolve => {
            steps.forEach(s => s.classList.add('d-none'));
            loader.classList.remove('d-none');
            setTimeout(() => {
                loader.classList.add('d-none');
                resolve();
            }, duration);
        });
    }

    function updateIndicators(targetIndex) {
        inds.forEach((ind, i) => {
            const num = ind.querySelector('.step-num');
            if (i === targetIndex) {
                ind.classList.remove('opacity-50');
                num.classList.replace('bg-secondary', 'bg-primary');
                if (num.classList.contains('bg-success')) num.classList.replace('bg-success', 'bg-primary');
                num.innerHTML = i + 1;
            } else if (i < targetIndex) {
                // Completed
                ind.classList.remove('opacity-50');
                if (num.classList.contains('bg-secondary')) num.classList.replace('bg-secondary', 'bg-success');
                if (num.classList.contains('bg-primary')) num.classList.replace('bg-primary', 'bg-success');
                num.innerHTML = '<i class="bi bi-check"></i>';
            } else {
                // Future
                ind.classList.add('opacity-50');
                if (num.classList.contains('bg-primary')) num.classList.replace('bg-primary', 'bg-secondary');
                if (num.classList.contains('bg-success')) num.classList.replace('bg-success', 'bg-secondary');
                num.innerHTML = i + 1;
            }
        });
    }

    async function goToStep(stepIndex) {
        await showLoader();
        steps[stepIndex].classList.remove('d-none');
        updateIndicators(stepIndex);

        // Special actions on step enter
        if (stepIndex === 1) {
            // Re-render map inside the now-visible container
            const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
            const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            });
            const Stadia_AlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
                minZoom: 0,
                maxZoom: 20,
                attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                ext: 'jpg'
            });
            const baseLayers = {
                'OpenStreetMap': osm,
                'Dark Mode': dark,
                'Terrains': Stadia_AlidadeSatellite
            };
            if (!pickMap) {
                pickMap = L.map('location-picker-map').addLayer(osm).setView(defaultPos, 13);
                L.control.layers(baseLayers).addTo(pickMap);

                pickMap.on('click', (e) => setPin(e.latlng.lat, e.latlng.lng));
            }
            setTimeout(() => pickMap.invalidateSize(), 200);
        } else if (stepIndex === 2) {
            // Ensure summary is shown and animated
            const summaryCard = document.getElementById('summary-package-card');
            summaryCard.style.display = 'block';
            summaryCard.animate([
                { opacity: 0, transform: 'translateY(-10px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 300, fill: 'forwards' });
        }
    }

    // Event Listeners for Next/Back Buttons
    function handleTransition(btnId, targetStep, validatingFn) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = async () => {
                if (validatingFn && !validatingFn()) return;
                await goToStep(targetStep);
            };
        }
    }

    handleTransition('btn-next-2', 1, () => {
        const pkgName = document.getElementById('selected-package-name').value;
        if (!pkgName) {
            showInlineError('package-cards-container', 'Silakan pilih paket internet terlebih dahulu.');
            return false;
        }
        return true;
    });

    handleTransition('btn-next-3', 2, () => {
        const lat = document.getElementById('adv-cust-lat').value;
        const lng = document.getElementById('adv-cust-lng').value;
        const addr = document.getElementById('adv-cust-address').value.trim();

        let isValid = true;

        if (!lat || !lng) {
            showInlineError('location-picker-map', 'Silakan pilih titik lokasi pemasangan di peta.');
            isValid = false;
        }
        if (!addr) {
            showInlineError('adv-cust-address', 'Silakan isi detail alamat pemasangan.');
            isValid = false;
        }

        return isValid;
    });

    handleTransition('btn-back-1', 0);
    handleTransition('btn-back-2', 1);

    // Default Install Date
    const installDateEl = document.getElementById('adv-cust-install-date');
    if (installDateEl) {
        installDateEl.value = new Date().toISOString().split('T')[0];
    }

    // Load initial packages
    await loadPackages();

    function setPin(lat, lng) {
        document.getElementById('adv-cust-lat').value = lat.toFixed(7);
        document.getElementById('adv-cust-lng').value = lng.toFixed(7);

        if (marker) marker.remove();
        marker = L.marker([lat, lng]).addTo(pickMap);
        pickMap.setView([lat, lng], 16);
    }

    // GPS Button Logic
    const btnGetLocation = document.getElementById('btn-get-location');
    if (btnGetLocation) {
        btnGetLocation.onclick = () => {
            if (!navigator.geolocation) return alert('Browser Anda tidak mendukung geolokasi.');
            btnGetLocation.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Mencari...';
            btnGetLocation.disabled = true;

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPin(pos.coords.latitude, pos.coords.longitude);
                    btnGetLocation.innerHTML = '<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya';
                    btnGetLocation.disabled = false;
                },
                (err) => {
                    alert('Gagal mendapatkan lokasi: ' + err.message);
                    btnGetLocation.innerHTML = '<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya';
                    btnGetLocation.disabled = false;
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        };
    }

    // FINAL SUBMIT (Save Registration)
    const saveBtn = document.getElementById('save-adv-customer-btn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const name = document.getElementById('adv-cust-name').value.trim();
            const phone = document.getElementById('adv-cust-phone').value.trim();
            const fotoRumah = document.getElementById('adv-cust-foto-rumah').files[0];
            const fotoKtp = document.getElementById('adv-cust-foto-ktp').files[0];

            let isValid = true;

            if (!name) {
                showInlineError('adv-cust-name', 'Nama Lengkap wajib diisi.');
                isValid = false;
            }
            if (!phone) {
                showInlineError('adv-cust-phone', 'No. Handphone wajib diisi.');
                isValid = false;
            }
            if (!fotoRumah) {
                showInlineError('drop-zone-rumah', 'Foto Rumah wajib diunggah.');
                isValid = false;
            }
            if (!fotoKtp) {
                showInlineError('drop-zone-ktp', 'Foto KTP wajib diunggah.');
                isValid = false;
            }

            if (!isValid) return;

            const pkgName = document.getElementById('selected-package-name').value;
            const address = document.getElementById('adv-cust-address').value.trim();
            const lat = document.getElementById('adv-cust-lat').value;
            const lng = document.getElementById('adv-cust-lng').value;
            const installDate = null;
            const email = document.getElementById('adv-cust-email').value.trim();
            const altPhone = document.getElementById('adv-cust-alt-phone').value.trim();

            let finalAddress = address;
            if (email || altPhone) {
                finalAddress += '\n(Email: ' + (email || '-') + ' | HP Alt: ' + (altPhone || '-') + ')';
            }

            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan Data...';
            saveBtn.disabled = true;

            try {
                // 1. Set default role to 'Customer'
                const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'Customer').single();
                const role_id = roleData ? roleData.id : null;

                // 2. Insert into customers
                const { data: newCust, error: custErr } = await supabase.from('customers').insert([{
                    name: name,
                    address: finalAddress,
                    phone: phone,
                    packet: pkgName,
                    install_date: installDate || null,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    role_id: role_id
                }]).select().single();

                if (custErr) throw custErr;

                // 3. Insert into work_orders (Antrian PSB)
                if (newCust && newCust.id) {
                    const { error: woErr } = await supabase.from('work_orders').insert([{
                        customer_id: newCust.id,
                        status: 'Antrian',
                        title: 'Pemasangan Baru (PSB)',
                        registration_date: installDate || new Date().toISOString(),
                        referral_name: '',
                        ket: 'Paket: ' + pkgName,
                        created_at: new Date().toISOString()
                    }]);
                    if (woErr) console.warn("Notice: Gagal membuat antrian PSB otomatis:", woErr.message);
                }

                alert('Registrasi Pelanggan berhasil diselesaikan! Data masuk ke Antrian.');
                window.location.href = APP_BASE_URL + '/?success=true';

            } catch (err) {
                alert('Gagal memproses pendaftaran: ' + err.message);
                saveBtn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Selesaikan Registrasi';
                saveBtn.disabled = false;
            }
        };
    }
});

async function loadPackages() {
    const container = document.getElementById('package-cards-container');
    const { data, error } = await supabase.from('internet_packages').select('*').order('price', { ascending: true });

    if (error || !data || data.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-white-50 my-4">Belum ada paket tersedia di database.</div>';
        return;
    }

    container.innerHTML = data.map(pkg => `
        <div class="col-md-4 col-sm-6 mb-3">
            <div class="card bg-dark border border-secondary package-card h-100 shadow-sm transition-all" 
                 style="cursor: pointer; transition: all 0.2s;" 
                 onclick="window.selectPackage('${pkg.name}', '${pkg.speed || ''}', '${pkg.price}', this)">
                <div class="card-body package-body text-center d-flex flex-column p-4" style="transition: all 0.2s;">
                    <div class="mb-3">
                        <i class="bi bi-wifi fs-1 text-primary opacity-75"></i>
                    </div>
                    <h4 class="card-title text-white fw-bold mb-1">${pkg.name}</h4>
                    <span class="badge bg-secondary text-white mx-auto mb-3 px-3 py-1 rounded-pill">${pkg.speed || 'Up to...'}</span>
                    <p class="card-text small text-white-50 flex-grow-1">${pkg.description || 'Pilihan tepat untuk kebutuhan internet Anda.'}</p>
                    <hr class="border-secondary mb-3">
                    <h4 class="text-success mb-0 d-flex flex-column">
                        <span class="fs-6 text-white-50 fw-normal">Biaya / bulan</span>
                        <div class="mt-1">Rp ${Number(pkg.price).toLocaleString('id-ID')}</div>
                    </h4>
                </div>
            </div>
        </div>
    `).join('');
}

window.selectPackage = function (name, speed, price, el) {
    // UI Selection
    document.querySelectorAll('.package-card').forEach(c => {
        c.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10');
        c.classList.add('border-secondary');
        c.querySelector('.card-title').classList.remove('text-primary');
        c.querySelector('.card-title').classList.add('text-white');
        c.style.transform = 'scale(1)';
        c.style.boxShadow = 'none';
    });

    el.classList.remove('border-secondary');
    el.classList.add('border-primary', 'bg-primary', 'bg-opacity-10');
    el.querySelector('.card-title').classList.remove('text-white');
    el.querySelector('.card-title').classList.add('text-primary');
    el.style.transform = 'scale(1.02)';
    el.style.boxShadow = '0 0 15px rgba(13,110,253,0.3)';

    // Hidden inputs
    document.getElementById('selected-package-name').value = name;
    document.getElementById('selected-package-speed').value = speed;
    document.getElementById('selected-package-price').value = price;

    // Show summary on Step 3 Update texts early
    document.getElementById('summary-pkg-name').textContent = name;
    document.getElementById('summary-pkg-speed').textContent = speed || 'Promo';
    document.getElementById('summary-pkg-price').textContent = 'Rp ' + Number(price).toLocaleString('id-ID');
};
