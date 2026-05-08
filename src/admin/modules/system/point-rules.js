/**
 * Point Rules Module
 * Manages point_conversion_rules table
 */
import { supabase } from '../../../api/supabase.js';
import { showToast } from '../../utils/toast.js';
import { initCurrencyMask } from '../../utils/masking.js';

export async function initPointRules() {
    const container = document.getElementById('point-rules-content');
    if (!container) return;

    renderPointRules(container);
}

async function renderPointRules(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="text-white mb-0"><i class="bi bi-star-fill text-warning me-2"></i>Daftar Aturan Point</h5>
            <button class="btn btn-primary btn-sm" id="add-point-rule-btn">
                <i class="bi bi-plus-lg me-1"></i> Tambah Aturan
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-dark table-hover align-middle border-secondary">
                <thead class="table-vscode-header">
                    <tr>
                        <th>Nama Aturan</th>
                        <th>Tipe</th>
                        <th>Metrik Pemicu</th>
                        <th>Unit</th>
                        <th>Nominal (IDR)</th>
                        <th class="text-end">Aksi</th>
                    </tr>
                </thead>
                <tbody id="point-rules-table-body">
                    <tr><td colspan="6" class="text-center py-4">Memuat data...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    fetchAndPopulateRules();

    document.getElementById('add-point-rule-btn').onclick = () => showRuleModal();
}

async function fetchAndPopulateRules() {
    const tbody = document.getElementById('point-rules-table-body');
    
    try {
        const response = await fetch('/api/admin/point-rules');
        const rules = await response.json();

        if (!response.ok) throw new Error(rules.message || 'Gagal mengambil data');

        if (rules.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-white-50">Belum ada aturan point.</td></tr>';
            return;
        }

        tbody.innerHTML = rules.map(rule => `
            <tr>
                <td>
                    <div class="fw-bold text-white">${rule.rule_name}</div>
                    <small class="text-white-50">${rule.is_multiplier ? 'Berlaku kelipatan' : 'Sekali pemicu'}</small>
                </td>
                <td>
                    <span class="badge ${rule.rule_type === 'addition' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2 py-1">
                        ${rule.rule_type === 'addition' ? 'Bonus' : 'Potongan'}
                    </span>
                </td>
                <td><code>${rule.trigger_metric}</code></td>
                <td>${rule.trigger_unit}</td>
                <td class="font-monospace text-accent">Rp ${rule.amount_per_unit.toLocaleString('id-ID')}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info me-1 edit-rule-btn" data-id="${rule.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-rule-btn" data-id="${rule.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Attach events
        tbody.querySelectorAll('.edit-rule-btn').forEach(btn => {
            btn.onclick = () => showRuleModal(rules.find(r => r.id === btn.dataset.id));
        });

        tbody.querySelectorAll('.delete-rule-btn').forEach(btn => {
            btn.onclick = () => deleteRule(btn.dataset.id);
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Error: ${err.message}</td></tr>`;
    }
}

function showRuleModal(rule = null) {
    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody = document.getElementById('crudModalBody');
    const saveBtn = document.getElementById('save-crud-btn');

    modalTitle.innerText = rule ? 'Edit Aturan Point' : 'Tambah Aturan Point';
    modalBody.innerHTML = `
        <form id="point-rule-form">
            <input type="hidden" name="id" value="${rule?.id || ''}">
            <div class="row g-3">
                <div class="col-md-12">
                    <label class="form-label small text-white-50">Nama Aturan</label>
                    <input type="text" name="rule_name" class="form-control bg-vscode-input border-secondary text-white" 
                           value="${rule?.rule_name || ''}" placeholder="Contoh: Potongan Terlambat 15 Menit" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label small text-white-50">Tipe</label>
                    <select name="rule_type" class="form-select bg-vscode-input border-secondary text-white" required>
                        <option value="deduction" ${rule?.rule_type === 'deduction' ? 'selected' : ''}>Potongan (Deduction)</option>
                        <option value="addition" ${rule?.rule_type === 'addition' ? 'selected' : ''}>Bonus (Addition)</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label small text-white-50">Metrik Pemicu</label>
                    <select name="trigger_metric" class="form-select bg-vscode-input border-secondary text-white" required>
                        <option value="minutes_late" ${rule?.trigger_metric === 'minutes_late' ? 'selected' : ''}>Menit Terlambat (minutes_late)</option>
                        <option value="points_shortage" ${rule?.trigger_metric === 'points_shortage' ? 'selected' : ''}>Kekurangan Poin (points_shortage)</option>
                        <option value="points_earned" ${rule?.trigger_metric === 'points_earned' ? 'selected' : ''}>Poin Diperoleh (points_earned)</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label small text-white-50">Unit Pemicu</label>
                    <input type="number" name="trigger_unit" class="form-control bg-vscode-input border-secondary text-white" 
                           value="${rule?.trigger_unit || 1}" required>
                    <div class="form-text small text-white-50">Contoh: 15 (menit) atau 100 (poin)</div>
                </div>
                <div class="col-md-6">
                    <label class="form-label small text-white-50">Nominal per Unit (IDR)</label>
                    <input type="text" name="amount_per_unit" id="amount-per-unit" class="form-control bg-vscode-input border-secondary text-white currency-mask" 
                           value="${rule?.amount_per_unit || 0}" required>
                </div>
                <div class="col-md-12">
                    <div class="form-check form-switch mt-2">
                        <input class="form-check-input" type="checkbox" name="is_multiplier" id="isMultiplierCheck" 
                               ${rule?.is_multiplier !== false ? 'checked' : ''}>
                        <label class="form-check-label text-white-50" for="isMultiplierCheck">Berlaku Kelipatan (Multiplier)</label>
                    </div>
                </div>
            </div>
        </form>
    `;

    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    modal.show();
    initCurrencyMask('.currency-mask');

    saveBtn.onclick = async () => {
        const formData = new FormData(document.getElementById('point-rule-form'));
        const data = Object.fromEntries(formData.entries());
        data.is_multiplier = document.getElementById('isMultiplierCheck').checked;
        data.trigger_unit = parseInt(data.trigger_unit);
        data.amount_per_unit = document.getElementById('amount-per-unit').rawValue;

        setBtnLoading(saveBtn, true);
        try {
            const response = await fetch('/api/admin/point-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Gagal menyimpan');
            }

            showToast('success', 'Aturan point berhasil disimpan');
            modal.hide();
            fetchAndPopulateRules();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setBtnLoading(saveBtn, false);
        }
    };
}

async function deleteRule(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus aturan ini?')) return;

    try {
        const response = await fetch(`/api/admin/point-rules?id=${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Gagal menghapus');
        }

        showToast('success', 'Aturan berhasil dihapus');
        fetchAndPopulateRules();
    } catch (err) {
        showToast('error', err.message);
    }
}
