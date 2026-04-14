import { supabase, supabaseB } from '../../../api/supabase.js';
import { getSpinner } from '../../utils/ui-common.js';

export async function initFinancialLedger() {
    const contentContainer = document.getElementById('financial-ledger-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = `
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Buku Besar Keuangan</h5>
                        </div>
                        <div class="card-body">
                            <div id="ledger-table-container"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    await loadLedgerData();
}

async function loadLedgerData() {
    const container = document.getElementById('ledger-table-container');
    container.innerHTML = getSpinner('Memuat data buku besar...');

    const { data, error } = await supabaseB
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        return;
    }

    renderLedgerTable(data);
}

function renderLedgerTable(transactions) {
    const container = document.getElementById('ledger-table-container');
    if (transactions.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Belum ada transaksi keuangan.</div>';
        return;
    }

    const table = `
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Tipe</th>
                    <th>Kategori</th>
                    <th>Deskripsi</th>
                    <th class="text-end">Jumlah</th>
                    <th>Metode</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(tx => `
                    <tr>
                        <td>${new Date(tx.transaction_date).toLocaleDateString('id-ID')}</td>
                        <td>
                            <span class="badge bg-${tx.type === 'income' ? 'success' : 'danger'}">
                                ${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                        </td>
                        <td>${tx.category}</td>
                        <td>${tx.description}</td>
                        <td class="text-end">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(tx.amount)}</td>
                        <td>${tx.payment_method || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}
