import { supabase, apiCall } from '../../../api/supabase.js';
import { showToast } from '../../utils/toast.js';

let currentBankAccounts = [];

export async function initFinance() {
    const container = document.getElementById('finance-content');
    if (!container) return;

    // 1. Initial UI Structure
    container.innerHTML = `
        <div class="finance-module-header d-flex justify-content-between align-items-center mb-4 mt-2">
            <div>
                <h4 class="mb-1 text-white fw-bold"><i class="bi bi-wallet2 text-accent-gradient me-2"></i>Dashboard Keuangan</h4>
                <p class="text-white-50 small mb-0">Kelola arus kas, rekap bank, dan snapshot harian.</p>
            </div>
            <div class="d-flex gap-2">
                <button id="update-saldo-btn" class="btn btn-vscode border-secondary text-white btn-sm shadow-sm">
                    <i class="bi bi-piggy-bank me-1"></i> Update Saldo (5 PM)
                </button>
                <button id="add-income-btn" class="btn btn-success btn-sm shadow-sm px-3">
                    <i class="bi bi-plus-lg me-1"></i> Pemasukan
                </button>
                <button id="add-expense-btn" class="btn btn-danger btn-sm shadow-sm px-3">
                    <i class="bi bi-dash-circle me-1"></i> Pengeluaran
                </button>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <ul class="nav nav-tabs admin-tabs-custom mb-3" id="financeTabs" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" id="f-recap-tab" data-bs-toggle="tab" data-bs-target="#f-recap" type="button">
                    <i class="bi bi-pie-chart me-1"></i> Rekap Harian & Bulanan
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="f-ledger-tab" data-bs-toggle="tab" data-bs-target="#f-ledger" type="button">
                    <i class="bi bi-list-columns-reverse me-1"></i> Buku Besar (Audit)
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="f-banks-tab" data-bs-toggle="tab" data-bs-target="#f-banks" type="button">
                    <i class="bi bi-bank me-1"></i> Rekening Bank
                </button>
            </li>
        </ul>

        <div class="tab-content" id="financeTabsContent">
            <!-- Recap Pane -->
            <div class="tab-pane fade show active" id="f-recap" role="tabpanel">
                <div class="row g-3" id="recap-cards">
                    <div class="col-md-6 col-lg-3">
                        <div class="card bg-vscode border-secondary shadow-sm p-3">
                            <span class="text-white-50 tiny text-uppercase fw-bold">Pemasukan Hari Ini</span>
                            <h3 class="text-success fw-bold mb-0" id="stat-daily-income">Rp 0</h3>
                        </div>
                    </div>
                    <div id="snapshot-reminder" class="col-md-6 col-lg-9 d-none">
                        <div class="alert alert-warning border-warning bg-warning bg-opacity-10 mb-0 d-flex align-items-center h-100">
                            <i class="bi bi-clock-history fs-4 me-3"></i>
                            <div>
                                <div class="fw-bold fs-6">Sudah jam 5 sore!</div>
                                <div class="small opacity-75">Tentukan saldo riil di bank hari ini melalui tombol <strong>Update Saldo</strong>.</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 card bg-vscode border-secondary p-4">
                    <h5 class="text-white mb-3 d-flex justify-content-between align-items-center">
                        <span><i class="bi bi-bank2 me-2 text-info"></i>Pemasukan Harian per Bank</span>
                        <div class="d-flex gap-2 align-items-center">
                            <input type="date" id="daily-recap-date" class="form-control form-control-sm bg-dark text-white border-secondary w-auto mb-0" value="${new Date().toISOString().split('T')[0]}">
                            <button id="refresh-daily-recap-btn" class="btn btn-primary btn-sm px-3">
                                <i class="bi bi-search me-1"></i> Tampilkan
                            </button>
                        </div>
                    </h5>
                    <div id="daily-bank-recap-table" class="table-responsive">
                        <div class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Memuat data...</div>
                    </div>
                </div>
            </div>

            <!-- Ledger Pane -->
            <div class="tab-pane fade" id="f-ledger" role="tabpanel">
                <div class="card bg-vscode border-secondary p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h5 class="text-white mb-0">Jurnal Transaksi Kas</h5>
                        <div class="d-flex gap-2">
                             <input type="date" id="ledger-start-date" class="form-control form-control-sm bg-dark text-white border-secondary w-auto">
                             <input type="date" id="ledger-end-date" class="form-control form-control-sm bg-dark text-white border-secondary w-auto">
                        </div>
                    </div>
                    <div id="ledger-table-container" class="table-responsive">
                        <div class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Memuat data...</div>
                    </div>
                </div>
            </div>

            <!-- Banks Pane -->
            <div class="tab-pane fade" id="f-banks" role="tabpanel">
                <div class="row g-3" id="banks-list-grid">
                    <div class="col-12 text-center py-5"><div class="spinner-border"></div></div>
                </div>
            </div>
        </div>
    `;

    // 2. Event Listeners
    setupEventListeners();

    // 3. Initial Load
    loadBanks();
    loadDailyRecap();
    checkReminder();
}

function checkReminder() {
    const now = new Date();
    if (now.getHours() >= 17) {
        document.getElementById('snapshot-reminder')?.classList.remove('d-none');
    }
}

function setupEventListeners() {
    document.getElementById('refresh-daily-recap-btn')?.addEventListener('click', loadDailyRecap);
    document.getElementById('add-income-btn')?.addEventListener('click', () => showAddTransactionModal('income'));
    document.getElementById('add-expense-btn')?.addEventListener('click', () => showAddTransactionModal('expense'));
    document.getElementById('update-saldo-btn')?.addEventListener('click', showUpdateSaldoModal);
    
    // Ledger filters
    document.getElementById('ledger-start-date')?.addEventListener('change', loadLedger);
    document.getElementById('ledger-end-date')?.addEventListener('change', loadLedger);

    // Tab activation
    document.getElementById('f-ledger-tab')?.addEventListener('shown.bs.tab', loadLedger);
    document.getElementById('f-banks-tab')?.addEventListener('shown.bs.tab', loadBanks);
}

async function loadBanks() {
    try {
        const banks = await apiCall('/bank-accounts');
        currentBankAccounts = banks;
        renderBanks(banks);
    } catch (err) {
        console.error('Load banks error:', err);
    }
}

function renderBanks(banks) {
    const grid = document.getElementById('banks-list-grid');
    if (!grid) return;

    grid.innerHTML = banks.map(bank => `
        <div class="col-md-4">
            <div class="card bg-vscode border-secondary shadow-sm p-3 h-100 position-relative glass-card">
                <div class="mb-3 d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="text-white-50 small mb-1">${bank.name}</h6>
                        <h4 class="text-white fw-bold mb-1">${bank.account_number || '-'}</h4>
                        <span class="text-muted tiny">${bank.account_holder || ''}</span>
                    </div>
                    <i class="bi bi-bank fs-3 text-white-50"></i>
                </div>
                <div class="mt-auto">
                    <div class="text-white-50 tiny text-uppercase mb-1">Saldo Saat Ini</div>
                    <h4 class="text-accent-gradient fw-bold mb-0">Rp ${new Intl.NumberFormat('id-ID').format(bank.current_balance)}</h4>
                </div>
            </div>
        </div>
    `).join('') + `
        <div class="col-md-4">
            <button class="btn btn-outline-secondary border-dashed w-100 h-100 py-5 d-flex flex-column align-items-center justify-content-center" onclick="window.showToast('info', 'Fitur tambah rekening akan segera hadir')">
                <i class="bi bi-plus-circle fs-3 mb-2"></i>
                <span class="small">Tambah Rekening</span>
            </button>
        </div>
    `;
}

async function loadDailyRecap() {
    const date = document.getElementById('daily-recap-date').value;
    const container = document.getElementById('daily-bank-recap-table');
    if (!container) return;

    try {
        const data = await apiCall(`/finance/recap?mode=daily&date=${date}`);
        const recap = data.recap;
        
        let html = `
            <table class="table table-dark table-hover align-middle mb-0">
                <thead>
                    <tr class="text-white-50">
                        <th>BANK / AKUN</th>
                        <th class="text-end">PEMASUKAN</th>
                        <th class="text-end">PENGELUARAN</th>
                        <th class="text-end">NET</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalIn = 0;
        let totalOut = 0;

        const banks = Object.keys(recap);
        if (banks.length === 0) {
            html += `<tr><td colspan="4" class="text-center py-4 text-white-50">Tidak ada transaksi pada tanggal ini.</td></tr>`;
        } else {
            banks.forEach(bank => {
                const row = recap[bank];
                totalIn += row.income;
                totalOut += row.expense;
                html += `
                    <tr>
                        <td class="fw-bold">${bank}</td>
                        <td class="text-end text-success">Rp ${new Intl.NumberFormat('id-ID').format(row.income)}</td>
                        <td class="text-end text-danger">Rp ${new Intl.NumberFormat('id-ID').format(row.expense)}</td>
                        <td class="text-end fw-bold">Rp ${new Intl.NumberFormat('id-ID').format(row.income - row.expense)}</td>
                    </tr>
                `;
            });
            html += `
                <tr class="border-top border-secondary">
                    <td class="fw-bold">TOTAL GABUNGAN</td>
                    <td class="text-end text-success fw-bold">Rp ${new Intl.NumberFormat('id-ID').format(totalIn)}</td>
                    <td class="text-end text-danger fw-bold">Rp ${new Intl.NumberFormat('id-ID').format(totalOut)}</td>
                    <td class="text-end text-accent-gradient fs-5 fw-bold">Rp ${new Intl.NumberFormat('id-ID').format(totalIn - totalOut)}</td>
                </tr>
            `;
        }

        html += `</tbody></table>`;
        container.innerHTML = html;
        document.getElementById('stat-daily-income').innerText = `Rp ${new Intl.NumberFormat('id-ID').format(totalIn)}`;

    } catch (err) {
        console.error('Load daily recap error:', err);
    }
}

async function loadLedger() {
    const startDate = document.getElementById('ledger-start-date').value;
    const endDate = document.getElementById('ledger-end-date').value;
    const container = document.getElementById('ledger-table-container');
    if (!container) return;

    try {
        const url = `/financial-transactions?startDate=${startDate}&endDate=${endDate}`;
        const data = await apiCall(url);
        
        let html = `
            <table class="table table-dark table-hover align-middle mb-0" style="font-size: 0.85rem">
                <thead>
                    <tr class="text-white-50">
                        <th>TANGGAL BAYAR (REAL)</th>
                        <th>KATEGORI</th>
                        <th>DESKRIPSI</th>
                        <th>AKUN</th>
                        <th class="text-end">JUMLAH</th>
                        <th class="text-center">VERIFIKASI</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (data.length === 0) {
            html += `<tr><td colspan="6" class="text-center py-5 text-white-50">Belum ada transaksi.</td></tr>`;
        } else {
            data.forEach(tx => {
                const date = tx.payment_date ? new Date(tx.payment_date).toLocaleString('id-ID') : tx.transaction_date;
                const isIncome = tx.type === 'income';
                html += `
                    <tr>
                        <td class="text-white-50">${date}</td>
                        <td><span class="badge bg-vscode border border-secondary">${tx.category}</span></td>
                        <td>${tx.description}</td>
                        <td><span class="text-info">${tx.bank_name || '-'}</span></td>
                        <td class="text-end fw-bold ${isIncome ? 'text-success' : 'text-danger'}">
                            ${isIncome ? '+' : '-'} Rp ${new Intl.NumberFormat('id-ID').format(tx.amount)}
                        </td>
                        <td class="text-center">
                            ${tx.is_verified 
                                ? '<span class="badge bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle me-1"></i>Verified</span>'
                                : `<button class="btn btn-outline-warning btn-xs py-0 px-2" onclick="window.verifyTx('${tx.id}')">Verifikasi</button>`
                            }
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch (err) {
        console.error('Load ledger error:', err);
    }
}

window.verifyTx = async (id) => {
    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody = document.getElementById('crudModalBody');
    const saveBtn = document.getElementById('save-crud-btn');

    modalTitle.innerHTML = '<i class="bi bi-shield-check me-2"></i> Konfirmasi Verifikasi';
    modalBody.innerHTML = `
        <div class="text-center py-3">
            <i class="bi bi-patch-check text-warning fs-1 mb-3 d-block"></i>
            <h5 class="text-white mb-2">Verifikasi Transaksi?</h5>
            <p class="text-white-50 small">Tindakan ini akan menandai transaksi sebagai valid dan sudah diverifikasi oleh bendahara.</p>
        </div>
    `;

    saveBtn.innerText = 'Ya, Verifikasi';
    saveBtn.classList.remove('btn-primary');
    saveBtn.classList.add('btn-warning');

    saveBtn.onclick = async () => {
        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
            
            await apiCall('/financial-transactions', {
                method: 'PATCH',
                body: JSON.stringify({ id, is_verified: true })
            });
            
            showToast('success', 'Transaksi berhasil diverifikasi');
            bootstrap.Modal.getInstance(document.getElementById('crudModal')).hide();
            loadLedger();
            loadDailyRecap();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.classList.remove('btn-warning');
            saveBtn.classList.add('btn-primary');
        }
    };

    new bootstrap.Modal(document.getElementById('crudModal')).show();
};

function showAddTransactionModal(type = 'income') {
    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody = document.getElementById('crudModalBody');
    const saveBtn = document.getElementById('save-crud-btn');
    const modalHeader = document.querySelector('#crudModal .modal-header');

    // Reset and apply type-based styling
    modalHeader.classList.remove('bg-success', 'bg-danger');
    modalHeader.classList.add(type === 'income' ? 'bg-success' : 'bg-danger');
    modalHeader.classList.add('text-white');

    modalTitle.innerHTML = `<i class="bi ${type === 'income' ? 'bi-plus-circle' : 'bi-dash-circle'} me-2"></i> ${type === 'income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}`;

    const categories = type === 'income' 
        ? ['Layanan Internet', 'Pemasukan Lain', 'Bonus Vendor', 'Refund'] 
        : ['Gaji & Bonus', 'Operasional', 'Listrik', 'Sewa', 'Inventaris', 'Alat Kerja'];

    let selectedBankId = '';
    let selectedCategory = '';

    modalBody.innerHTML = `
        <form id="add-tx-form">
            <div class="row g-3">
                <!-- Deskripsi -->
                <div class="col-12">
                    <label class="form-label small text-white-50">Keterangan / Deskripsi</label>
                    <input type="text" id="tx-desc" class="form-control bg-dark text-white border-secondary" placeholder="Tulis rincian transaksi..." required>
                </div>

                <!-- Jumlah -->
                <div class="col-md-6">
                    <label class="form-label small text-white-50">Jumlah (Rp)</label>
                    <div class="input-group">
                        <span class="input-group-text bg-dark border-secondary text-white-50">Rp</span>
                        <input type="number" id="tx-amount" class="form-control bg-dark text-white border-secondary" placeholder="0" required>
                    </div>
                </div>

                <!-- Tanggal (24h) -->
                <div class="col-md-6">
                    <label class="form-label small text-white-50">Waktu Transaksi (Real)</label>
                    <input type="datetime-local" id="tx-date" class="form-control bg-dark text-white border-secondary" value="${new Date().toISOString().slice(0, 16)}">
                </div>

                <!-- Bank Selection (Icons) -->
                <div class="col-12">
                    <label class="form-label small text-white-50 d-block mb-2">Pilih Rekening / Akun</label>
                    <div class="d-flex flex-wrap gap-2" id="bank-selector-grid">
                        ${currentBankAccounts.map(b => `
                            <div class="bank-select-card p-2 border border-secondary rounded bg-dark d-flex align-items-center gap-2 cursor-pointer transition-base shadow-sm flex-fill" data-bank-id="${b.id}" style="min-width: 120px;">
                                <div class="icon-circle bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                                    <i class="bi bi-bank tiny text-white"></i>
                                </div>
                                <div class="lh-sm">
                                    <div class="small fw-bold text-white">${b.name}</div>
                                    <div class="tiny text-white-50">${b.account_number || 'Cash'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Category Selection (Pills) -->
                <div class="col-12">
                    <label class="form-label small text-white-50 d-block mb-2">Pilih Kategori</label>
                    <div class="d-flex flex-wrap gap-2" id="category-selector-pills">
                        ${categories.map(cat => `
                            <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill cat-pill px-3 py-1" data-cat="${cat}">
                                ${cat}
                            </button>
                        `).join('')}
                        <button type="button" class="btn btn-outline-info btn-sm rounded-pill px-3 py-1" onclick="this.parentElement.querySelector('#custom-cat-input').classList.toggle('d-none')">
                            + Lainnya
                        </button>
                        <input type="text" id="custom-cat-input" class="form-control form-control-sm bg-dark text-white border-secondary rounded-pill mt-2 d-none" placeholder="Masukkan kategori kustom...">
                    </div>
                </div>
            </div>
        </form>

        <style>
            .bank-select-card { cursor: pointer; border-width: 2px !important; }
            .bank-select-card:hover { border-color: var(--accent) !important; background: rgba(14, 165, 233, 0.1) !important; }
            .bank-select-card.selected { border-color: var(--accent) !important; background: rgba(14, 165, 233, 0.2) !important; }
            .bank-select-card.selected i { color: var(--accent) !important; }
            .cat-pill.active { background-color: var(--accent) !important; border-color: var(--accent) !important; color: white !important; }
        </style>
    `;

    // Handle Bank Selection
    modalBody.querySelectorAll('.bank-select-card').forEach(card => {
        card.onclick = () => {
            modalBody.querySelectorAll('.bank-select-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedBankId = card.dataset.bankId;
        };
    });

    // Handle Category Selection
    modalBody.querySelectorAll('.cat-pill').forEach(pill => {
        pill.onclick = () => {
            modalBody.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedCategory = pill.dataset.cat;
            document.getElementById('custom-cat-input').classList.add('d-none');
            document.getElementById('custom-cat-input').value = '';
        };
    });

    saveBtn.onclick = async () => {
        const customCat = document.getElementById('custom-cat-input').value;
        const finalCategory = customCat || selectedCategory;

        if (!selectedBankId) return showToast('warning', 'Pilih rekening terlebih dahulu');
        if (!finalCategory) return showToast('warning', 'Pilih kategori terlebih dahulu');

        const payload = {
            type: type,
            category: finalCategory,
            description: document.getElementById('tx-desc').value,
            amount: parseFloat(document.getElementById('tx-amount').value),
            bank_account_id: selectedBankId,
            payment_date: new Date(document.getElementById('tx-date').value).toISOString(),
            is_verified: true
        };

        btnLoading(saveBtn, true);
        try {
            await apiCall('/financial-transactions', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showToast('success', 'Transaksi berhasil disimpan');
            bootstrap.Modal.getInstance(document.getElementById('crudModal')).hide();
            loadDailyRecap();
            loadLedger();
            loadBanks();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            btnLoading(saveBtn, false, 'Simpan Transaksi');
        }
    };

    // Helper for loading state
    function btnLoading(btn, isLoading, originalText = 'Simpan') {
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
        } else {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    new bootstrap.Modal(document.getElementById('crudModal')).show();
}

function showUpdateSaldoModal() {
    const modalTitle = document.getElementById('crudModalTitle');
    const modalBody = document.getElementById('crudModalBody');
    const saveBtn = document.getElementById('save-crud-btn');

    modalTitle.innerText = 'Snapshot Saldo Harian (Audit 5 PM)';
    modalBody.innerHTML = `
        <div class="alert alert-info py-2 small">
            <i class="bi bi-info-circle me-1"></i> Rekam total saldo riil di masing-masing BANK hari ini untuk penutupan buku jam 5 sore.
        </div>
        <div class="row g-3">
            ${currentBankAccounts.map(b => `
                <div class="col-md-12 mb-1">
                    <div class="card border-0 rounded-2 tech-finance-card p-3">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <label class="fw-semibold text-white mb-0 fs-6">${b.name}</label>
                            <div class="d-flex align-items-center bg-dark border border-secondary rounded px-2 py-1">
                                <span class="text-muted" style="font-size: 0.75rem; margin-right: 6px;">Saldo Sistem:</span>
                                <span class="text-light fw-medium font-monospace" style="font-size: 0.85rem;">Rp ${new Intl.NumberFormat('id-ID').format(b.current_balance)}</span>
                            </div>
                        </div>
                        
                        <div class="tech-finance-group">
                            <span class="tech-currency-label">Rp</span>
                            <input 
                                type="number" 
                                class="tech-finance-input font-monospace saldo-input" 
                                data-bank-id="${b.id}" 
                                placeholder="Masukkan saldo riil..." 
                                value="${b.current_balance}"
                            >
                        </div>
                    </div>
                </div>
            `).join('')}
            <div class="col-md-12 mt-2">
                <div class="card bg-vscode border-secondary p-3">
                    <label class="form-label small text-white-50 mb-2">Catatan Penyesuaian (Opsional)</label>
                    <textarea id="snapshot-notes" class="form-control bg-dark text-white border-secondary" rows="2" placeholder="Sebutkan alasan penyesuaian jika ada selisih..."></textarea>
                </div>
            </div>
        </div>
    `;

    saveBtn.onclick = async () => {
        const inputs = document.querySelectorAll('.saldo-input');
        const notes = document.getElementById('snapshot-notes').value;
        const promises = [];

        inputs.forEach(input => {
            const bank_account_id = input.getAttribute('data-bank-id');
            const balance = parseFloat(input.value);
            promises.push(apiCall('/bank-accounts', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'snapshot',
                    bank_account_id,
                    balance,
                    notes
                })
            }));
        });

        try {
            await Promise.all(promises);
            showToast('success', 'Snapshot saldo harian berhasil disimpan');
            bootstrap.Modal.getInstance(document.getElementById('crudModal')).hide();
            loadBanks();
        } catch (err) {
            showToast('error', 'Gagal menyimpan beberapa snapshot: ' + err.message);
        }
    };

    new bootstrap.Modal(document.getElementById('crudModal')).show();
}
