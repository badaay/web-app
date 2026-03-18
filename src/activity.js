import { supabase } from './api/supabase.js';
import { APP_BASE_URL } from './config.js';
import { createGoogleMapsLink } from './utils/map.js';
import { initPWAInstall } from './utils/pwa-install.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('activity-chat-container');
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

    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            if (techDbId_Global) {
                await loadWorkOrders(techDbId_Global);
            }
        });
    }

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

    // 1. Get employeeID from URL parameter 'eid'
    // URL pattern is ?eid={employeecode}
    // NOTE: 'code' is reserved by Supabase PKCE auth flow and gets stripped from
    // the URL automatically before JS can read it. Use 'eid' instead.
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('eid');

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
        techInfo.classList.remove('d-none');

        // 3. Load Work Orders assigned to this technician
        await loadWorkOrders(tech.id);

    } catch (err) {
        console.error(err);
        showError('Terjadi kesalahan saat memuat data dari server.');
    }

    async function loadWorkOrders(techDbId) {
        container.innerHTML = `
            <div class="loading-chat">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading tasks...</span>
                </div>
            </div>
        `;

        const { data: wos, error: woErr } = await supabase
            .from('work_orders')
            .select(`
                *,
                customers ( name, address, phone, lat, lng ),
                installation_monitorings (*),
                master_queue_types(name, color, icon)
            `)
            .or(`status.eq.confirmed,employee_id.eq.${techDbId},claimed_by.eq.${techDbId}`)
            .order('created_at', { ascending: true });

        if (woErr) {
            showError('Gagal memuat daftar pekerjaan: ' + woErr.message);
            container.innerHTML = '';
            return;
        }

        if (!wos || wos.length === 0) {
            container.innerHTML = `
                <div class="text-center text-white-50 mt-5">
                    <i class="bi bi-check-circle fs-1 d-block mb-3 text-success opacity-50"></i>
                    <p>Tidak ada pekerjaan (Work Order) aktif yang di-assign ke Anda saat ini.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = ''; // clear loading

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

            container.appendChild(bubble);
        });
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
                const { error } = await supabase.from('work_orders').update({
                    status: 'open',
                    claimed_by: techDbId_Global,
                    claimed_at: new Date().toISOString(),
                    ket: 'Team Lead: ' + techName.innerText + (selectedTeam.length > 0 ? ' | Anggota: ' + selectedTeam.length : '')
                }).eq('id', wo.id);

                if (error) throw error;
                executionModal.hide();
                await loadWorkOrders(techDbId_Global);
            } catch (err) {
                alert('Gagal mengambil tiket: ' + err.message);
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
                    const { data: qType } = await supabase.from('master_queue_types').select('base_point').eq('id', currentExecutingWO.type_id).maybeSingle();
                    if (qType) points = qType.base_point;
                    else points = 100; // Default fallback
                }

                // Update work order
                const { error: updateErr } = await supabase
                    .from('work_orders')
                    .update({
                        status: newStatus,
                        points: points,
                        ket: notes ? notes : currentExecutingWO.ket
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
                alert('Gagal mengupdate status: ' + err.message);
            } finally {
                btnSaveExec.disabled = false;
                btnSaveExec.innerText = 'Simpan';
            }
        });
    }

    function showError(msg) {
        errorAlert.classList.remove('d-none');
        errorMessage.innerText = msg;
        container.innerHTML = '';
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
});
