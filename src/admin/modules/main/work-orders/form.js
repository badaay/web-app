// Modal forms for creating and editing work orders
import { supabase, apiCall } from '../../../../api/supabase.js';
import { showToast } from '../../../utils/toast.js';
import { getSpinner } from '../../../utils/ui-common.js';

/**
 * Main modal for work order creation/editing
 */
export async function showWorkOrderModal(wo) {
    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    document.getElementById('crudModalTitle').textContent = wo ? 'Edit Antrian' : 'Tambah Antrian';
    const body = document.getElementById('crudModalBody');

    if (wo) {
        // Edit mode: show full form
        await renderFullWorkOrderForm(wo);
        modal.show();
        document.getElementById('save-crud-btn').onclick = () => saveFullWorkOrder(wo.id, modal);
    } else {
        // Add mode: show type picker first
        body.innerHTML = getSpinner('Memuat Tipe Antrian...');
        modal.show();
        await showTypePickerModal(modal);
    }
}

/**
 * Show type picker grid (for adding new work order)
 */
async function showTypePickerModal(modal) {
    const { data: types, error } = await supabase.from('master_queue_types').select('*');
    if (error) {
        showToast('Error loading types', 'error');
        return;
    }

    const body = document.getElementById('crudModalBody');
    body.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Pilih Tipe Antrian</label>
            <div class="row gap-2 justify-content-center">
                ${types.map(t => `
                    <div class="col-auto">
                        <button class="btn border-2" style="min-width:120px;border-color:${t.color}!important;color:${t.color};" 
                            data-type-id="${t.id}" data-type-name="${t.name}">
                            <i class="bi ${t.icon}"></i><br><small>${t.name}</small>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    body.querySelectorAll('[data-type-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const typeId = btn.dataset.typeId;
            const typeName = btn.dataset.typeName;
            await showTypeSpecificForm(typeId, typeName, modal);
        });
    });

    // document.getElementById('save-crud-btn').style.display = 'none';
}

/**
 * Show type-specific form after picker selection
 */
async function showTypeSpecificForm(typeId, typeName, modal) {
    const body = document.getElementById('crudModalBody');
    body.innerHTML = getSpinner('Memuat Form...');

    // Fetch lookup data in parallel
    const [customersResp, employeesResp] = await Promise.all([
        supabase.from('customers').select('id, name, phone, address'),
        supabase.from('employees').select('id, name')
    ]);

    const customers = customersResp.data || [];
    const employees = employeesResp.data || [];

    const fields = getTypeFields(typeId);

    // Build form HTML
    let formHtml = `
        <form id="type-form">
            <input type="hidden" name="type_id" value="${typeId}">
            <input type="hidden" name="type_name" value="${typeName}">
            <div class="mb-3">
                <label class="form-label fw-bold">Tipe: <span style="color:var(--vscode-accent)">${typeName}</span></label>
            </div>
    `;

    // Dynamic fields per type
    if (fields.customer) {
        formHtml += `
            <div class="mb-3">
                <label class="form-label">Pilih Pelanggan *</label>
                <select class="form-select form-select-sm" name="customer_id" required>
                    <option value="">-- Pilih Pelanggan --</option>
                    ${customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('')}
                </select>
            </div>
        `;
    }

    // Package logic removed since work_orders no longer stores package_id

    if (fields.employee) {
        formHtml += `
            <div class="mb-3">
                <label class="form-label">Teknisi</label>
                <select class="form-select form-select-sm" name="employee_id">
                    <option value="">-- Pilih Teknisi --</option>
                    ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                </select>
            </div>
        `;
    }

    formHtml += `
        <div class="mb-3">
            <label class="form-label">Keterangan</label>
            <textarea class="form-control form-control-sm" name="ket" rows="2" placeholder="Catatan tambahan..."></textarea>
        </div>
        <div class="mb-3">
            <label class="form-label">Status Pembayaran</label>
            <select class="form-select form-select-sm" name="payment_status">
                <option value="pending">Pending</option>
                <option value="paid">Lunas</option>
            </select>
        </div>
    `;

    formHtml += '</form>';

    body.innerHTML = formHtml;
    document.getElementById('save-crud-btn').style.display = 'block';
    document.getElementById('save-crud-btn').onclick = () => {
        const form = document.getElementById('type-form');
        if (form.checkValidity()) {
            saveTypeSpecificWorkOrder(modal);
        } else {
            form.reportValidity();
        }
    };
}

/**
 * Determine required fields per type
 */
function getTypeFields(typeId) {
    // Map based on type ID or hardcode logic
    return {
        customer: true,      // All types need customer
        package: false,      // Removed as work_orders doesn't have package_id
        employee: false       // Optional for now
    };
}

/**
 * Save new type-specific work order
 */
async function saveTypeSpecificWorkOrder(modal) {
    const form = document.getElementById('type-form');
    const formData = new FormData(form);

    const newWO = {
        type_id: formData.get('type_id'),
        title: formData.get('type_name'),
        customer_id: formData.get('customer_id') || null,
        employee_id: formData.get('employee_id') || null,
        ket: formData.get('ket'),
        payment_status: formData.get('payment_status'),
    };

    try {
        await apiCall('/work-orders', {
            method: 'POST',
            body: JSON.stringify(newWO),
        });
        showToast('Antrian berhasil ditambahkan', 'success');
        modal.hide();
        window.location.reload();
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    }
}

/**
 * Render full editable form (for edit mode)
 */
async function renderFullWorkOrderForm(wo) {
    const [customersResp, employeesResp] = await Promise.all([
        supabase.from('customers').select('id, name, phone, address'),
        supabase.from('employees').select('id, name')
    ]);

    const customers = customersResp.data || [];
    const employees = employeesResp.data || [];

    const body = document.getElementById('crudModalBody');
    body.innerHTML = `
        <form id="edit-form">
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Judul</label>
                    <input type="text" class="form-control form-control-sm" name="title" value="${wo.title || ''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Status</label>
                    <select class="form-select form-select-sm" name="status" required>
                        <option value="waiting" ${wo.status === 'waiting' ? 'selected' : ''}>Waiting</option>
                        <option value="confirmed" ${wo.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="open" ${wo.status === 'open' ? 'selected' : ''}>Open</option>
                        <option value="closed" ${wo.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Pelanggan</label>
                    <select class="form-select form-select-sm" name="customer_id">
                        ${customers.map(c => `<option value="${c.id}" ${wo.customer_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Teknisi</label>
                    <select class="form-select form-select-sm" name="employee_id">
                        <option value="">-- Pilih --</option>
                        ${employees.map(e => `<option value="${e.id}" ${wo.employee_id === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
            </div>

            <!-- Package selection removed -> stored on customer/registration instead -->

            <div class="mb-3">
                <label class="form-label">Keterangan</label>
                <textarea class="form-control form-control-sm" name="ket" rows="2">${wo.ket || ''}</textarea>
            </div>

            <div class="mb-3">
                <label class="form-label">Status Pembayaran</label>
                <select class="form-select form-select-sm" name="payment_status">
                    <option value="pending" ${wo.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="paid" ${wo.payment_status === 'paid' ? 'selected' : ''}>Lunas</option>
                </select>
            </div>
        </form>
    `;
}

/**
 * Save full (edit mode) work order
 */
async function saveFullWorkOrder(woId, modal) {
    const form = document.getElementById('edit-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const updates = {
        title: formData.get('title'),
        status: formData.get('status'),
        customer_id: formData.get('customer_id') || null,
        employee_id: formData.get('employee_id') || null,
        ket: formData.get('ket'),
        payment_status: formData.get('payment_status'),
    };

    try {
        await apiCall(`/work-orders/${woId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
        showToast('Antrian berhasil diperbarui', 'success');
        modal.hide();
        window.location.reload();
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    }
}
