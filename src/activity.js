import { supabase } from './api/supabase.js';

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
    
    let currentExecutingWO = null;
    let currentPhotoBase64 = null;

    // Refresh & PWA Install
    const btnRefresh = document.getElementById('btn-refresh');
    const btnInstall = document.getElementById('btn-install');

    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            if (techId.innerText && techId.innerText !== 'ID TKN') {
                const dbIdResult = await supabase.from('employees').select('id').eq('employee_id', techId.innerText).single();
                if (dbIdResult.data) {
                    await loadWorkOrders(dbIdResult.data.id);
                }
            }
        });
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can add to home screen
        if (btnInstall) btnInstall.classList.remove('d-none');
    });

    if (btnInstall) {
        btnInstall.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    btnInstall.classList.add('d-none');
                }
                deferredPrompt = null;
            }
        });
    }

    // Handle Photo Upload Preview
    if (execPhoto) {
        execPhoto.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
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

    // 1. Get employeeID and shortGenerated from URL
    // URL pattern is /web-app/{employeeid}/activity?shortGenerated=securitycode
    const pathParts = window.location.pathname.split('/');
    // Example: ["", "web-app", "TKN-001", "activity"] -> length could vary based on base url
    const activityIndex = pathParts.findIndex(p => p === 'activity' || p === 'activity.html');
    
    let employeeId = null;
    if (activityIndex > 0) {
        employeeId = pathParts[activityIndex - 1];
    }
    
    // Fallback if not mapped properly via Vite rewrite: check URLSearchParams
    const urlParams = new URLSearchParams(window.location.search);
    const securityCode = urlParams.get('shortGenerated');
    
    if (!employeeId) {
        showError('Format URL tidak valid. ID Teknisi tidak ditemukan di URL.');
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
                installation_monitorings (*)
            `)
            .eq('employee_id', techDbId)
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
            
            let mapLinkHtml = '';
            if (customerLat && customerLng) {
                mapLinkHtml = `<a href="https://www.google.com/maps/search/?api=1&query=${customerLat},${customerLng}" target="_blank" class="badge bg-success text-decoration-none ms-1"><i class="bi bi-geo-alt-fill"></i> Map</a>`;
            }
            
            // Format time
            const date = new Date(wo.created_at);
            const timeString = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

            const statusBadgeColor = getStatusColor(wo.status);

            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble';
            bubble.innerHTML = `
                <div class="chat-header">
                    <span><i class="bi bi-clock"></i> ${dateString} ${timeString}</span>
                    <span class="badge bg-${statusBadgeColor}">${wo.status}</span>
                </div>
                <div class="chat-title">${wo.title}</div>
                <div class="chat-detail mb-2">
                    <i class="bi bi-person text-white-50 me-1"></i> ${customerName}<br>
                    <i class="bi bi-geo-alt text-white-50 me-1"></i> ${customerAddress} ${mapLinkHtml}
                </div>
                ${wo.description ? `<div class="p-2 bg-dark bg-opacity-50 rounded text-white-50 small mb-2">${wo.description}</div>` : ''}
                
                ${wo.status !== 'Selesai' ? `
                <button class="btn btn-primary btn-sm btn-eksekusi fw-bold" data-target="${wo.id}">
                    <i class="bi bi-play-fill text-white"></i> Eksekusi
                </button>
                ` : `
                <button class="btn btn-outline-secondary btn-sm btn-eksekusi fw-bold" disabled>
                    <i class="bi bi-check2-all"></i> Selesai
                </button>
                `}
            `;

            const btn = bubble.querySelector('.btn-eksekusi:not([disabled])');
            if (btn) {
                btn.addEventListener('click', () => openExecutionModal(wo));
            }

            container.appendChild(bubble);
        });
    }

    function openExecutionModal(wo) {
        if(!executionModal) return;
        currentExecutingWO = wo;
        
        // Reset form
        execNotes.value = wo.ket || '';
        execStatus.value = wo.status === 'Selesai' ? 'Selesai' : 'Pending';
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
            execActualDate.value = new Date().toISOString().split('T')[0];
            execActivationDate.value = new Date().toISOString().split('T')[0];
        }

        executionModal.show();
    }

    if(btnSaveExec) {
        btnSaveExec.addEventListener('click', async () => {
            if (!currentExecutingWO) return;

            const newStatus = execStatus.value;
            const notes = execNotes.value;

            btnSaveExec.disabled = true;
            btnSaveExec.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Menyimpan...`;

            try {
                // Update work order
                const { error: updateErr } = await supabase
                    .from('work_orders')
                    .update({ 
                        status: newStatus,
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
                // Reload list
                const techDbId = currentExecutingWO.employee_id;
                await loadWorkOrders(techDbId);

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
        if (s.includes('pending') || s.includes('antrian')) return 'warning';
        if (s.includes('selesai')) return 'success';
        if (s.includes('proses')) return 'info';
        if (s.includes('cancel')) return 'danger';
        return 'secondary';
    }
});
