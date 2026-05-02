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

    // Fetch assignments and inventory items for this WO
    const [assignmentsRes, inventoryRes] = await Promise.all([
        supabase.from('work_order_assignments').select('*, employees(name)').eq('work_order_id', wo.id),
        supabase.from('inventory_items').select('id, name, unit, unit_cost, stock').order('name')
    ]);

    const assignments = assignmentsRes.data || [];
    const inventoryItems = inventoryRes.data || [];

    if (assignmentsRes.error) {
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
                    <span class="fw-bold text-white">${a.employees?.name} <span class="badge bg-vscode-header border border-secondary ms-1">${a.assignment_role.toUpperCase()}</span></span>
                    <span class="text-info base-calc-preview" data-base="${baseCalculated}">Base: ${baseCalculated} pts</span>
                </div>
                <div class="row g-2">
                    <div class="col-6">
                        <label class="form-label small text-white-50">Bonus</label>
                        <input type="number" class="form-control form-control-sm bg-dark border-secondary text-white bonus-input" value="0" min="0">
                    </div>
                    <div class="col-6">
                        <label class="form-label small text-white-50">Potongan</label>
                        <input type="number" class="form-control form-control-sm bg-dark border-secondary text-white deduction-input" value="0" min="0">
                    </div>
                    <div class="col-12 mt-2">
                        <input type="text" class="form-control form-control-sm bg-dark border-secondary text-white reason-input" placeholder="Alasan Penyesuaian (Wajib jika ada perubahan)">
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
            <div class="alert bg-vscode border-info border-opacity-25 mb-4 shadow-sm">
                <i class="bi bi-shield-check text-info me-2"></i>
                Review hasil pekerjaan dan tentukan penyesuaian poin serta penggunaan material.
            </div>
            
            <div class="mb-4">
                <label class="form-label text-info fw-bold small text-uppercase" style="letter-spacing: 1px;">Penyesuaian Poin Tim</label>
                <div id="assignments-container">
                    ${assignmentsHtml}
                </div>
            </div>

            <!-- Inventory Usage Section (Story 2.3) -->
            <div class="mb-4">
                <label class="form-label text-info fw-bold small text-uppercase" style="letter-spacing: 1px;">Penggunaan Material (Inventaris)</label>
                <div id="inventory-usage-container" class="bg-dark bg-opacity-50 p-3 rounded-3 border border-secondary border-opacity-25 shadow-inner">
                    <div id="selected-inventory-list" class="mb-3 d-flex flex-column gap-2">
                        <div class="text-white-50 small text-center py-2" id="empty-inventory-msg">
                            <i class="bi bi-box-seam d-block mb-1 fs-4 opacity-25"></i>
                            Belum ada material yang ditambahkan.
                        </div>
                    </div>
                    <div class="row g-2 align-items-end pt-3 border-top border-secondary border-opacity-10">
                        <div class="col">
                            <label class="form-label small text-white-50">Tambah Barang</label>
                            <select id="inventory-item-select" class="form-select form-select-sm bg-dark border-secondary text-white">
                                <option value="">-- Pilih Barang --</option>
                                ${inventoryItems?.map(i => `<option value="${i.id}" data-name="${i.name}" data-unit="${i.unit}" data-cost="${i.unit_cost}">${i.name} (${i.stock} ${i.unit})</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-3">
                            <label class="form-label small text-white-50">Qty</label>
                            <input type="number" id="inventory-qty-input" class="form-control form-control-sm bg-dark border-secondary text-white" value="1" min="1">
                        </div>
                        <div class="col-auto">
                            <button type="button" class="btn btn-sm btn-info px-3" id="add-inventory-item-btn">
                                <i class="bi bi-plus-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="mt-2 d-flex justify-content-between align-items-center">
                    <span class="text-white-50 small">Snapshotted at current unit cost</span>
                    <span class="text-white-50 small">
                        Estimasi Biaya: <span class="text-info fw-bold" id="total-material-cost-preview">Rp 0</span>
                    </span>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label text-info fw-bold small text-uppercase" style="letter-spacing: 1px;">Data Tambahan (Project B)</label>
                <div class="row g-2">
                    <div class="col-6">
                        <label class="form-label small text-white-50">MAC Address</label>
                        <input type="text" id="verify-mac" class="form-control form-control-sm bg-dark border-secondary text-white" placeholder="MAC Address" value="${wo.installation_monitoring?.mac_address || ''}">
                    </div>
                    <div class="col-6">
                        <label class="form-label small text-white-50">Damping (dBm)</label>
                        <input type="text" id="verify-damping" class="form-control form-control-sm bg-dark border-secondary text-white" placeholder="Damping (dBm)" value="${wo.installation_monitoring?.damping || ''}">
                    </div>
                </div>
            </div>
        </div>
    `;

    // Local state for inventory
    const selectedInventory = new Map();

    const renderSelectedInventory = () => {
        const list = document.getElementById('selected-inventory-list');
        const emptyMsg = document.getElementById('empty-inventory-msg');
        const totalPreview = document.getElementById('total-material-cost-preview');
        
        if (selectedInventory.size === 0) {
            emptyMsg.classList.remove('d-none');
            totalPreview.textContent = 'Rp 0';
            // list.innerHTML = ''; // Keep emptyMsg
            return;
        }

        emptyMsg.classList.add('d-none');
        let html = '';
        let totalCost = 0;

        selectedInventory.forEach((item, id) => {
            const subtotal = item.qty * item.cost;
            totalCost += subtotal;
            html += `
                <div class="d-flex justify-content-between align-items-center bg-vscode p-2 rounded border border-secondary border-opacity-10">
                    <div class="flex-grow-1">
                        <div class="text-white small fw-bold">${item.name}</div>
                        <div class="text-white-50" style="font-size: 0.75rem;">${item.qty} ${item.unit} @ Rp ${item.cost.toLocaleString('id-ID')}</div>
                    </div>
                    <div class="text-end me-3">
                        <div class="text-info small fw-bold">Rp ${subtotal.toLocaleString('id-ID')}</div>
                    </div>
                    <button type="button" class="btn btn-link btn-sm text-danger p-0 remove-inventory-item" data-id="${id}">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
            `;
        });

        // We only want to replace items, not the entire list content including emptyMsg
        const existingItems = list.querySelectorAll('.bg-vscode');
        existingItems.forEach(el => el.remove());
        list.insertAdjacentHTML('beforeend', html);
        totalPreview.textContent = `Rp ${totalCost.toLocaleString('id-ID')}`;

        // Wire up remove buttons
        list.querySelectorAll('.remove-inventory-item').forEach(btn => {
            btn.onclick = () => {
                selectedInventory.delete(btn.dataset.id);
                renderSelectedInventory();
            };
        });
    };

    document.getElementById('add-inventory-item-btn').onclick = () => {
        const select = document.getElementById('inventory-item-select');
        const qtyInput = document.getElementById('inventory-qty-input');
        const id = select.value;
        const qty = parseInt(qtyInput.value) || 0;

        if (!id || qty <= 0) {
            showToast('Pilih barang dan jumlah yang valid', 'warning');
            return;
        }

        const option = select.options[select.selectedIndex];
        const name = option.dataset.name;
        const unit = option.dataset.unit;
        const cost = parseFloat(option.dataset.cost) || 0;

        if (selectedInventory.has(id)) {
            const existing = selectedInventory.get(id);
            existing.qty += qty;
        } else {
            selectedInventory.set(id, { name, unit, cost, qty });
        }

        qtyInput.value = 1;
        select.value = '';
        renderSelectedInventory();
    };

    // Live calculation logic for points
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

        // Prepare inventory used payload (Story 2.3)
        const inventoryUsed = [];
        selectedInventory.forEach((item, id) => {
            inventoryUsed.push({
                item_id: id,
                quantity: item.qty
            });
        });

        try {
            const response = await apiCall('/api/work-orders/verify', {
                method: 'POST',
                body: JSON.stringify({
                    id: wo.id,
                    adjustments,
                    inventory_used: inventoryUsed,
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
