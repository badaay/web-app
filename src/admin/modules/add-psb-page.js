import { supabase } from '../../api/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ── UI Elements ───────────────────────────────────────────────────────────
    const step1Ind = document.getElementById('step-1-indicator');
    const step2Ind = document.getElementById('step-2-indicator');
    const step1Content = document.getElementById('step-1-content');
    const step2Content = document.getElementById('step-2-content');

    // Step 1
    const customerSearch = document.getElementById('customer-search');
    const searchResults = document.getElementById('search-results');
    const selectedCustomerBadge = document.getElementById('selected-customer-badge');
    const selectedCustName = document.getElementById('selected-cust-name');
    const btnClearSelection = document.getElementById('btn-clear-selection');
    const btnShowNewForm = document.getElementById('btn-show-new-form');
    const btnCreateCustomerOnly = document.getElementById('btn-create-customer-only');
    const newCustomerForm = document.getElementById('new-customer-form');
    const btnNextStep = document.getElementById('btn-next-step');

    // Step 2
    const btnPrevStep = document.getElementById('btn-prev-step');
    const btnSubmitPsb = document.getElementById('btn-submit-psb');
    const psbRegDate = document.getElementById('psb-reg-date');
    const psbPackage = document.getElementById('psb-package');
    const psbReferral = document.getElementById('psb-referral');
    const psbKet = document.getElementById('psb-ket');

    // Feed
    const recentQueueList = document.getElementById('recent-queue-list');
    const todayCountBadge = document.getElementById('today-count');

    // Photo
    const photoDropZone = document.getElementById('photo-drop-zone');
    const photoFileInput = document.getElementById('photo-file-input');
    const photoCameraInput = document.getElementById('photo-camera-input');
    const btnAttachPhoto = document.getElementById('btn-attach-photo');
    const btnOpenCamera = document.getElementById('btn-open-camera');
    const photoPreviewContainer = document.getElementById('photo-preview-container');

    // GPS
    const btnGetLocation = document.getElementById('btn-get-location');

    // ── State ─────────────────────────────────────────────────────────────────
    let selectedCustomerId = null;
    let psbMap = null;
    let psbMarker = null;
    let selectedPhotos = []; // Array of { file, dataUrl }

    if (psbRegDate) psbRegDate.value = new Date().toISOString().split('T')[0];

    await loadInitialData();

    // ── DATA LOADING ──────────────────────────────────────────────────────────

    async function loadInitialData() {
        const { data: packages } = await supabase.from('internet_packages').select('*').order('name');
        if (packages && psbPackage) {
            psbPackage.innerHTML = '<option value="">Pilih Paket...</option>' +
                packages.map(p => `<option value="${p.id}">${p.name} - Rp ${Number(p.price).toLocaleString('id-ID')}</option>`).join('');
        }
        loadRecentQueue();
    }

    async function loadRecentQueue() {
        if (!recentQueueList) return;
        const { data: queue, error } = await supabase
            .from('work_orders')
            .select('*, customers(name, address, phone)')
            .eq('status', 'Antrian')
            .order('created_at', { ascending: false });

        if (error) return console.error(error);

        if (todayCountBadge) todayCountBadge.innerText = queue.length;
        recentQueueList.innerHTML = queue.map(item => `
            <div class="card bg-dark border-secondary mb-3 animate__animated animate__fadeInRight">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-success small">ANTRIAN</span>
                        <small class="text-white-50">${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <h6 class="mb-1 text-white">${item.customers?.name || 'Anonim'}</h6>
                    <p class="small text-white-50 mb-1"><i class="bi bi-geo-alt me-1"></i>${item.customers?.address || '-'}</p>
                    <div class="d-flex justify-content-between align-items-center mt-2 small">
                        <span class="text-accent">${item.customers?.phone || '-'}</span>
                        <span class="text-white-50 fst-italic">${item.ket || 'Data OK'}</span>
                    </div>
                </div>
            </div>
        `).join('') || '<div class="text-center py-5 text-white-50">Belum ada antrian hari ini.</div>';
    }

    // ── CUSTOMER SEARCH ───────────────────────────────────────────────────────

    let searchTimeout;
    if (customerSearch) {
        customerSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = customerSearch.value.trim();
            if (query.length < 2) { if (searchResults) searchResults.innerHTML = ''; return; }
            searchTimeout = setTimeout(async () => {
                const { data } = await supabase
                    .from('customers').select('*')
                    .or(`name.ilike.%${query}%,phone.ilike.%${query}%,ktp.ilike.%${query}%`)
                    .limit(5);
                if (data) renderSearchResults(data);
            }, 300);
        });
    }

    function renderSearchResults(customers) {
        if (!searchResults) return;
        if (customers.length === 0) {
            searchResults.innerHTML = '<div class="list-group-item bg-dark border-secondary text-white-50 small">Tidak ditemukan. Silakan daftar baru.</div>';
            return;
        }
        searchResults.innerHTML = customers.map(c => `
            <button class="list-group-item list-group-item-action bg-dark text-white border-secondary small py-2" data-id="${c.id}" data-name="${c.name}">
                <strong>${c.name}</strong> - ${c.phone} <br>
                <span class="text-white-50 small">${c.address || ''}</span>
            </button>
        `).join('');
        searchResults.querySelectorAll('button').forEach(btn => {
            btn.onclick = () => selectCustomer(btn.dataset.id, btn.dataset.name);
        });
    }

    function selectCustomer(id, name) {
        selectedCustomerId = id;
        if (customerSearch) customerSearch.value = '';
        if (searchResults) searchResults.innerHTML = '';
        if (selectedCustName) selectedCustName.innerText = name;
        if (selectedCustomerBadge) selectedCustomerBadge.classList.remove('d-none');
        if (customerSearch) customerSearch.parentElement.classList.add('d-none');
        if (btnNextStep) btnNextStep.disabled = false;
        if (newCustomerForm) newCustomerForm.classList.add('d-none');
    }

    if (btnClearSelection) {
        btnClearSelection.onclick = () => {
            selectedCustomerId = null;
            if (selectedCustomerBadge) selectedCustomerBadge.classList.add('d-none');
            if (customerSearch) customerSearch.parentElement.classList.remove('d-none');
            if (btnNextStep) btnNextStep.disabled = true;
        };
    }

    if (btnShowNewForm) {
        btnShowNewForm.onclick = () => {
            newCustomerForm.classList.toggle('d-none');
            if (!newCustomerForm.classList.contains('d-none')) {
                newCustomerForm.scrollIntoView({ behavior: 'smooth' });
                initMap();
            }
        };
    }

    // ── MAP & GPS ─────────────────────────────────────────────────────────────

    function initMap() {
        if (psbMap) return;
        const defaultPos = [-7.150970, 112.721245];
        setTimeout(() => {
            psbMap = L.map('psb-map').setView(defaultPos, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(psbMap);
            psbMap.on('click', (e) => pinLocation(e.latlng.lat, e.latlng.lng));
            psbMap.invalidateSize();
        }, 300);
    }

    function pinLocation(lat, lng) {
        document.getElementById('new-cust-lat').value = lat.toFixed(7);
        document.getElementById('new-cust-lng').value = lng.toFixed(7);
        if (psbMarker) psbMarker.remove();
        psbMarker = L.marker([lat, lng]).addTo(psbMap);
        psbMap.setView([lat, lng], 16);
    }

    if (btnGetLocation) {
        btnGetLocation.onclick = () => {
            if (!navigator.geolocation) return alert('Browser Anda tidak mendukung geolokasi.');
            btnGetLocation.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Mencari...';
            btnGetLocation.disabled = true;

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    initMap();
                    setTimeout(() => pinLocation(pos.coords.latitude, pos.coords.longitude), 400);
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

    // ── PHOTO LOGIC ───────────────────────────────────────────────────────────

    function handlePhotoFiles(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedPhotos.push({ file, dataUrl: e.target.result });
                renderPhotoPreview();
            };
            reader.readAsDataURL(file);
        });
    }

    function renderPhotoPreview() {
        if (!photoPreviewContainer) return;
        photoPreviewContainer.innerHTML = selectedPhotos.map((p, i) => `
            <div class="photo-thumb" data-index="${i}">
                <img src="${p.dataUrl}" alt="foto ${i + 1}">
                <button type="button" class="remove-photo" data-index="${i}" title="Hapus">✕</button>
            </div>
        `).join('');
        photoPreviewContainer.querySelectorAll('.remove-photo').forEach(btn => {
            btn.onclick = () => {
                selectedPhotos.splice(parseInt(btn.dataset.index), 1);
                renderPhotoPreview();
            };
        });
    }

    if (photoDropZone) photoDropZone.onclick = () => photoFileInput && photoFileInput.click();
    if (btnAttachPhoto) btnAttachPhoto.onclick = () => photoFileInput && photoFileInput.click();
    if (btnOpenCamera) btnOpenCamera.onclick = () => photoCameraInput && photoCameraInput.click();
    if (photoFileInput) photoFileInput.onchange = (e) => handlePhotoFiles(e.target.files);
    if (photoCameraInput) photoCameraInput.onchange = (e) => handlePhotoFiles(e.target.files);

    // ── CUSTOMER CREATION ─────────────────────────────────────────────────────

    if (btnCreateCustomerOnly) {
        btnCreateCustomerOnly.onclick = async () => {
            const name = document.getElementById('new-cust-name').value.trim();
            const phone = document.getElementById('new-cust-phone').value.trim();
            const ktp = document.getElementById('new-cust-ktp').value.trim();
            const address = document.getElementById('new-cust-address').value.trim();
            const lat = document.getElementById('new-cust-lat').value;
            const lng = document.getElementById('new-cust-lng').value;

            if (!name || !phone) return alert('Nama dan No. HP wajib diisi.');
            if (!lat || !lng) return alert('Silakan klik peta atau gunakan "Lokasi Saya" untuk menentukan lokasi.');

            btnCreateCustomerOnly.disabled = true;
            btnCreateCustomerOnly.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

            try {
                const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'Customer').single();

                const { data: newCust, error: custErr } = await supabase
                    .from('customers')
                    .insert([{ name, phone, ktp, address, lat: parseFloat(lat), lng: parseFloat(lng), role_id: roleData?.id || null }])
                    .select().single();

                if (custErr) throw custErr;

                alert('Pelanggan berhasil terdaftar!');
                selectCustomer(newCust.id, newCust.name);
                if (btnNextStep) btnNextStep.click();

            } catch (err) {
                alert('Gagal daftar pelanggan: ' + err.message);
            } finally {
                btnCreateCustomerOnly.disabled = false;
                btnCreateCustomerOnly.innerHTML = '<i class="bi bi-check-lg me-1"></i> Simpan Pelanggan & Lanjut';
            }
        };
    }

    // ── NAVIGATION ────────────────────────────────────────────────────────────

    if (btnNextStep) {
        btnNextStep.onclick = () => {
            step1Content.classList.add('d-none');
            step2Content.classList.remove('d-none');
            if (step1Ind) { step1Ind.classList.remove('active'); step1Ind.classList.add('completed'); }
            if (step2Ind) step2Ind.classList.add('active');
        };
    }

    if (btnPrevStep) {
        btnPrevStep.onclick = () => {
            step2Content.classList.add('d-none');
            step1Content.classList.remove('d-none');
            if (step2Ind) step2Ind.classList.remove('active');
            if (step1Ind) { step1Ind.classList.remove('completed'); step1Ind.classList.add('active'); }
        };
    }

    // ── SUBMIT ────────────────────────────────────────────────────────────────

    if (btnSubmitPsb) {
        btnSubmitPsb.onclick = async () => {
            if (!selectedCustomerId) return alert('Silakan pilih pelanggan terlebih dahulu.');
            btnSubmitPsb.disabled = true;
            btnSubmitPsb.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan Antrian...';

            try {
                const { error: woErr } = await supabase.from('work_orders').insert([{
                    customer_id: selectedCustomerId,
                    status: 'Antrian',
                    title: 'Pemasangan Baru (PSB)',
                    registration_date: psbRegDate.value,
                    referral_name: psbReferral.value.trim(),
                    ket: psbKet.value.trim() || 'Data OK',
                    // Store photo data URLs as a JSON array string in the photo_url column.
                    // NOTE: For production, consider uploading to Supabase Storage instead.
                    photo_url: selectedPhotos.length > 0 ? JSON.stringify(selectedPhotos.map(p => p.dataUrl)) : null,
                    created_at: new Date().toISOString()
                }]);

                if (woErr) throw woErr;

                alert('Antrian PSB berhasil ditambahkan!');
                resetForm();
                loadRecentQueue();

            } catch (err) {
                alert('Gagal simpan antrian: ' + err.message);
            } finally {
                btnSubmitPsb.disabled = false;
                btnSubmitPsb.innerHTML = 'Simpan & Tambah Ke Antrian <i class="bi bi-check-circle ms-2"></i>';
            }
        };
    }

    // ── RESET ─────────────────────────────────────────────────────────────────

    function resetForm() {
        selectedCustomerId = null;
        selectedPhotos = [];
        if (photoPreviewContainer) photoPreviewContainer.innerHTML = '';
        if (selectedCustomerBadge) selectedCustomerBadge.classList.add('d-none');
        if (customerSearch) customerSearch.parentElement.classList.remove('d-none');
        if (newCustomerForm) newCustomerForm.classList.add('d-none');
        document.querySelectorAll('#new-customer-form input, #new-customer-form textarea').forEach(el => el.value = '');
        if (psbMarker) { psbMarker.remove(); psbMarker = null; }
        if (psbReferral) psbReferral.value = '';
        if (psbKet) psbKet.value = '';
        if (btnNextStep) btnNextStep.disabled = true;
        if (step2Content) step2Content.classList.add('d-none');
        if (step1Content) step1Content.classList.remove('d-none');
        if (step2Ind) step2Ind.classList.remove('active');
        if (step1Ind) { step1Ind.classList.remove('completed'); step1Ind.classList.add('active'); }
    }
});
