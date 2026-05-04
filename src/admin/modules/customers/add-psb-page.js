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

        // Remove existing error for this element
        const existingErrors = document.querySelectorAll('.custom-inline-error');
        existingErrors.forEach(err => err.remove());

        const errNode = document.createElement('div');
        errNode.className = 'custom-inline-error fw-bold';
        errNode.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> ${message}`;
        document.body.appendChild(errNode);

        const rect = el.getBoundingClientRect();
        const errRect = errNode.getBoundingClientRect();

        // Position above the element, centered
        errNode.style.top = `${rect.top - errRect.height - 12 + window.scrollY}px`;
        errNode.style.left = `${rect.left + (rect.width / 2) - (errRect.width / 2)}px`;

        // Adjust if out of screen (left/right)
        const leftLimit = 10;
        const rightLimit = window.innerWidth - errRect.width - 10;
        if (parseFloat(errNode.style.left) < leftLimit) errNode.style.left = `${leftLimit}px`;
        if (parseFloat(errNode.style.left) > rightLimit) errNode.style.left = `${rightLimit}px`;

        // Highlight the element
        el.classList.add('is-invalid');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const clearValidity = () => {
            el.classList.remove('is-invalid');
            errNode.style.opacity = '0';
            errNode.style.transform = 'translateY(10px) scale(0.9)';
            setTimeout(() => errNode.remove(), 300);
        };

        el.addEventListener('input', clearValidity, { once: true });
        el.addEventListener('change', clearValidity, { once: true });
        el.addEventListener('click', clearValidity, { once: true });
        
        // Auto-hide after 4 seconds
        setTimeout(clearValidity, 4000);
    };

    const getRenderHeader = () => `
        <style>
            .custom-inline-error {
                position: fixed;
                background: #ef4444;
                color: white;
                padding: 10px 16px;
                border-radius: 12px;
                font-size: 0.85rem;
                z-index: 9999;
                box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4);
                pointer-events: none;
                animation: errorFadeIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                display: flex;
                align-items: center;
                gap: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .custom-inline-error::after {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 8px 8px 0;
                border-style: solid;
                border-color: #ef4444 transparent transparent;
            }
            @keyframes errorFadeIn {
                from { opacity: 0; transform: translateY(10px) scale(0.9); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes slideInRight {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            .pkg-card-premium {
                background: #ffffff;
                border: 1px solid #e2e8f0; 
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 1rem;
                overflow: hidden;
                position: relative;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
            }
            .pkg-card-premium::before {
                content: '';
                position: absolute;
                top: 0; left: 0; bottom: 0; width: 4px;
                background: linear-gradient(180deg, #0047AB, #2DD4BF);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .pkg-card-premium:hover {
                transform: translateX(6px);
                border-color: #cbd5e1;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            }
            .pkg-card-premium:hover::before {
                opacity: 1;
            }
            .pkg-card-premium.selected {
                border-color: #0047AB;
                background: #f8fafc;
                box-shadow: 0 0 0 1px #0047AB, 0 10px 25px -5px rgba(0,71,171,0.1);
                transform: translateX(10px);
            }
            .pkg-card-premium.selected::before {
                opacity: 1;
                width: 6px;
            }
            .pkg-icon-wrapper {
                width: 48px;
                height: 48px;
                border-radius: 0.75rem;
                background: #f1f5f9;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #e2e8f0;
                color: #0047AB;
                transition: all 0.3s ease;
            }
            .pkg-card-premium.selected .pkg-icon-wrapper {
                background: linear-gradient(135deg, #0047AB, #2DD4BF);
                color: white;
                border: none;
            }
            .summary-panel-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 1.25rem;
                padding: 2rem;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
                animation: slideInRight 0.4s ease-out;
            }
            .order-summary-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 1rem;
                overflow: hidden;
            }
            .order-summary-header {
                background: #f8fafc;
                padding: 1.5rem;
                border-bottom: 1px solid #e2e8f0;
            }
            .order-summary-body {
                padding: 1.5rem;
            }
            .feature-list-mini {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .feature-list-mini li {
                font-size: 0.85rem;
                color: #64748b;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .feature-list-mini li i {
                color: #2DD4BF;
            }
            .sticky-summary {
                position: sticky;
                top: 20px;
                max-height: calc(100vh - 120px);
                overflow-y: auto;
                scrollbar-width: none; /* Firefox */
                -ms-overflow-style: none;  /* IE/Edge */
            }
            .sticky-summary::-webkit-scrollbar {
                display: none; /* Chrome/Safari/Webkit */
            }
            
            /* Hide Admin Sidebar Scrollbar on this page as requested */
            #admin-sidebar .sidebar-nav {
                overflow: hidden !important;
            }
            
            @media (max-width: 991px) {
                .sticky-summary {
                    position: static;
                    max-height: none;
                }
            }
            .location-display-box {
                background: #f1f5f9;
                padding: 1rem;
                border-radius: 0.75rem;
                border-left: 4px solid #0047AB;
            }
            .photo-drop-zone {
                border: 2px dashed #e2e8f0;
                border-radius: 1rem;
                padding: 2rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
                background: #f8fafc;
            }
            .photo-drop-zone:hover {
                border-color: #0047AB;
                background: #f1f5f9;
                transform: translateY(-2px);
            }
            @media (max-width: 991.98px) {
                .sticky-summary {
                    position: static;
                    margin-top: 2rem;
                }
                .pkg-card-premium.selected {
                    transform: scale(1.02);
                }
            }
        </style>
        <div class="row mb-4">
            <div class="col-12 text-center">
                <h3 class="text-slate-900 fw-bold mb-2" style="color: #0f172a;"><i class="bi bi-lightning-charge-fill text-primary me-2"></i>Pendaftaran Pemasangan Baru</h3>
                <p class="text-slate-500" style="color: #64748b;">Hanya butuh 3 langkah untuk menikmati internet cepat tanpa batas.</p>
            </div>
        </div>

        <!-- STEPPER INDICATORS -->
        <div class="d-flex mb-5 justify-content-center flex-wrap gap-2 gap-md-4">
            <div class="step-indicator active d-flex align-items-center" id="ind-step-1">
                <div class="step-num bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(13, 110, 253, 0.2);">1</div>
                <span class="small fw-bold text-dark">Pilih Layanan</span>
            </div>
            <div class="step-indicator opacity-50 d-flex align-items-center" id="ind-step-2">
                <div class="step-num bg-light border text-secondary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">2</div>
                <span class="small fw-bold text-secondary">Titik Lokasi</span>
            </div>
            <div class="step-indicator opacity-50 d-flex align-items-center" id="ind-step-3">
                <div class="step-num bg-light border text-secondary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">3</div>
                <span class="small fw-bold text-secondary">Konfirmasi</span>
            </div>
        </div>

        <!-- LOADING OVERLAY -->
        <div id="step-loading" class="d-none text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
            <p class="text-secondary mt-3">Sedang memproses...</p>
        </div>
    `;

    const getRenderStep1 = () => `
            <!-- ====== STEP 1: PILIH PAKET (SIDE-BY-SIDE) ====== -->
            <div id="step-1" class="step-section">
                <div class="row g-4">
                    <div class="col-lg-7">
                        <div class="mb-3 d-flex justify-content-between align-items-center">
                            <h5 class="text-dark fw-bold mb-0">Paket Tersedia</h5>
                            <span class="badge bg-white text-primary border px-3 py-2 rounded-pill shadow-sm" id="pkg-count-badge">Memuat...</span>
                        </div>
                        <div class="row g-3" id="package-cards-container">
                            <div class="col-12 text-center text-secondary py-5">
                                <div class="spinner-border text-primary mb-3"></div>
                                <p>Menghubungkan ke server...</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-5">
                        <div class="sticky-summary">
                            <div id="selection-summary-container">
                                <div class="card border-0 shadow-sm p-5 text-center bg-white" style="border-radius: 1.5rem; min-height: 400px; display: flex; align-items: center; justify-content: center; border: 1px dashed #cbd5e1 !important;">
                                    <div class="opacity-50">
                                        <div class="mb-4 text-primary">
                                            <i class="bi bi-box-seam" style="font-size: 4rem;"></i>
                                        </div>
                                        <h5 class="fw-bold text-dark">Belum Ada Pilihan</h5>
                                        <p class="small text-secondary mb-0">Silakan pilih paket internet di sebelah kiri<br>untuk melihat detail dan melanjutkan.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <button type="button" class="btn btn-primary w-100 py-3 fw-bold shadow transition-transform d-none" id="btn-next-2" style="background: linear-gradient(135deg, #0047AB, #2DD4BF); border: none; font-size: 1.1rem; border-radius: 1rem;">
                                    Lanjut ke Lokasi <i class="bi bi-arrow-right ms-2"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <input type="hidden" id="selected-package-name" required>
                <input type="hidden" id="selected-package-price">
                <input type="hidden" id="selected-package-speed">
            </div>
    `;

    const getRenderStep2 = () => `
            <!-- ====== STEP 2: LOKASI PEMASANGAN (SIDE-BY-SIDE) ====== -->
            <div id="step-2" class="step-section d-none">
                <div class="row g-4">
                    <div class="col-lg-7">
                        <div class="card border-0 shadow-sm overflow-hidden" style="border-radius: 1rem;">
                            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                                <h5 class="mb-0 text-dark fw-bold"><i class="bi bi-geo-alt-fill text-primary me-2"></i>Pilih Lokasi</h5>
                                <span class="badge bg-light text-secondary border">Klik pada peta</span>
                            </div>
                            <div id="location-picker-map" style="height: 500px; background: #f8fafc;"></div>
                            <input type="hidden" id="adv-cust-coords">
                        </div>
                    </div>
                    <div class="col-lg-5">
                        <div class="sticky-summary">
                            <div class="card border-0 shadow-sm p-4 bg-white" style="border-radius: 1rem;">
                                <div class="mb-4">
                                    <label class="form-label text-secondary small fw-bold text-uppercase letter-spacing-1">Detail Alamat Pemasangan</label>
                                    <textarea class="form-control bg-light border-0" id="adv-cust-address" style="min-height: 150px; border-radius: 0.75rem;" placeholder="Contoh: Perumahan Griya Indah, Blok A2 No. 15, RT 05/02, Kel. Sukamaju, Patokan: Sebelah Masjid Al-Ikhlas" required></textarea>
                                </div>
                                
                                <div class="alert alert-info border-0 shadow-sm small py-3" style="border-radius: 0.75rem; background: rgba(59, 91, 219, 0.05);">
                                    <i class="bi bi-info-circle-fill me-2 text-primary"></i>
                                    Pastikan titik lokasi di peta sesuai dengan alamat pemasangan untuk mempermudah teknisi kami.
                                </div>
                            </div>
                            <div class="d-flex justify-content-between gap-3 mt-4">
                                <button type="button" class="btn btn-outline-secondary flex-grow-1 py-3 fw-bold" id="btn-back-1" style="border-radius: 1rem;">
                                    <i class="bi bi-arrow-left me-2"></i> Kembali
                                </button>
                                <button type="button" class="btn btn-primary flex-grow-1 py-3 fw-bold shadow" id="btn-next-3" style="background: linear-gradient(135deg, #0047AB, #2DD4BF); border: none; border-radius: 1rem;">
                                    Lanjut <i class="bi bi-arrow-right ms-2"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    `;

    const getRenderStep3 = () => `
            <!-- ====== STEP 3: BIODATA DIRI (SIDE-BY-SIDE) ====== -->
            <div id="step-3" class="step-section d-none">
                <div class="row g-4">
                    <div class="col-lg-5 order-2 order-lg-1">
                        <div class="sticky-summary">
                            <div class="order-summary-card shadow-sm">
                                <div class="order-summary-header">
                                    <h5 class="fw-bold text-dark mb-0"><i class="bi bi-receipt me-2 text-primary"></i>Ringkasan Pesanan</h5>
                                </div>
                                <div class="order-summary-body">
                                    <div class="mb-4">
                                        <label class="small text-secondary fw-bold text-uppercase d-block mb-2">Paket Internet</label>
                                        <div class="d-flex align-items-center gap-3 bg-light p-3 rounded-3">
                                            <div class="pkg-icon-wrapper bg-white shadow-sm" style="width: 40px; height: 40px; font-size: 1.2rem;">
                                                <i class="bi bi-wifi"></i>
                                            </div>
                                            <div>
                                                <h6 class="fw-bold text-dark mb-0" id="summary-pkg-name">-</h6>
                                                <span class="badge bg-primary-subtle text-primary border-0 small" id="summary-pkg-speed">-</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <label class="small text-secondary fw-bold text-uppercase d-block mb-2">Lokasi Pemasangan</label>
                                        <p class="small text-dark mb-2" id="summary-address" style="line-height: 1.5;">-</p>
                                        <div class="d-flex align-items-center gap-2 text-secondary font-monospace" style="font-size: 0.75rem;">
                                            <i class="bi bi-geo-fill"></i>
                                            <span id="summary-coords">-</span>
                                        </div>
                                    </div>

                                    <div class="pt-3 border-top d-flex justify-content-between align-items-center">
                                        <span class="fw-bold text-dark">Total Biaya</span>
                                        <h4 class="fw-bold text-primary mb-0" id="summary-pkg-price">-</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-7 order-1 order-lg-2">
                        <div class="card border-0 shadow-sm p-4 p-md-5 bg-white" style="border-radius: 1.25rem;">
                            <h5 class="fw-bold text-dark mb-4 pb-2 border-bottom"><i class="bi bi-person-badge-fill text-primary me-2"></i>Detail Informasi Pelanggan</h5>
                            
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-bold">Nama Lengkap (KTP)</label>
                                    <input type="text" class="form-control bg-light border-0 py-3" id="adv-cust-name" placeholder="Contoh: Ahmad Fauzi" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-bold">Alamat Email</label>
                                    <input type="email" class="form-control bg-light border-0 py-3" id="adv-cust-email" placeholder="ahmad@email.com">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-bold">WhatsApp / HP</label>
                                    <input type="text" class="form-control bg-light border-0 py-3" id="adv-cust-phone" placeholder="081234567890" required>
                                    <div id="phone-duplicate-msg" class="small mt-1 d-none"></div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-secondary small fw-bold">HP Alternatif</label>
                                    <input type="text" class="form-control bg-light border-0 py-3" id="adv-cust-alt-phone" placeholder="Keluarga/Kerabat (Opsional)">
                                </div>
                                
                                <div class="col-12 mt-4">
                                    <h6 class="text-dark fw-bold mb-3"><i class="bi bi-camera-fill me-2 text-primary"></i>Upload Dokumen</h6>
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label class="form-label text-secondary small fw-bold">Foto Lokasi Rumah</label>
                                            <div class="photo-drop-zone bg-light border-0 py-4" id="drop-zone-rumah" onclick="document.getElementById('adv-cust-foto-rumah').click()">
                                                <i class="bi bi-house-door-fill fs-2 text-primary opacity-50"></i>
                                                <p class="small text-secondary mb-0 mt-2">Klik untuk Unggah</p>
                                                <input type="file" id="adv-cust-foto-rumah" class="d-none" accept="image/*">
                                            </div>
                                            <div id="preview-rumah" class="mt-2" style="display:none;">
                                                <img src="" class="img-thumbnail w-100" style="height: 150px; object-fit: cover;">
                                                <button type="button" class="btn btn-sm btn-link text-danger w-100 mt-1" id="btn-remove-rumah">Hapus Foto</button>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label text-secondary small fw-bold">Foto KTP Asli</label>
                                            <div class="photo-drop-zone bg-light border-0 py-4" id="drop-zone-ktp" onclick="document.getElementById('adv-cust-foto-ktp').click()">
                                                <i class="bi bi-person-vcard-fill fs-2 text-primary opacity-50"></i>
                                                <p class="small text-secondary mb-0 mt-2">Klik untuk Unggah</p>
                                                <input type="file" id="adv-cust-foto-ktp" class="d-none" accept="image/*">
                                            </div>
                                            <div id="preview-ktp" class="mt-2" style="display:none;">
                                                <img src="" class="img-thumbnail w-100" style="height: 150px; object-fit: cover;">
                                                <button type="button" class="btn btn-sm btn-link text-danger w-100 mt-1" id="btn-remove-ktp">Hapus Foto</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="d-flex justify-content-between gap-3 mt-5">
                                <button type="button" class="btn btn-outline-secondary px-4 py-3 fw-bold" id="btn-back-2" style="border-radius: 1rem;">
                                    <i class="bi bi-arrow-left me-2"></i> Kembali
                                </button>
                                <button type="button" class="btn btn-primary flex-grow-1 py-3 fw-bold shadow" id="save-adv-customer-btn" style="background: linear-gradient(135deg, #0047AB, #2DD4BF); border: none; border-radius: 1rem;">
                                    <i class="bi bi-check-circle-fill me-2"></i> Konfirmasi & Daftar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    `;

    container.innerHTML = getRenderHeader() +
        '<form id="add-psb-registration-form" novalidate>' +
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
                _psbPicker = createLocationPicker('location-picker-map', 'adv-cust-coords', { 
                    theme: 'light',
                    onLocationSelect: (coords) => {
                        const display = document.getElementById('coords-display-text');
                        if (display) {
                            display.innerHTML = `<span class="text-primary fw-bold">${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}</span>`;
                            display.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 300 });
                        }
                    }
                });
            } else {
                setTimeout(() => _psbPicker.instance?.invalidateSize(), 200);
            }
        } else if (stepIndex === 2) {
            // Update Summary for Final Step
            const addr = document.getElementById('adv-cust-address').value;
            const coords = document.getElementById('adv-cust-coords').value;
            
            document.getElementById('summary-address').textContent = addr || 'Alamat belum diisi';
            document.getElementById('summary-coords').textContent = coords || 'Koordinat belum dipilih';

            // Early update in case user changes it
            document.getElementById('adv-cust-address').addEventListener('input', (e) => {
                document.getElementById('summary-address').textContent = e.target.value || 'Alamat belum diisi';
            });
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
        setTimeout(() => {
            const pkgCards = document.querySelectorAll('.pkg-card-premium');
            pkgCards.forEach(card => {
                const nameText = card.querySelector('h5')?.textContent || '';
                const slug = nameText.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                
                if (slug === targetPkgSlug || slug.includes(targetPkgSlug)) {
                    card.click();
                    // Scroll to card if needed, though usually it's at the top
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }, 100);
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
    const countBadge = document.getElementById('pkg-count-badge');
    let data = [];
    try {
        const result = await apiCall('/packages');
        if (result && result.data) data = result.data;
    } catch (err) {
        console.error("Failed to load packages", err);
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-secondary my-4">Belum ada paket tersedia di database.</div>';
        if (countBadge) countBadge.textContent = '0 Paket';
        return;
    }

    if (countBadge) countBadge.textContent = `${data.length} Paket Pilihan`;

    container.innerHTML = data.map(pkg => `
        <div class="col-12 mb-2">
            <div class="pkg-card-premium" 
                 style="cursor: pointer;" 
                 onclick="window.selectPackage('${pkg.name}', '${pkg.speed || ''}', '${pkg.price}', '${(pkg.description || '').replace(/'/g, "\\'")}', this)">
                <div class="card-body p-3">
                    <div class="d-flex align-items-center gap-3">
                        <div class="pkg-icon-wrapper flex-shrink-0">
                            <i class="bi bi-wifi fs-4"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="mb-1 fw-bold text-dark">${pkg.name}</h5>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-light text-primary border-0 small px-2">${pkg.speed || 'Best Effort'}</span>
                                <span class="text-primary fw-bold small">Rp ${Number(pkg.price).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div class="text-secondary opacity-50 pe-2">
                            <i class="bi bi-chevron-right"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

window.selectPackage = function (name, speed, price, description, el) {
    // UI Selection
    document.querySelectorAll('.pkg-card-premium').forEach(c => {
        c.classList.remove('selected');
    });

    el.classList.add('selected');

    // Hidden inputs
    document.getElementById('selected-package-name').value = name;
    document.getElementById('selected-package-speed').value = speed;
    document.getElementById('selected-package-price').value = price;

    // Update Right Panel Summary
    const summaryContainer = document.getElementById('selection-summary-container');
    const nextBtn = document.getElementById('btn-next-2');
    
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="summary-panel-card">
                <div class="text-center mb-4">
                    <div class="pkg-icon-wrapper mx-auto mb-3" style="width: 80px; height: 80px; font-size: 2rem; background: linear-gradient(135deg, #0047AB, #2DD4BF); color: white; border: none;">
                        <i class="bi bi-speedometer2"></i>
                    </div>
                    <h4 class="fw-bold text-dark mb-1">${name}</h4>
                    <span class="badge bg-light text-primary mb-3 px-3 py-2 border">${speed || 'Unlimited Access'}</span>
                </div>
                
                <div class="bg-light p-3 rounded-3 mb-4">
                    <p class="small text-secondary mb-2 fw-medium text-uppercase letter-spacing-1">Deskripsi Paket</p>
                    <p class="small text-dark mb-0">${description || 'Nikmati koneksi internet stabil dan andal untuk semua kebutuhan digital keluarga Anda.'}</p>
                </div>

                <div class="mb-4">
                    <p class="small text-secondary mb-2 fw-medium text-uppercase letter-spacing-1">Benefit Layanan</p>
                    <ul class="feature-list-mini">
                        <li><i class="bi bi-check-circle-fill"></i> Aktivasi Cepat (±24 Jam)</li>
                        <li><i class="bi bi-check-circle-fill"></i> Free Router & Instalasi</li>
                        <li><i class="bi bi-check-circle-fill"></i> Support 24/7 Priority</li>
                    </ul>
                </div>

                <div class="pt-3 border-top d-flex justify-content-between align-items-center">
                    <div>
                        <span class="small text-secondary d-block">Biaya Bulanan</span>
                        <h4 class="fw-bold text-primary mb-0">Rp ${Number(price).toLocaleString('id-ID')}</h4>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-success-subtle text-success border border-success-subtle px-2">Ready to Install</span>
                    </div>
                </div>
            </div>
        `;
        
        if (nextBtn) {
            nextBtn.classList.remove('d-none');
            nextBtn.classList.add('animate__animated', 'animate__fadeInUp');
        }
    }

    // Show summary on Step 3 Update texts early
    document.getElementById('summary-pkg-name').textContent = name;
    document.getElementById('summary-pkg-speed').textContent = speed || 'Promo';
    document.getElementById('summary-pkg-price').textContent = 'Rp ' + Number(price).toLocaleString('id-ID');
};

