import { supabase, apiCall, supabaseB } from '../../../api/supabase.js';
import { showToast } from '../../utils/toast.js';

let _currentPeriod = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
};
let _statusFilter = 'unpaid';

export async function initBilling() {
    const root = document.getElementById('billing-module-root');
    if (!root) return;

    renderBaseLayout(root);
    await loadBillingData();
}

function renderBaseLayout(root) {
    root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="text-white mb-0"><i class="bi bi-receipt-cutoff text-primary me-2"></i>Layanan & Tagihan</h5>
        <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" id="billing-generate-btn">
                <i class="bi bi-magic me-1"></i> Generate Tagihan
            </button>
            <button class="btn btn-primary btn-sm" id="billing-refresh-btn">
                <i class="bi bi-arrow-clockwise"></i>
            </button>
        </div>
    </div>

    <!-- Summary Cards -->
        <div class="col-md-3">
            <div class="card bg-dark border-secondary p-3 shadow-sm border-start border-4 border-danger">
                <small class="text-white-50">Overdue (Terlambat)</small>
                <h4 class="text-danger mb-0" id="stat-overdue">—</h4>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-dark border-secondary p-3">
                <small class="text-white-50">Total Unpaid</small>
                <h4 class="text-warning mb-0" id="stat-unpaid">—</h4>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-dark border-secondary p-3">
                <small class="text-white-50">Total Paid (Bulan Ini)</small>
                <h4 class="text-success mb-0" id="stat-paid">—</h4>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-dark border-secondary p-3">
                <small class="text-white-50 text-truncate d-block">Periode</small>
                <h4 class="text-info mb-0" id="stat-period" style="font-size: 1.1rem">${getPeriodName(_currentPeriod.month, _currentPeriod.year)}</h4>
            </div>
        </div>
    </div>

    <!-- Filters & Table -->
    <div class="card bg-vscode border-secondary shadow-sm">
        <div class="card-header border-secondary bg-transparent py-3">
            <div class="row g-2 align-items-center">
                <div class="col-md-3">
                    <select class="form-select form-select-sm bg-dark text-white border-secondary" id="filter-status">
                        <option value="unpaid" selected>Belum Lunas</option>
                        <option value="paid">Lunas</option>
                        <option value="cancelled">Dibatalkan</option>
                        <option value="all">Semua Status</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <div class="input-group input-group-sm">
                        <select class="form-select bg-dark text-white border-secondary" id="filter-month">
                            ${Array.from({length: 12}, (_, i) => `<option value="${i+1}" ${_currentPeriod.month === i+1 ? 'selected' : ''}>${getPeriodName(i+1)}</option>`).join('')}
                        </select>
                        <input type="number" class="form-control bg-dark text-white border-secondary" id="filter-year" value="${_currentPeriod.year}" style="max-width: 80px;">
                    </div>
                </div>
                <div class="col-md-4 ms-auto">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-dark border-secondary text-white-50"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control bg-dark text-white border-secondary" id="search-billing" placeholder="Cari nama atau kode...">
                    </div>
                </div>
            </div>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle mb-0">
                    <thead>
                        <tr class="text-white-50 small border-secondary">
                            <th>Pelanggan</th>
                            <th>Paket</th>
                            <th>Jatuh Tempo</th>
                            <th>Jumlah</th>
                            <th>Status</th>
                            <th>Metode</th>
                            <th class="text-end">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="billing-table-body" class="small">
                        <tr><td colspan="7" class="text-center py-5 text-white-50">Memuat data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;

    // Bind events
    document.getElementById('billing-refresh-btn').onclick = loadBillingData;
    document.getElementById('filter-status').onchange = (e) => { _statusFilter = e.target.value; loadBillingData(); };
    document.getElementById('filter-month').onchange = (e) => { _currentPeriod.month = parseInt(e.target.value); loadBillingData(); };
    document.getElementById('filter-year').onchange = (e) => { _currentPeriod.year = parseInt(e.target.value); loadBillingData(); };
    document.getElementById('billing-generate-btn').onclick = showGenerateModal;

    const searchInput = document.getElementById('search-billing');
    let timeout = null;
    searchInput.oninput = () => {
        clearTimeout(timeout);
        timeout = setTimeout(loadBillingData, 500);
    };
}

async function loadBillingData() {
    const tbody = document.getElementById('billing-table-body');
    const search = document.getElementById('search-billing').value;
    
    // Show Loading
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2 text-white-50">Memuat data tagihan...</div>
    </td></tr>`;
    
    // Update period display
    const periodDisplay = document.getElementById('stat-period');
    if (periodDisplay) periodDisplay.innerText = getPeriodName(_currentPeriod.month, _currentPeriod.year);

    try {
        const params = new URLSearchParams({
            period_month: _currentPeriod.month,
            period_year: _currentPeriod.year,
            limit: 100
        });
        if (_statusFilter !== 'all') params.append('status', _statusFilter);
        if (search) params.append('search', search);

        const res = await apiCall(`/bills?${params}`);
        const bills = res.data || [];

        const today = new Date().toISOString().split('T')[0];
        
        // Update Stats
        const unpaidBills = bills.filter(b => b.status === 'unpaid');
        const overdueBills = unpaidBills.filter(b => b.due_date && today >= b.due_date);
        const paidTotal = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + parseFloat(b.amount), 0);
        
        document.getElementById('stat-overdue').innerText = overdueBills.length;
        document.getElementById('stat-unpaid').innerText = unpaidBills.length;
        document.getElementById('stat-paid').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(paidTotal).replace(',00', '');

        if (bills.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-white-50">Tidak ada tagihan ditemukan.</td></tr>`;
            return;
        }

        tbody.innerHTML = bills.map(bill => {
            const isOverdue = bill.status === 'unpaid' && bill.due_date && today >= bill.due_date;
            
            // WA Button logic
            let waBtnClass = 'btn-outline-secondary';
            let waIcon = 'bi-whatsapp';
            let waTitle = 'Kirim Notifikasi';
            
            if (bill.status === 'paid') {
                waBtnClass = 'btn-outline-success';
                waTitle = 'Kirim Bukti Bayar (WhatsApp)';
            } else if (isOverdue) {
                waBtnClass = 'btn-danger';
                waIcon = 'bi-exclamation-triangle-fill';
                waTitle = 'Kirim Peringatan Terlambat (Warning!)';
            } else {
                waBtnClass = 'btn-warning';
                waIcon = 'bi-clock-history';
                waTitle = 'Kirim Pengingat Layanan (Bakal Putus)';
            }

            return `
            <tr>
                <td>
                    <div class="fw-bold text-white">${bill.customers?.name || 'Unknown'}</div>
                    <div class="text-white-50 x-small">${bill.customers?.customer_code || '—'}</div>
                </td>
                <td><span class="badge bg-secondary opacity-75">${bill.customers?.packet || '—'}</span></td>
                <td>
                    <div class="${isOverdue ? 'text-danger fw-bold' : 'text-white-50'}">
                        ${bill.due_date ? new Date(bill.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—'}
                    </div>
                </td>
                <td class="fw-bold">${new Intl.NumberFormat('id-ID').format(bill.amount)}</td>
                <td>${statusBadge(bill.status)}</td>
                <td><span class="text-white-50 small">${bill.payment_method || '—'}</span></td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        ${bill.status === 'unpaid' ? `
                            <button class="btn btn-success mark-paid-btn" data-id="${bill.id}" title="Mark Paid">
                                <i class="bi bi-check-circle"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-outline-info view-invoice-btn" data-token="${bill.secret_token}" title="View Invoice">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn ${waBtnClass} resend-wa-btn" data-id="${bill.id}" title="${waTitle}">
                            <i class="bi ${waIcon}"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        // Bind Row Actions
        tbody.querySelectorAll('.mark-paid-btn').forEach(btn => {
            btn.onclick = () => showMarkPaidModal(bills.find(b => b.id === btn.dataset.id));
        });
        tbody.querySelectorAll('.view-invoice-btn').forEach(btn => {
            btn.onclick = () => window.open(`/invoice.html?token=${btn.dataset.token}`, '_blank');
        });
        tbody.querySelectorAll('.resend-wa-btn').forEach(btn => {
            btn.onclick = () => resendWhatsApp(btn.dataset.id);
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-danger">Gagal memuat data: ${err.message}</td></tr>`;
    }
}

function showGenerateModal() {
    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    document.getElementById('crudModalTitle').innerText = 'Generate Tagihan Bulanan';
    
    document.getElementById('crudModalBody').innerHTML = `
        <div class="alert alert-info small bg-vscode border-info text-white-50">
            <i class="bi bi-info-circle me-2"></i>
            Data tagihan akan dibuat secara otomatis untuk seluruh pelanggan aktif berdasarkan paket layanan masing-masing.
        </div>
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label text-white-50 small">Bulan</label>
                <select id="gen-month" class="form-select bg-dark text-white border-secondary">
                    ${Array.from({length: 12}, (_, i) => `<option value="${i+1}" ${new Date().getMonth() + 1 === i+1 ? 'selected' : ''}>${getPeriodName(i+1)}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-6">
                <label class="form-label text-white-50 small">Tahun</label>
                <input type="number" id="gen-year" class="form-control bg-dark text-white border-secondary" value="${new Date().getFullYear()}">
            </div>
            <div class="col-12 mt-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="gen-overwrite" checked>
                    <label class="form-check-label text-white-50 small" for="gen-overwrite">
                        Update nilai tagihan jika sudah ada (Upsert)
                    </label>
                </div>
            </div>
        </div>
    `;

    document.getElementById('save-crud-btn').onclick = async () => {
        const btn = document.getElementById('save-crud-btn');
        const month = document.getElementById('gen-month').value;
        const year = document.getElementById('gen-year').value;
        const overwrite = document.getElementById('gen-overwrite').checked;

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';

        try {
            const res = await apiCall('/bills/generate', {
                method: 'POST',
                body: JSON.stringify({ period_month: month, period_year: year, overwrite })
            });
            showToast('success', res.message);
            modal.hide();
            loadBillingData();
        } catch (err) {
            showToast('error', 'Gagal generate: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = 'Generate';
        }
    };

    modal.show();
}

async function showMarkPaidModal(bill) {
    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    document.getElementById('crudModalTitle').innerText = 'Konfirmasi Pembayaran';
    
    // Fetch bank accounts for selection
    let banks = [];
    try {
        banks = await apiCall('/bank-accounts');
    } catch (err) {
        console.error('Failed to load banks for billing:', err);
    }

    document.getElementById('crudModalBody').innerHTML = `
        <div class="p-3 rounded bg-dark border-secondary mb-3">
            <div class="row g-2">
                <div class="col-6">
                    <small class="text-white-50 d-block">Pelanggan</small>
                    <span class="text-white fw-bold">${bill.customers.name}</span>
                </div>
                <div class="col-6">
                    <small class="text-white-50 d-block">Bulan Tagihan</small>
                    <span class="text-white">${fmtPeriod(bill.period_date)}</span>
                </div>
                <div class="col-12 mt-2">
                    <small class="text-white-50 d-block">Total Bayar</small>
                    <h3 class="text-accent mb-0">Rp ${new Intl.NumberFormat('id-ID').format(bill.amount)}</h3>
                </div>
            </div>
        </div>
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label text-white-50 small">Metode Bayar</label>
                <select id="pay-method" class="form-select bg-dark text-white border-secondary">
                    <option value="transfer">Transfer Bank (TF)</option>
                    <option value="cash">Tunai / Cash</option>
                </select>
            </div>
            <div class="col-md-6">
                <label class="form-label text-white-50 small">Rekening / Akun</label>
                <select id="pay-bank-id" class="form-select bg-dark text-white border-secondary">
                    <option value="">-- Automatis --</option>
                    ${banks.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-12">
                <label class="form-label text-white-50 small">Catatan (Opsional)</label>
                <textarea id="pay-notes" class="form-control bg-dark text-white border-secondary" rows="2" placeholder="Contoh: BCA a/n Budi..."></textarea>
            </div>
        </div>
        <div class="alert alert-warning small bg-vscode border-warning text-warning-emphasis mt-3 mb-0">
            <i class="bi bi-whatsapp me-2"></i>
            Setelah dikonfirmasi, sistem akan mengirimkan notifikasi link invoice ke nomor WhatsApp pelanggan.
        </div>
    `;

    document.getElementById('save-crud-btn').onclick = async () => {
        const btn = document.getElementById('save-crud-btn');
        const method = document.getElementById('pay-method').value;
        const bank_account_id = document.getElementById('pay-bank-id').value;
        const notes = document.getElementById('pay-notes').value;

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Memproses...';

        try {
            await apiCall('/bills/mark-paid', {
                method: 'PATCH',
                body: JSON.stringify({ 
                    bill_id: bill.id, 
                    payment_method: method, 
                    bank_account_id: bank_account_id || undefined, 
                    notes 
                })
            });
            showToast('success', 'Pembayaran berhasil dikonfirmasi ✅');
            modal.hide();
            loadBillingData();
        } catch (err) {
            showToast('error', 'Gagal konfirmasi: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = 'Konfirmasi Bayar';
        }
    };

    modal.show();
}

async function resendWhatsApp(billId) {
    if (!confirm('Kirim ulang notifikasi WhatsApp ke pelanggan?')) return;

    showToast('info', 'Sedang mengirim ulang...');
    try {
        const res = await apiCall('/bills/resend-wa', {
            method: 'POST',
            body: JSON.stringify({ bill_id: billId })
        });
        showToast('success', res.message);
    } catch (err) {
        showToast('error', 'Gagal kirim ulang: ' + err.message);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodName(m, y = '') {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[m-1]}${y ? ' ' + y : ''}`;
}

function fmtPeriod(isoDate) {
    const d = new Date(isoDate);
    return getPeriodName(d.getMonth() + 1, d.getFullYear());
}

function statusBadge(s) {
    const maps = {
        unpaid: { label: 'Belum Bayar', class: 'bg-danger' },
        paid: { label: 'Sudah Lunas', class: 'bg-success' },
        cancelled: { label: 'Dibatalkan', class: 'bg-secondary' }
    };
    const cfg = maps[s] || { label: s, class: 'bg-dark' };
    return `<span class="badge ${cfg.class} bg-opacity-75">${cfg.label}</span>`;
}

function fmt(isoStr) {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}
