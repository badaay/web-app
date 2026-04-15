/**
 * Payments & Integration Module - Scaffolding Implementation
 */
export async function initPayments() {
    console.log('Payments Module Initialized');

    const container = document.getElementById('payments-settings-content');
    if (!container) return;

    const paymentMethods = [
        { id: 'bank-bca', name: 'Bank BCA', icon: 'bi-bank', type: 'Virtual Account', status: 'Active', color: '#0d6efd' },
        { id: 'bank-mandiri', name: 'Bank Mandiri', icon: 'bi-bank', type: 'Virtual Account', status: 'Active', color: '#ffc107' },
        { id: 'dana', name: 'DANA', icon: 'bi-wallet2', type: 'E-Wallet', status: 'Active', color: '#0dcaf0' },
        { id: 'shopeepay', name: 'ShopeePay', icon: 'bi-wallet2', type: 'E-Wallet', status: 'Inactive', color: '#fd7e14' },
        { id: 'indomaret', name: 'Indomaret', icon: 'bi-shop', type: 'Retail Store', status: 'Pending', color: '#0d6efd' },
        { id: 'alfamart', name: 'Alfamart', icon: 'bi-shop', type: 'Retail Store', status: 'Inactive', color: '#dc3545' }
    ];

    container.innerHTML = `
        <div class="row g-4 mb-4">
            <div class="col-md-4">
                <div class="card bg-dark border-secondary h-100 p-3">
                    <h6 class="text-white mb-3">Merchant Config</h6>
                    <div class="mb-2 small">
                        <label class="text-white-50">Merchant ID</label>
                        <input type="text" class="form-control form-control-sm bg-transparent text-white border-secondary" value="M-72365281">
                    </div>
                    <div class="mb-3 small">
                        <label class="text-white-50">API Key (Sandbox)</label>
                        <input type="password" class="form-control form-control-sm bg-transparent text-white border-secondary" value="sk_test_51...293">
                    </div>
                    <button class="btn btn-primary btn-sm w-100">Update Credentials</button>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card bg-dark border-secondary h-100 p-3">
                    <h6 class="text-white mb-3">Channel Aktif</h6>
                    <div class="table-responsive">
                        <table class="table table-dark table-hover align-middle mb-0">
                            <thead>
                                <tr class="text-white-50 small">
                                    <th>Metode</th>
                                    <th>Tipe</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="small">
                                ${paymentMethods.map(method => `
                                    <tr>
                                        <td>
                                            <i class="bi ${method.icon} me-2" style="color: ${method.color}"></i>
                                            ${method.name}
                                        </td>
                                        <td>${method.type}</td>
                                        <td>
                                            <span class="badge ${method.status === 'Active' ? 'bg-success' : method.status === 'Pending' ? 'bg-warning' : 'bg-secondary'} px-2" style="font-size: 0.6rem">
                                                ${method.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" ${method.status === 'Active' ? 'checked' : ''} style="cursor: pointer">
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="alert alert-info bg-vscode border-info text-white-50 small d-flex align-items-center mb-0">
            <i class="bi bi-info-circle fs-5 me-2"></i>
            <div>Modul ini berfungsi sebagai antarmuka pengaturan gerbang pembayaran (GPN/MIDTRANS/DOKU) di masa depan.</div>
        </div>
    `;
}
