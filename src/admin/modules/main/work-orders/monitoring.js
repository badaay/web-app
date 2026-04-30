import { supabase, supabaseB, getStorageUrl, apiCall } from '../../../../api/supabase.js';
import { showToast } from '../../../utils/toast.js';
import { getSpinner } from '../../../utils/ui-common.js';
import { compressImage } from '../../../utils/image-utils.js';

/**
 * Show installation monitoring modal with photo upload
 */
export async function showInstallationMonitoringModal(wo, onSave) {
    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    document.getElementById('crudModalTitle').textContent = `Pantau Instalasi - ${wo.customers?.name || 'Customer'}`;
    const body = document.getElementById('crudModalBody');

    body.innerHTML = getSpinner('Memuat Data Monitoring...');
    modal.show();

    // Fetch existing monitoring data
    const { data: monitoring, error: monError } = await supabase
        .from('installation_monitorings')
        .select('*')
        .eq('work_order_id', wo.id)
        .single();

    if (monError && monError.code !== 'PGRST116') {
        showToast('Error loading monitoring data', 'error');
        modal.hide();
        return;
    }

    // Build monitoring form
    const monData = monitoring || {};
    body.innerHTML = `
        <form id="monitoring-form">
            <div class="mb-3">
                <label class="form-label">Status Instalasi</label>
                <select class="form-select form-select-sm" name="status" required>
                    <option value="not_started" ${monData.status === 'not_started' ? 'selected' : ''}>Belum Dimulai</option>
                    <option value="in_progress" ${monData.status === 'in_progress' ? 'selected' : ''}>Sedang Berlangsung</option>
                    <option value="completed" ${monData.status === 'completed' ? 'selected' : ''}>Selesai</option>
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label">Catatan Teknis</label>
                <textarea class="form-control form-control-sm" name="notes" rows="3" placeholder="Catatan dari lapangan...">${monData.notes || ''}</textarea>
            </div>

            <div class="mb-3">
                <label class="form-label">Foto Instalasi</label>
                <input type="file" class="form-control form-control-sm" id="monitor-photo-input" accept="image/*" multiple>
                <small class="text-muted d-block mt-2">Upload foto instalasi (ukuran max per file: 5MB)</small>
            </div>

            <div id="photo-preview" class="row gap-2 mt-2"></div>

            <input type="hidden" name="work_order_id" value="${wo.id}">
        </form>
    `;

    // Setup photo input handler
    const photoInput = document.getElementById('monitor-photo-input');
    const photoPreview = document.getElementById('photo-preview');

    // Show existing photos if any
    if (monData.photos && Array.from(monData.photos).length > 0) {
        monData.photos.forEach(pathOrUrl => {
            const thumb = document.createElement('div');
            thumb.className = 'col-auto';
            thumb.innerHTML = `
                <div class="position-relative" style="width:80px;height:80px;border-radius:4px;overflow:hidden;border:1px solid #444;">
                    <img src="${pathOrUrl}" style="width:100%;height:100%;object-fit:cover;" class="wo-photo-item">
                </div>
            `;
            photoPreview.appendChild(thumb);
            
            // If it's a path, resolve it
            if (!pathOrUrl.startsWith('http')) {
                getStorageUrl(pathOrUrl, 'proof_of_work', false).then(url => {
                    thumb.querySelector('img').src = url;
                });
            }
        });
    }

    photoInput.addEventListener('change', (e) => {
        // We additive-ly show previews for new files
        Array.from(e.target.files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) { // Increased limit for compression
                showToast(`${file.name} terlalu besar (max 10MB)`, 'warning');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const thumb = document.createElement('div');
                thumb.className = 'col-auto new-photo-preview';
                thumb.innerHTML = `
                    <div style="width:80px;height:80px;border-radius:4px;overflow:hidden;border:1px solid #0d6efd;">
                        <img src="${event.target.result}" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                `;
                photoPreview.appendChild(thumb);
            };
            reader.readAsDataURL(file);
        });
    });

    // Wire up save button
    document.getElementById('save-crud-btn').style.display = 'block';
    document.getElementById('save-crud-btn').onclick = async () => {
        await saveInstallationMonitoring(wo.id, monData, photoInput.files, onSave, modal);
    };
}

/**
 * Save installation monitoring data and photos
 */
async function saveInstallationMonitoring(woId, monData, photoFiles, onSave, modal) {
    const form = document.getElementById('monitoring-form');
    const formData = new FormData(form);
    const monitoringId = monData?.id;
    const saveBtn = document.getElementById('save-crud-btn');

    const photoUrls = monData?.photos ? [...monData.photos] : [];

    // Compress and upload new photos
    if (photoFiles && photoFiles.length > 0) {
        if (!supabaseB) throw new Error('Konfigurasi Storage Project B tidak tersedia.');

        for (let i = 0; i < photoFiles.length; i++) {
            const file = photoFiles[i];
            const fileName = `wo_${woId}_${Date.now()}_${i}.jpg`;
            
            saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Kompresi ${i+1}/${photoFiles.length}...`;
            const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
            
            saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Upload ${i+1}/${photoFiles.length}...`;
            const { data, error } = await supabaseB.storage
                .from('proof_of_work')
                .upload(`monitoring/${fileName}`, compressed);
            
            if (error) {
                showToast(`Gagal upload foto: ${error.message}`, 'error');
                continue;
            }

            const { data: { publicUrl } } = supabaseB.storage
                .from('proof_of_work')
                .getPublicUrl(data.path);
            
            photoUrls.push(publicUrl);
        }
    }

    const updateData = {
        work_order_id: woId,
        status: formData.get('status'),
        notes: formData.get('notes'),
        photos: photoUrls.length > 0 ? photoUrls : null,
        updated_at: new Date().toISOString()
    };

    if (monitoringId) {
        // Update existing
        const { error } = await supabase
            .from('installation_monitorings')
            .update(updateData)
            .eq('id', monitoringId);

        if (error) {
            showToast(`Error: ${error.message}`, 'error');
            return;
        }
    } else {
        // Insert new
        const { error } = await supabase
            .from('installation_monitorings')
            .insert(updateData);

        if (error) {
            showToast(`Error: ${error.message}`, 'error');
            return;
        }
    }

    showToast('Data monitoring berhasil disimpan', 'success');
    modal.hide();
    if (onSave) onSave();
}

/**
 * Convert file to base64 DataURL
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Show verification modal for completed work orders (Story 1.1 + 1.2)
 * Includes point adjustment logic.
 */
export async function showVerificationModal(wo, onSave) {
    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    document.getElementById('crudModalTitle').textContent = `Verifikasi Pekerjaan - ${wo.customers?.name || 'Customer'}`;
    const body = document.getElementById('crudModalBody');

    body.innerHTML = getSpinner('Memuat Detail Pekerjaan...');
    modal.show();

    // Fetch assignments for this WO
    const { data: assignments, error } = await supabase
        .from('work_order_assignments')
        .select('*, employees(name)')
        .eq('work_order_id', wo.id);

    if (error) {
        showToast('Error loading assignments', 'error');
        modal.hide();
        return;
    }

    const basePoints = wo.master_queue_types?.base_point || 0;

    let assignmentsHtml = '';
    assignments.forEach(a => {
        const baseCalculated = a.assignment_role === 'lead' ? basePoints : Math.floor(basePoints * 0.7);
        assignmentsHtml += `
            <div class="assignment-row border-bottom border-secondary pb-3 mb-3" data-employee-id="${a.employee_id}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-bold">${a.employees?.name} <span class="badge bg-secondary ms-1">${a.assignment_role.toUpperCase()}</span></span>
                    <span class="text-info base-calc-preview" data-base="${baseCalculated}">Base: ${baseCalculated} pts</span>
                </div>
                <div class="row g-2">
                    <div class="col-6">
                        <label class="form-label small">Bonus</label>
                        <input type="number" class="form-control form-control-sm bonus-input" value="0" min="0">
                    </div>
                    <div class="col-6">
                        <label class="form-label small">Potongan</label>
                        <input type="number" class="form-control form-control-sm deduction-input" value="0" min="0">
                    </div>
                    <div class="col-12 mt-2">
                        <input type="text" class="form-control form-control-sm reason-input" placeholder="Alasan Penyesuaian (Wajib jika ada perubahan)">
                    </div>
                </div>
                <div class="mt-2 text-end fw-bold text-success final-calc-preview">
                    Total: ${baseCalculated} pts
                </div>
            </div>
        `;
    });

    body.innerHTML = `
        <div id="verification-form">
            <div class="alert alert-dark border-info mb-4">
                <i class="bi bi-info-circle me-2"></i>
                Review hasil pekerjaan dan tentukan penyesuaian poin jika diperlukan.
            </div>
            
            <div class="mb-4">
                <label class="form-label text-info">Penyesuaian Poin Tim</label>
                <div id="assignments-container">
                    ${assignmentsHtml}
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Data Tambahan (Project B)</label>
                <div class="row g-2">
                    <div class="col-6">
                        <input type="text" id="verify-mac" class="form-control form-control-sm" placeholder="MAC Address" value="${wo.installation_monitoring?.mac_address || ''}">
                    </div>
                    <div class="col-6">
                        <input type="text" id="verify-damping" class="form-control form-control-sm" placeholder="Damping (dBm)" value="${wo.installation_monitoring?.damping || ''}">
                    </div>
                </div>
            </div>
        </div>
    `;

    // Live calculation logic
    const updateCalculations = () => {
        document.querySelectorAll('.assignment-row').forEach(row => {
            const base = parseInt(row.querySelector('.base-calc-preview').dataset.base);
            const bonus = parseInt(row.querySelector('.bonus-input').value) || 0;
            const deduction = parseInt(row.querySelector('.deduction-input').value) || 0;
            const final = Math.max(0, base + bonus - deduction);
            row.querySelector('.final-calc-preview').textContent = `Total: ${final} pts`;
        });
    };

    body.addEventListener('input', (e) => {
        if (e.target.classList.contains('bonus-input') || e.target.classList.contains('deduction-input')) {
            updateCalculations();
        }
    });

    // Wire up save button
    const saveBtn = document.getElementById('save-crud-btn');
    saveBtn.style.display = 'block';
    saveBtn.textContent = 'Verifikasi & Tutup';
    saveBtn.onclick = async () => {
        const adjustments = [];
        let validationError = null;

        document.querySelectorAll('.assignment-row').forEach(row => {
            const employeeId = row.dataset.employeeId;
            const bonus = parseInt(row.querySelector('.bonus-input').value) || 0;
            const deduction = parseInt(row.querySelector('.deduction-input').value) || 0;
            const reason = row.querySelector('.reason-input').value.trim();

            if ((bonus !== 0 || deduction !== 0) && !reason) {
                validationError = `Alasan penyesuaian wajib diisi untuk ${row.querySelector('.fw-bold').textContent}`;
            }

            adjustments.push({
                employee_id: employeeId,
                bonus_points: bonus,
                deduction_points: deduction,
                adjustment_reason: reason
            });
        });

        if (validationError) {
            showToast(validationError, 'warning');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';

        try {
            const response = await apiCall('/api/work-orders/verify', {
                method: 'POST',
                body: JSON.stringify({
                    id: wo.id,
                    adjustments,
                    closeData: {
                        mac_address: document.getElementById('verify-mac').value,
                        damping: document.getElementById('verify-damping').value
                    }
                })
            });

            if (response.error) throw new Error(response.error);

            showToast('Pekerjaan berhasil diverifikasi dan ditutup', 'success');
            modal.hide();
            if (onSave) onSave();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Verifikasi & Tutup';
        }
    };
}
