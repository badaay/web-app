import { supabase, apiCall } from './api/supabase.js';
import { APP_BASE_URL } from './config.js';
import { APP_CONFIG } from './api/config.js';
import { createGoogleMapsLink } from './utils/map.js';
import { initPWAInstall } from './utils/pwa-install.js';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

document.addEventListener('DOMContentLoaded', async () => {
    // Auth & role guard — only TECH and SPV_TECH may access this page
    const { data: { session: activitySession } } = await supabase.auth.getSession();
    if (!activitySession) {
        window.location.href = APP_BASE_URL + '/admin/login';
        return;
    }
    const { data: activityProfile } = await supabase
        .from('profiles')
        .select('roles(code)')
        .eq('id', activitySession.user.id)
        .single();
    const activityRole = activityProfile?.roles?.code;
    if (activityRole !== 'TECH' && activityRole !== 'SPV_TECH') {
        await supabase.auth.signOut();
        window.location.href = APP_BASE_URL + '/admin/login';
        return;
    }

    // Nav Elements
    const navBtns = document.querySelectorAll('.menu-item');
    const views = {
        'view-tiket-baru': document.getElementById('view-tiket-baru'),
        'view-tiket-aktif': document.getElementById('view-tiket-aktif'),
        'view-registrasi': document.getElementById('view-registrasi')
    };

    const tiketBaruContainer = document.getElementById('tiket-baru-container');
    const tiketAktifContainer = document.getElementById('tiket-aktif-container');
    const errorAlert = document.getElementById('error-alert');
    const errorMessage = document.getElementById('error-message');
    const techInfo = document.getElementById('technician-info');
    const techName = document.getElementById('tech-name');
    const techId = document.getElementById('tech-id');

    // Execution Modal Elements
    let executionModal;
    if (document.getElementById('executionModal')) {
        executionModal = new bootstrap.Modal(document.getElementById('executionModal'));
    }
    const btnSaveExec = document.getElementById('btn-save-exec');
    const execStatus = document.getElementById('exec-status');
    const execNotes = document.getElementById('exec-notes');
    const execPhoto = document.getElementById('exec-photo');
    const execPhotoPreview = document.getElementById('exec-photo-preview');
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const execMac = document.getElementById('exec-mac');
    const execSn = document.getElementById('exec-sn');
    const execActualDate = document.getElementById('exec-actual-date');
    const execActivationDate = document.getElementById('exec-activation-date');
    const execCableLabel = document.getElementById('exec-cable-label');

    // Claim Section Elements
    const claimSection = document.getElementById('claim-section');
    const executionDetailsSection = document.getElementById('execution-details-section');
    const teamSelectionContainer = document.getElementById('team-selection-container');
    const btnConfirmClaim = document.getElementById('btn-confirm-claim');

    let currentExecutingWO = null;
    let currentPhotoBase64 = null;

    // Refresh
    const btnRefresh = document.getElementById('btn-refresh');
    let techDbId_Global; // Declare here to avoid Temporal Dead Zone (TDZ)

    // PWA Install Banner
    initPWAInstall();

    // Setup Tab Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const target = btn.getAttribute('data-target');
            Object.keys(views).forEach(key => {
                if(views[key]) views[key].classList.add('d-none');
            });
            if(views[target]) views[target].classList.remove('d-none');

            // Lazy load map if needed
            if (target === 'view-registrasi' && !pickMap) {
                setTimeout(initRegMap, 300);
            }
        });
    });

    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            if (techDbId_Global) {
                btnRefresh.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
                await loadWorkOrders(techDbId_Global);
                btnRefresh.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
            }
        });
    }

    // Auto-refresh when bringing the app to the foreground
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && techDbId_Global) {
            loadWorkOrders(techDbId_Global);
        }
    });

    // Handle Photo Upload Preview
    if (execPhoto) {
        execPhoto.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    currentPhotoBase64 = evt.target.result;
                    execPhotoPreview.src = currentPhotoBase64;
                    photoPreviewContainer.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            } else {
                currentPhotoBase64 = null;
                photoPreviewContainer.classList.add('d-none');
                execPhotoPreview.src = '';
            }
        });
    }

    // 1. Get employeeID from URL parameter 'eid', or fall back to session email prefix
    // URL pattern is ?eid={employeecode}
    // NOTE: 'code' is reserved by Supabase PKCE auth flow and gets stripped from
    // the URL automatically before JS can read it. Use 'eid' instead.
    const urlParams = new URLSearchParams(window.location.search);
    const eidFromUrl = urlParams.get('eid');
    const eidFromSession = activitySession.user?.email
        ? activitySession.user.email.split('@')[0]
        : null;
    const employeeId = eidFromUrl || eidFromSession;

    if (!employeeId) {
        showError('Akses ditolak. Format URL tidak valid atau kode teknisi tidak ditemukan. Mengalihkan ke halaman login...');
        setTimeout(() => {
            window.location.href = APP_BASE_URL + '/admin/login';
        }, 3000);
        return;
    }

    // 2. Load Technician Info
    try {
        const { data: tech, error: techErr } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (techErr || !tech) {
            showError(`Data teknisi dengan ID ${employeeId} tidak ditemukan.`);
            return;
        }

        // Show Tech Info
        techName.innerText = tech.name;
        techId.innerText = tech.employee_id;
        techDbId_Global = tech.id; // Initialize global ID
        if (techInfo) techInfo.classList.remove('d-none');

        // 3. Load Work Orders assigned to this technician
        await loadWorkOrders(tech.id);

    } catch (err) {
        console.error(err);
        showError('Terjadi kesalahan saat memuat data dari server.');
    }

    async function loadWorkOrders(techDbId) {
        const loadingHtml = `
            <div class="loading-chat mt-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading tasks...</span>
                </div>
            </div>
        `;
        tiketBaruContainer.innerHTML = loadingHtml;
        tiketAktifContainer.innerHTML = loadingHtml;

        const { data: wos, error: woErr } = await supabase
            .from('work_orders')
            .select(`
                *,
                customers ( name, address, phone, lat, lng ),
                installation_monitorings (*),
                employees!employee_id ( name ),
                master_queue_types(name, color, icon),
                work_order_assignments ( id, employee_id, assignment_role, points_earned, employees(name) )
            `)
            .or(`status.eq.confirmed,employee_id.eq.${techDbId},claimed_by.eq.${techDbId}`)
            .order('created_at', { ascending: true });

        if (woErr) {
            showError('Gagal memuat daftar pekerjaan: ' + woErr.message);
            tiketBaruContainer.innerHTML = '';
            tiketAktifContainer.innerHTML = '';
            return;
        }

        if (!wos || wos.length === 0) {
            const emptyHtml = `
                <div class="text-center text-white-50 mt-5">
                    <i class="bi bi-check-circle fs-1 d-block mb-3 text-success opacity-50"></i>
                    <p>Tidak ada tiket yang ditemukan.</p>
                </div>
            `;
            tiketBaruContainer.innerHTML = emptyHtml;
            tiketAktifContainer.innerHTML = emptyHtml;
            return;
        }

        tiketBaruContainer.innerHTML = '';
        tiketAktifContainer.innerHTML = '';

        let hasBaru = false;
        let hasAktif = false;

        wos.forEach(wo => {
            const customerName = wo.customers?.name || 'Pelanggan tidak diketahui';
            const customerAddress = wo.customers?.address || '-';
            const customerLat = wo.customers?.lat;
            const customerLng = wo.customers?.lng;

            const mapLinkHtml = createGoogleMapsLink(customerLat, customerLng);

            // Format time
            const date = new Date(wo.created_at);
            const timeString = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

            const statusBadgeColor = getStatusColor(wo.status);
            const type = wo.master_queue_types;

            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble';
            bubble.style.borderLeftColor = type?.color || '#3B82F6';
            
            bubble.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex align-items-center">
                         <span class="badge rounded-pill px-2 me-2" style="background:${type?.color || '#6b7280'}">
                            <i class="bi ${type?.icon || 'bi-ticket-detailed'} me-1"></i>
                            ${type?.name || 'Tiket'}
                        </span>
                        <div>
                            <div class="fw-bold mb-0">${wo.title}</div>
                            <div class="small text-muted"><i class="bi bi-clock me-1"></i> ${dateString} ${timeString}</div>
                        </div>
                    </div>
                    <span class="badge rounded-pill bg-${statusBadgeColor} bg-opacity-10 text-${statusBadgeColor} px-3 py-2" style="font-size: 0.75rem">${wo.status}</span>
                </div>

                <div class="p-3 bg-light rounded-4 mb-3 border border-light">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-person-circle fs-5 text-primary me-3"></i>
                        <div>
                            <div class="small text-muted" style="font-size: 0.7rem">Nama Pelanggan</div>
                            <div class="fw-medium">${customerName}</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-start">
                        <i class="bi bi-geo-alt-fill fs-5 text-danger me-3"></i>
                        <div>
                            <div class="small text-muted" style="font-size: 0.7rem">Alamat Pemasangan</div>
                            <div class="fw-medium small">${customerAddress} ${mapLinkHtml}</div>
                        </div>
                    </div>
                </div>

                ${wo.description ? `<div class="p-2 border-start border-primary border-4 bg-primary bg-opacity-10 rounded-end small mb-3 text-muted">${wo.description}</div>` : ''}
                
                <div class="mt-3">
                    ${wo.status === 'confirmed' ? `
                    <button class="btn btn-success btn-eksekusi fw-bold shadow-sm" data-action="claim" data-id="${wo.id}">
                        <i class="bi bi-unlock-fill"></i> Ambil & Buka Tiket
                    </button>
                    ` : wo.status === 'open' ? `
                    <button class="btn btn-primary btn-eksekusi fw-bold shadow-sm" data-action="execute" data-id="${wo.id}">
                        <i class="bi bi-lightning-fill"></i> Update / Selesaikan
                    </button>
                    ` : `
                    <button class="btn btn-outline-secondary btn-eksekusi fw-bold" disabled>
                        <i class="bi bi-check2-all"></i> ${wo.status === 'closed' ? 'Tiket Ditutup' : wo.status}
                    </button>
                    `}
                </div>
            `;

            const btnExec = bubble.querySelector('.btn-eksekusi[data-action="execute"]');
            if (btnExec) {
                btnExec.addEventListener('click', () => openExecutionModal(wo));
            }

            const btnClaim = bubble.querySelector('.btn-eksekusi[data-action="claim"]');
            if (btnClaim) {
                btnClaim.addEventListener('click', () => openClaimModal(wo));
            }

            // Ticket Splitting Logic
            if (wo.status === 'confirmed' && !wo.claimed_by) {
                tiketBaruContainer.appendChild(bubble);
                hasBaru = true;
            } else if (wo.status === 'open') {
                tiketAktifContainer.appendChild(bubble);
                hasAktif = true;
            }
            // Closed tickets are filtered out as requested
        });

        if (!hasBaru) tiketBaruContainer.innerHTML = '<p class="text-center text-white-50 mt-4 small">Belum ada tiket baru yang tersedia.</p>';
        if (!hasAktif) tiketAktifContainer.innerHTML = '<p class="text-center text-white-50 mt-4 small">Anda tidak memiliki tiket aktif.</p>';
    }

    async function openClaimModal(wo) {
        if (!executionModal) return;
        currentExecutingWO = wo;

        claimSection.classList.remove('d-none');
        executionDetailsSection.classList.add('d-none');
        document.getElementById('btn-save-exec').classList.add('d-none');

        // Load technicians for team selection
        teamSelectionContainer.innerHTML = '<div class="spinner-border spinner-border-sm text-success"></div>';
        const { data: emps } = await supabase.from('employees').select('id, name').neq('id', techDbId_Global);

        teamSelectionContainer.innerHTML = emps.map(e => `
            <div class="form-check">
                <input class="btn-check team-member-check" type="checkbox" id="team-${e.id}" value="${e.id}" autocomplete="off">
                <label class="btn btn-sm btn-outline-success rounded-pill px-3" for="team-${e.id}">${e.name}</label>
            </div>
        `).join('');

        btnConfirmClaim.onclick = async () => {
            btnConfirmClaim.disabled = true;
            btnConfirmClaim.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...';

            try {
                const selectedTeam = Array.from(document.querySelectorAll('.team-member-check:checked')).map(c => c.value);
                const ket = 'Team Lead: ' + techName.innerText + (selectedTeam.length > 0 ? ' | Anggota: ' + selectedTeam.length : '');

                await apiCall('/work-orders/claim', {
                    method: 'POST',
                    body: JSON.stringify({
                        workOrderId: wo.id,
                        technicianId: techDbId_Global,
                        teamMembers: selectedTeam,
                        ket: ket
                    })
                });

                executionModal.hide();
                await loadWorkOrders(techDbId_Global);
            } catch (err) {
                showError('Gagal mengambil tiket: ' + err.message);
            } finally {
                btnConfirmClaim.disabled = false;
                btnConfirmClaim.innerText = 'Konfirmasi & Mulai Pengerjaan';
            }
        };

        executionModal.show();
    }


    function openExecutionModal(wo) {
        if (!executionModal) return;
        currentExecutingWO = wo;

        claimSection.classList.add('d-none');
        executionDetailsSection.classList.remove('d-none');
        document.getElementById('btn-save-exec').classList.remove('d-none');

        // Reset form
        execNotes.value = wo.ket || '';
        execStatus.value = wo.status === 'closed' ? 'closed' : 'open';
        execPhoto.value = '';
        currentPhotoBase64 = null;
        photoPreviewContainer.classList.add('d-none');
        execPhotoPreview.src = '';

        // Fill from existing monitorings if present
        const monitoring = (wo.installation_monitorings && wo.installation_monitorings.length > 0)
            ? wo.installation_monitorings[0]
            : null;

        if (monitoring) {
            execMac.value = monitoring.mac_address || '';
            execSn.value = monitoring.sn_modem || '';
            execCableLabel.value = monitoring.cable_label || '';
            execActualDate.value = monitoring.actual_date || '';
            execActivationDate.value = monitoring.activation_date || '';
            if (monitoring.photo_proof) {
                currentPhotoBase64 = monitoring.photo_proof;
                execPhotoPreview.src = currentPhotoBase64;
                photoPreviewContainer.classList.remove('d-none');
            }
        } else {
            execMac.value = '';
            execSn.value = '';
            execCableLabel.value = '';
            execActualDate.value = new Date().toISOString().split('T')[0];
            execActivationDate.value = new Date().toISOString().split('T')[0];
        }

        executionModal.show();
    }

    if (btnSaveExec) {
        btnSaveExec.addEventListener('click', async () => {
            if (!currentExecutingWO) return;

            const newStatus = execStatus.value;
            const notes = execNotes.value;

            btnSaveExec.disabled = true;
            btnSaveExec.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Menyimpan...`;

            try {
                // Calculate Points if status is closed
                let points = currentExecutingWO.points || 0;
                if (newStatus === 'closed') {
                    const { data: qType } = await supabase.from('master_queue_types').select('base_point, name').eq('id', currentExecutingWO.type_id).maybeSingle();
                    if (qType) points = qType.base_point;
                    else points = 100; // Default fallback

                    // Distribute points to all assignees on this work order
                    const { data: assignments } = await supabase
                        .from('work_order_assignments')
                        .select('id, assignment_role')
                        .eq('work_order_id', currentExecutingWO.id);

                    if (assignments && assignments.length > 0) {
                        // Lead gets full points; each member gets half
                        const pointUpdates = assignments.map(a => ({
                            id: a.id,
                            points_earned: a.assignment_role === 'lead' ? points : Math.floor(points / 2)
                        }));
                        await supabase
                            .from('work_order_assignments')
                            .upsert(pointUpdates, { onConflict: 'id' });
                    }

                    // If this is a PSB work order, generate customer credentials now
                    if (qType && qType.name === 'PSB') {
                        const { data: custData } = await supabase
                            .from('customers')
                            .select('phone, email, name, customer_code')
                            .eq('id', currentExecutingWO.customer_id)
                            .single();

                        // Only create credentials if not yet provisioned
                        if (custData && !custData.customer_code) {
                            const now = new Date();
                            const yy = String(now.getFullYear()).slice(-2);
                            const mm = String(now.getMonth() + 1).padStart(2, '0');
                            const rand7 = String(Math.floor(1000000 + Math.random() * 9000000));
                            const customer_code = `${yy}${mm}${rand7}`;
                            const authEmail = custData.email || `${custData.phone}${APP_CONFIG.AUTH_DOMAIN_SUFFIX}`;
                            const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

                            // Create auth account
                            const { error: signUpErr } = await supabase.auth.signUp({
                                email: authEmail,
                                password: tempPassword,
                                options: { data: { full_name: custData.name, customer_code, role: 'customer' } }
                            });

                            if (!signUpErr) {
                                // Stamp customer_code + auth email onto customer row
                                await supabase
                                    .from('customers')
                                    .update({ customer_code, email: authEmail })
                                    .eq('id', currentExecutingWO.customer_id);
                            } else {
                                console.warn('PSB selesai tapi gagal membuat akun pelanggan:', signUpErr.message);
                            }
                        }
                    }
                }

                // Update work order
                const { error: updateErr } = await supabase
                    .from('work_orders')
                    .update({
                        status: newStatus,
                        points: points,
                        ket: notes ? notes : currentExecutingWO.ket,
                        ...(newStatus === 'closed' && { completed_at: new Date().toISOString() })
                    })
                    .eq('id', currentExecutingWO.id);

                if (updateErr) throw updateErr;

                // Upsert to installation_monitorings
                const monitoringData = {
                    work_order_id: currentExecutingWO.id,
                    customer_id: currentExecutingWO.customer_id,
                    employee_id: currentExecutingWO.employee_id,
                    mac_address: execMac.value || null,
                    sn_modem: execSn.value || null,
                    cable_label: execCableLabel.value || null,
                    actual_date: execActualDate.value || null,
                    activation_date: execActivationDate.value || null,
                    photo_proof: currentPhotoBase64,
                    notes: notes,
                    is_confirmed: false // Wait for master to confirm
                };

                const existingMonitoring = (currentExecutingWO.installation_monitorings && currentExecutingWO.installation_monitorings.length > 0)
                    ? currentExecutingWO.installation_monitorings[0]
                    : null;

                if (existingMonitoring) {
                    monitoringData.id = existingMonitoring.id; // required for upsert to work correctly if bypassing unique constraint slightly, though work_order_id is unique so upsert works.
                }

                const { error: monitorErr } = await supabase
                    .from('installation_monitorings')
                    .upsert(monitoringData, { onConflict: 'work_order_id' });

                if (monitorErr) throw monitorErr;

                executionModal.hide();
                // Reload list using current technician's actual DB ID
                await loadWorkOrders(techDbId_Global);

            } catch (err) {
                console.error('Update error:', err);
                showError('Gagal mengupdate status: ' + err.message);
            } finally {
                btnSaveExec.disabled = false;
                btnSaveExec.innerText = 'Simpan';
            }
        });
    }

    function showError(msg) {
        errorAlert.classList.remove('d-none');
        errorMessage.innerText = msg;
        if(tiketBaruContainer) tiketBaruContainer.innerHTML = '';
        if(tiketAktifContainer) tiketAktifContainer.innerHTML = '';
    }

    function getStatusColor(status) {
        const s = status ? status.toLowerCase() : '';
        if (s === 'waiting') return 'warning';
        if (s === 'confirmed') return 'success';
        if (s === 'open') return 'info';
        if (s === 'closed') return 'secondary';
        
        if (s.includes('pending') || s.includes('antrian')) return 'warning';
        if (s.includes('selesai')) return 'success';
        if (s.includes('proses')) return 'info';
        if (s.includes('cancel')) return 'danger';
        return 'secondary';
    }

    // --- REGISTRATION LOGIC --- 
    let pickMap;
    let marker;
    const defaultPos = [-7.150970, 112.721245];

    async function initRegMap() {
        if (pickMap) return;
        pickMap = L.map('reg-location-map').setView(defaultPos, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickMap);

        pickMap.on('click', (e) => {
            const { lat, lng } = e.latlng;
            document.getElementById('reg-cust-lat').value = lat.toFixed(7);
            document.getElementById('reg-cust-lng').value = lng.toFixed(7);
            
            if (marker) marker.setLatLng([lat, lng]);
            else marker = L.marker([lat, lng]).addTo(pickMap);
        });

        // Load Packages
        const { data: pkgs } = await supabase.from('internet_packages').select('name, speed').order('price', { ascending: true });
        const pkgSelect = document.getElementById('reg-cust-package');
        if (pkgs && pkgSelect) {
            pkgSelect.innerHTML = '<option value="">Pilih Paket...</option>' + pkgs.map(p => `
                <option value="${p.name}">${p.name} - ${p.speed || ''}</option>
            `).join('');
        }
    }

    const regPhotoKtp = document.getElementById('reg-cust-ktp');
    const previewRegKtp = document.getElementById('preview-reg-ktp');
    let ktpBase64 = null;
    
    if (regPhotoKtp) {
        regPhotoKtp.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    ktpBase64 = evt.target.result;
                    previewRegKtp.src = ktpBase64;
                    previewRegKtp.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const regPhotoRumah = document.getElementById('reg-cust-rumah');
    const previewRegRumah = document.getElementById('preview-reg-rumah');
    let rumahBase64 = null;
    
    if (regPhotoRumah) {
        regPhotoRumah.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    rumahBase64 = evt.target.result;
                    previewRegRumah.src = rumahBase64;
                    previewRegRumah.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const btnSaveReg = document.getElementById('btn-save-registration');
    if (btnSaveReg) {
        btnSaveReg.addEventListener('click', async () => {
            const name = document.getElementById('reg-cust-name').value.trim();
            const phone = document.getElementById('reg-cust-phone').value.trim();
            const pkg = document.getElementById('reg-cust-package').value;
            const address = document.getElementById('reg-cust-address').value.trim();
            const lat = document.getElementById('reg-cust-lat').value;
            const lng = document.getElementById('reg-cust-lng').value;

            if (!name || !phone || !pkg || !address) {
                alert('Nama, Nomor WhatsApp, Paket, dan Alamat wajib diisi.');
                return;
            }
            if (!lat || !lng) {
                alert('Silakan pilih titik lokasi pada peta.');
                return;
            }
            if (!ktpBase64 || !rumahBase64) {
                alert('Foto KTP dan Foto Rumah wajib diunggah.');
                return;
            }

            btnSaveReg.disabled = true;
            btnSaveReg.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

            try {
                // Default CUST role
                const { data: roleData } = await supabase.from('roles').select('id').eq('code', 'CUST').single();

                // 1. Insert Customer
                const { data: newCust, error: custErr } = await supabase.from('customers').insert([{
                    name, phone, address, 
                    packet: pkg,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    role_id: roleData?.id || null,
                    photo_ktp: ktpBase64,
                    photo_rumah: rumahBase64
                }]).select().single();

                if (custErr) throw custErr;

                // 2. Insert PSB Work Order
                const { data: psbType } = await supabase.from('master_queue_types').select('id').eq('name', 'PSB').single();
                const { error: woErr } = await supabase.from('work_orders').insert([{
                    customer_id: newCust.id,
                    type_id: psbType?.id || null,
                    status: 'waiting',
                    source: 'technician',
                    title: 'Pemasangan Baru (PSB)',
                    ket: `Paket: ${pkg} (Diregistrasi oleh Teknisi)`,
                    registration_date: new Date().toISOString().split('T')[0]
                }]);

                if (woErr) console.warn("Notice: Gagal membuat antrian PSB otomatis:", woErr.message);

                alert('Registrasi Pelanggan berhasil! Tiket sudah masuk antrian.');
                
                // Clear Form
                document.getElementById('tech-reg-customer-form').reset();
                ktpBase64 = null; rumahBase64 = null;
                previewRegKtp.classList.add('d-none');
                previewRegRumah.classList.add('d-none');
                if (marker) {
                    marker.remove(); marker = null;
                }

                // Auto switch back to Tiket Baru to see the new ticket
                document.querySelector('.menu-item[data-target="view-tiket-baru"]').click();
                await loadWorkOrders(techDbId_Global);

            } catch (err) {
                console.error(err);
                if (err.message && err.message.toLowerCase().includes('unique')) {
                    alert('Nomor telepon ini sudah terdaftar.');
                } else {
                    alert('Gagal registrasi pelanggan: ' + err.message);
                }
            } finally {
                btnSaveReg.disabled = false;
                btnSaveReg.innerHTML = '<i class="bi bi-cloud-arrow-up-fill me-2"></i> Daftarkan Sekarang';
            }
        });
    }
});
