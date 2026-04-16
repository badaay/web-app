import { apiCall, supabase, supabaseA, supabaseB } from '../../../api/supabase.js';
import { compressImage } from '../../utils/image-utils.js';
import { APP_BASE_URL } from '../../../config.js';
import { showToast } from '../../utils/toast.js';
import { createLocationPicker, parseCoordsField } from '../../utils/map-kit.js';

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
        errNode.style.background = 'var(--vscode-danger)';
        errNode.style.color = 'var(--vscode-text-bright)';
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
            .pkg-card-premium {
                background: #ffffff;
                border: 1px solid #e2e8f0; 
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 1.25rem;
                overflow: hidden;
                position: relative;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
            }
            .pkg-card-premium::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; height: 3px;
                background: linear-gradient(90deg, #0047AB, #2DD4BF);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .pkg-card-premium:hover {
                transform: translateY(-6px);
                border-color: #cbd5e1;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04);
            }
            .pkg-card-premium:hover::before {
                opacity: 1;
            }
            .pkg-card-premium.selected {
                border-color: #0047AB;
                background: #f8fafc;
                box-shadow: 0 0 0 2px #0047AB inset, 0 20px 25px -5px rgba(0,71,171,0.1);
                transform: scale(1.02);
            }
            .pkg-card-premium.selected::before {
                opacity: 1;
                height: 4px;
            }
            .pkg-icon-wrapper {
                width: 64px;
                height: 64px;
                border-radius: 1rem;
                background: #f1f5f9;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem auto;
                border: 1px solid #e2e8f0;
                color: #0047AB;
                transition: all 0.3s ease;
            }
            .pkg-card-premium.selected .pkg-icon-wrapper {
                background: linear-gradient(135deg, #0047AB, #2DD4BF);
                color: white;
                border: none;
                box-shadow: 0 10px 20px rgba(0, 71, 171, 0.2);
            }
            .pkg-speed-badge {
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                padding: 0.35rem 1rem;
                border-radius: 2rem;
                font-size: 0.85rem;
                font-weight: 600;
                color: #475569;
                letter-spacing: 0.5px;
                transition: all 0.3s ease;
            }
            .pkg-card-premium.selected .pkg-speed-badge {
                background: rgba(45, 212, 191, 0.1);
                border-color: rgba(45, 212, 191, 0.3);
                color: #0047AB;
            }
        </style>
        <div class="row mb-4">
            <div class="col-12 text-center">
                <h3 class="text-slate-900 fw-bold mb-2" style="color: #0f172a;"><i class="bi bi-person-plus text-primary me-2"></i>Registrasi Pelanggan</h3>
                <p class="text-slate-500" style="color: #64748b;">Lengkapi form di bawah untuk mendaftar layanan Pemasangan Baru.</p>
            </div>
        </div>

        <!-- STEPPER INDICATORS -->
        <div class="d-flex mb-4 justify-content-center flex-wrap gap-2 gap-md-4">
            <div class="step-indicator active d-flex align-items-center" id="ind-step-1">
                <div class="step-num bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(13, 110, 253, 0.2);">1</div>
                <span class="small fw-bold text-dark">Pilih Paket</span>
            </div>
            <div class="step-indicator opacity-50 d-flex align-items-center" id="ind-step-2">
                <div class="step-num bg-light border text-secondary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">2</div>
                <span class="small fw-bold text-secondary">Lokasi</span>
            </div>
            <div class="step-indicator opacity-50 d-flex align-items-center" id="ind-step-3">
                <div class="step-num bg-light border text-secondary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">3</div>
                <span class="small fw-bold text-secondary">Biodata</span>
            </div>
        </div>

        <!-- LOADING OVERLAY -->
        <div id="step-loading" class="d-none text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
            <p class="text-secondary mt-3">Sedang memproses...</p>
        </div>
    `;

    const getRenderStep1 = () => `
            <!-- ====== STEP 1: PILIH PAKET ====== -->
            <div id="step-1" class="step-section">

                        <div class="row g-3" id="package-cards-container">
                            <div class="col-12 text-center text-secondary py-4"><div class="spinner-border spinner-border-sm me-2 text-primary"></div> Memuat opsi paket...</div>
                        </div>
                        <input type="hidden" id="selected-package-name" required>
                        <input type="hidden" id="selected-package-price">
                        <input type="hidden" id="selected-package-speed">

                <div class="text-end">
                    <button type="button" class="btn btn-primary px-4 py-2 fw-bold transition-transform shadow-sm" id="btn-next-2">
                        Selanjutnya <i class="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>
    `;

    const getRenderStep2 = () => `
            <!-- ====== STEP 2: LOKASI PEMASANGAN ====== -->
            <div id="step-2" class="step-section d-none">
                <div class="card bg-vscode border-0 mb-4 shadow-sm" style="border-radius: 1.25rem;">
                    <div class="card-header border-bottom bg-white pt-3 pb-2" style="border-top-left-radius: 1.25rem; border-top-right-radius: 1.25rem;">
                        <h5 class="mb-0 text-dark fw-bold"><span class="badge bg-primary rounded-circle me-2 px-2 py-1">2</span> Instalasi / Lokasi Pemasangan</h5>
                    </div>
                    <div class="card-body bg-white rounded-bottom" style="border-bottom-left-radius: 1.25rem; border-bottom-right-radius: 1.25rem;">
                        <div class="row g-4 d-flex align-items-stretch">
                            <div class="col-md-7">
                                <label class="form-label text-secondary small mb-2 fw-medium">Cari atau Pilih Titik Lokasi di Peta</label>
                                <input type="text" class="form-control bg-white text-dark border mb-2 font-monospace" id="adv-cust-coords"
                                       placeholder="-7.1234, 112.5678  (klik peta atau cari alamat di atas)">
                                <div id="location-picker-map" class="rounded border shadow-sm" style="height: 350px; background: #f8fafc; z-index: 1;"></div>
                                <p class="text-secondary mt-2 mb-0" style="font-size: 0.75rem;"><i class="bi bi-info-circle me-1"></i> Klik pada peta untuk menentukan koordinat, atau gunakan tombol Lokasi Saya di peta.</p>
                            </div>
                            <div class="col-md-5 d-flex flex-column bg-light p-3 rounded border">
                                <div class="mb-3 flex-grow-1">
                                    <label class="form-label text-dark fw-medium small mb-2">Detail Alamat Pemasangan</label>
                                    <textarea class="form-control bg-white text-dark border h-100" id="adv-cust-address" style="min-height: 120px;" placeholder="Tuliskan alamat lengkap... (Nama Jalan, Blok, No Rumah, RT/RW, Patokan)" required></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-outline-secondary px-4 py-2" id="btn-back-1">
                        <i class="bi bi-arrow-left me-2"></i> Kembali
                    </button>
                    <button type="button" class="btn btn-primary px-4 py-2 fw-bold transition-transform shadow-sm" id="btn-next-3">
                        Selanjutnya <i class="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>
    `;

    const getRenderStep3 = () => `
            <!-- ====== STEP 3: BIODATA DIRI ====== -->
            <div id="step-3" class="step-section d-none">
                <div class="card bg-vscode border-0 mb-4 shadow-sm" style="border-radius: 1.25rem;">
                    <div class="card-header border-bottom bg-white pt-3 pb-2" style="border-top-left-radius: 1.25rem; border-top-right-radius: 1.25rem;">
                        <h5 class="mb-0 text-dark fw-bold"><span class="badge bg-primary rounded-circle me-2 px-2 py-1">3</span> Biodata Diri</h5>
                    </div>
                    <div class="card-body bg-white rounded-bottom">
                        <!-- Selected Package Summary Card -->
                        <div class="card bg-light border-primary border-opacity-50 mb-4 shadow-sm" id="summary-package-card" style="display:none; border-radius: 1rem;">
                            <div class="card-body py-3 px-4">
                                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <div>
                                        <span class="text-secondary small d-block mb-1 fw-medium">Paket yang dipilih:</span>
                                        <h5 class="text-dark fw-bold mb-0 d-inline-block" id="summary-pkg-name">-</h5>
                                        <span class="badge bg-primary text-white ms-2 align-bottom" id="summary-pkg-speed">-</span>
                                    </div>
                                    <div class="text-end">
                                        <span class="text-secondary small d-block mb-1 fw-medium">Estimasi Biaya</span>
                                        <h4 class="text-primary fw-bold mb-0" id="summary-pkg-price">-</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-medium">Nama Lengkap</label>
                                <input type="text" class="form-control bg-white text-dark border" id="adv-cust-name" placeholder="Sesuai KTP" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-medium">Email</label>
                                <input type="email" class="form-control bg-white text-dark border" id="adv-cust-email" placeholder="email@contoh.com">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-medium">No. Handphone / WhatsApp</label>
                                <input type="text" class="form-control bg-white text-dark border" id="adv-cust-phone" placeholder="08xxxxxxxxxx" required>
                                <div id="phone-duplicate-msg" class="small mt-1 d-none"></div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-medium">No. HP Alternatif</label>
                                <input type="text" class="form-control bg-white text-dark border" id="adv-cust-alt-phone" placeholder="Keluarga / Kerabat (Opsional)">
                            </div>
                            <div class="col-12 mt-4">
                                <h6 class="text-dark fw-bold mb-3 border-bottom pb-2">Dokumen Pendukung</h6>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-medium">Upload Foto Rumah <span class="text-danger">*</span></label>
                                <div class="photo-drop-zone bg-light border border-light-subtle rounded-3" id="drop-zone-rumah" onclick="document.getElementById('adv-cust-foto-rumah').click()">
                                    <i class="bi bi-house-door fs-2 text-primary opacity-75 mb-2 d-block"></i>
                                    <span class="small text-secondary fw-medium">Klik untuk upload foto rumah</span>
                                    <input type="file" id="adv-cust-foto-rumah" class="d-none" accept="image/*">
                                </div>
                                <div id="preview-rumah" class="mt-2 text-center" style="display:none;">
                                    <img src="" class="img-thumbnail bg-white border mb-2" style="max-height: 200px; width: 100%; object-fit: cover; border-radius: 8px;">
                                    <button type="button" class="btn btn-sm btn-outline-danger w-100" id="btn-remove-rumah"><i class="bi bi-trash"></i> Hapus Foto Rumah</button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-secondary small fw-medium">Upload Foto KTP <span class="text-danger">*</span></label>
                                <div class="photo-drop-zone bg-light border border-light-subtle rounded-3" id="drop-zone-ktp" onclick="document.getElementById('adv-cust-foto-ktp').click()">
                                    <i class="bi bi-person-vcard fs-2 text-primary opacity-75 mb-2 d-block"></i>
                                    <span class="small text-secondary fw-medium">Klik untuk upload foto KTP</span>
                                    <input type="file" id="adv-cust-foto-ktp" class="d-none" accept="image/*">
                                </div>
                                <div id="preview-ktp" class="mt-2 text-center" style="display:none;">
                                    <img src="" class="img-thumbnail bg-white border mb-2" style="max-height: 200px; width: 100%; object-fit: cover; border-radius: 8px;">
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
                    <button type="button" class="btn btn-primary btn-lg px-5 py-2 fw-bold shadow transition-transform" id="save-adv-customer-btn" style="background: linear-gradient(135deg, #0047AB, #2DD4BF); border: none;">
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

    // Duplicate Phone Check
    const phoneInput = document.getElementById('adv-cust-phone');
    const phoneMsg = document.getElementById('phone-duplicate-msg');
    if (phoneInput) {
        phoneInput.addEventListener('blur', async () => {
            const val = phoneInput.value.trim();
            if (val.length < 10) return;

            phoneMsg.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Mengecek...';
            phoneMsg.classList.remove('d-none', 'text-danger', 'text-success');

            const { data, error } = await supabase.from('customers').select('id').eq('phone', val).maybeSingle();
            if (data) {
                phoneMsg.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> Nomor ini sudah terdaftar sebagai pelanggan.';
                phoneMsg.classList.add('text-danger');
                phoneInput.classList.add('is-invalid');
            } else {
                phoneMsg.innerHTML = '<i class="bi bi-check-circle-fill"></i> Nomor tersedia.';
                phoneMsg.classList.add('text-success');
                phoneInput.classList.remove('is-invalid');
            }
        });
    }

    // Initialize Map Variables (picker instance stored here)
    let _psbPicker = null;

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
            // Init location picker (light theme) using MapKit
            if (!_psbPicker) {
                _psbPicker = createLocationPicker('location-picker-map', 'adv-cust-coords', { theme: 'light' });
            } else {
                setTimeout(() => _psbPicker.instance?.invalidateSize(), 200);
            }
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
        const coords = parseCoordsField(document.getElementById('adv-cust-coords')?.value);
        const addr   = document.getElementById('adv-cust-address').value.trim();

        let isValid = true;

        if (!coords) {
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

    // Handle URL parameters for package pre-selection
    const urlParams = new URLSearchParams(window.location.search);
    const targetPkgSlug = urlParams.get('pkg');

    // Load initial packages
    await loadPackages();

    // Auto-select package if slug is provided
    if (targetPkgSlug) {
        const pkgCards = document.querySelectorAll('.package-card');
        pkgCards.forEach(card => {
            const pkgName = card.querySelector('.card-title').textContent.toLowerCase().replace(/\s+/g, '-');
            if (pkgName === targetPkgSlug || pkgName.includes(targetPkgSlug)) {
                card.click();
            }
        });
    }

    // GPS and setPin are now handled internally by createLocationPicker

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
            const _coordsParsed = parseCoordsField(document.getElementById('adv-cust-coords')?.value);
            const lat = _coordsParsed?.lat ?? null;
            const lng = _coordsParsed?.lng ?? null;
            const installDate = null;
            const email = document.getElementById('adv-cust-email').value.trim();
            const altPhone = document.getElementById('adv-cust-alt-phone').value.trim() ?? '0';

            let finalAddress = address;
            // if (email || altPhone) {
            //     finalAddress += '\n(Email: ' + (email || '-') + ' | HP Alt: ' + (altPhone || '-') + ')';
            // }

            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan Data...';
            saveBtn.disabled = true;

            try {
                const fileName = `${phone}_${Date.now()}`;
                let photoKtpUrl = null;
                let photoRumahUrl = null;

                // Helper to convert Blob to Base64 string
                const blobToBase64 = (blob) => new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });

                // 1. Process KTP (Compress and convert to base64)
                if (fotoKtp) {
                    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Kompresi KTP...';
                    const compressedKtp = await compressImage(fotoKtp, { maxWidth: 1000, quality: 0.7 });
                    photoKtpUrl = await blobToBase64(compressedKtp);
                }

                // 2. Process Rumah (Compress and convert to base64)
                if (fotoRumah) {
                    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Kompresi Foto Rumah...';
                    const compressedHouse = await compressImage(fotoRumah, { maxWidth: 1200, quality: 0.8 });
                    photoRumahUrl = await blobToBase64(compressedHouse);
                }

                const payload = {
                    name,
                    phone,
                    alt_phone: altPhone,
                    address: finalAddress,
                    packet: pkgName,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    photo_ktp: photoKtpUrl,
                    photo_rumah: photoRumahUrl
                };

                const response = await fetch('/api/customers/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const resData = await response.json();

                if (!response.ok) {
                   throw new Error(resData.error || 'Pendaftaran gagal');
                }

                showToast('success', 'Registrasi berhasil! Beralih ke halaman tracking...');
                // Redirect to Tracking portal
                window.location.href = APP_BASE_URL + '/enduser/tracking.html?token=' + resData.data.secret_token;

            } catch (err) {
                showToast('error', 'Gagal memproses pendaftaran: ' + err.message);
                saveBtn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Selesaikan Registrasi';
                saveBtn.disabled = false;
            }
        };
    }
});

async function loadPackages() {
    const container = document.getElementById('package-cards-container');
    let data = [];
    try {
        const result = await apiCall('/packages');
        if (result && result.data) data = result.data;
    } catch (err) {
        console.error("Failed to load packages", err);
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-white-50 my-4">Belum ada paket tersedia di database.</div>';
        return;
    }

    container.innerHTML = data.map(pkg => `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="pkg-card-premium h-100" 
                 style="cursor: pointer;" 
                 onclick="window.selectPackage('${pkg.name}', '${pkg.speed || ''}', '${pkg.price}', this)">
                <div class="card-body text-center d-flex flex-column p-4 p-xl-5">
                    <div class="pkg-icon-wrapper">
                        <i class="bi bi-wifi fs-2"></i>
                    </div>
                    <h4 class="card-title text-dark fw-bolder mb-3" style="letter-spacing: -0.5px; color: #0f172a !important;">${pkg.name}</h4>
                    <div class="mb-4">
                        <span class="pkg-speed-badge">${pkg.speed || 'Up to...'}</span>
                    </div>
                    <p class="small flex-grow-1" style="color: #64748b; line-height: 1.6;">${pkg.description || 'Pilihan tepat untuk kebutuhan internet Anda, stabil dan andal.'}</p>
                    <div class="mt-4 pt-4" style="border-top: 1px solid #e2e8f0;">
                        <span class="d-block" style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Biaya Berlangganan</span>
                        <div class="fs-4 fw-bold" style="color: #0047AB;">Rp ${Number(pkg.price).toLocaleString('id-ID')}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

window.selectPackage = function (name, speed, price, el) {
    // UI Selection
    document.querySelectorAll('.pkg-card-premium').forEach(c => {
        c.classList.remove('selected');
    });

    el.classList.add('selected');

    // Hidden inputs
    document.getElementById('selected-package-name').value = name;
    document.getElementById('selected-package-speed').value = speed;
    document.getElementById('selected-package-price').value = price;

    // Show summary on Step 3 Update texts early
    document.getElementById('summary-pkg-name').textContent = name;
    document.getElementById('summary-pkg-speed').textContent = speed || 'Promo';
    document.getElementById('summary-pkg-price').textContent = 'Rp ' + Number(price).toLocaleString('id-ID');
};
