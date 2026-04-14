import { supabase } from '../../../api/supabase.js';
import { getSpinner } from '../../utils/ui-common.js';

export async function initFinancialReports() {
    const contentContainer = document.getElementById('financial-reports-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = `
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">Laporan Keuangan</h5>
                            <div>
                                <input type="month" id="report-month-picker" class="form-control form-control-sm" value="${new Date().toISOString().slice(0, 7)}">
                            </div>
                        </div>
                        <div class="card-body" id="reports-container">
                            <!-- Reports will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const monthPicker = document.getElementById('report-month-picker');
    monthPicker.addEventListener('change', () => loadReportData(monthPicker.value));

    loadReportData(monthPicker.value);
}

async function loadReportData(month) {
    const container = document.getElementById('reports-container');
    container.innerHTML = getSpinner('Memuat laporan...');

    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

    try {
        // Get the current session to ensure we have a valid token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            container.innerHTML = '<div class="alert alert-danger">Sesi tidak aktif. Silakan login kembali.</div>';
            return;
        }

        // Make the API call with proper authorization
        const response = await fetch(`/api/financial-transactions/summary?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const summary = await response.json();
        renderSummary(summary, container);

    } catch (error) {
        console.error('Error loading report data:', error);
        container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderSummary(summary, container) {
    const netProfit = summary.total_income - summary.total_expense;

    let incomeDetails = '';
    if (summary.income_by_category && Object.keys(summary.income_by_category).length > 0) {
        incomeDetails = Object.entries(summary.income_by_category).map(([category, total]) => `
            <div class="d-flex justify-content-between">
                <span>${category}</span>
                <span>${formatCurrency(total)}</span>
            </div>
        `).join('');
    } else {
        incomeDetails = '<div class="text-muted">Tidak ada pemasukan.</div>';
    }

    let expenseDetails = '';
    if (summary.expense_by_category && Object.keys(summary.expense_by_category).length > 0) {
        expenseDetails = Object.entries(summary.expense_by_category).map(([category, total]) => `
            <div class="d-flex justify-content-between">
                <span>${category}</span>
                <span>${formatCurrency(total)}</span>
            </div>
        `).join('');
    } else {
        expenseDetails = '<div class="text-muted">Tidak ada pengeluaran.</div>';
    }

    container.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <h6 class="card-title">Total Pemasukan</h6>
                        <p class="card-text fs-4 fw-bold">${formatCurrency(summary.total_income)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-danger text-white">
                    <div class="card-body">
                        <h6 class="card-title">Total Pengeluaran</h6>
                        <p class="card-text fs-4 fw-bold">${formatCurrency(summary.total_expense)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <h6 class="card-title">Laba Bersih</h6>
                        <p class="card-text fs-4 fw-bold">${formatCurrency(netProfit)}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-md-6">
                <h5>Detail Pemasukan</h5>
                <div class="list-group">
                    ${incomeDetails}
                </div>
            </div>
            <div class="col-md-6">
                <h5>Detail Pengeluaran</h5>
                <div class="list-group">
                    ${expenseDetails}
                </div>
            </div>
        </div>
    `;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}
