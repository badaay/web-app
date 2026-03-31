# Core UI for Payment Center

This document outlines the plan for the main user interface of the Payment Center.

## 1. Location and Access

### Navigation Integration
- **Menu Item**: Add "Payment Center" to the sidebar in `admin/index.html`
- **Icon**: Use Bootstrap Icons `bi-wallet2` or `bi-cash-stack`
- **Position**: After "Manajemen Antrian PSB" section
- **Highlight**: Make it visually prominent (gradient background, badge)

### Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `admin/index.html` | Modify | Add navigation item and content container |
| `src/admin/admin.js` | Modify | Add module initialization logic |
| `src/admin/modules/payments.js` | Create | Main payment module |
| `admin/view-invoice.html` | Create | Public invoice view page |

## 2. Navigation HTML

Add to sidebar in `admin/index.html`:

```html
<!-- Payment Center - Highlighted Section -->
<li class="nav-item mt-3">
    <a class="nav-link payment-center-nav d-flex align-items-center" href="#" data-target="payment-center-content">
        <i class="bi bi-wallet2 me-2"></i>
        <span>Payment Center</span>
        <span class="badge bg-success ms-auto">NEW</span>
    </a>
</li>

<!-- Sub-menu items -->
<li class="nav-item">
    <a class="nav-link ps-4" href="#" data-target="payment-invoices-content">
        <i class="bi bi-receipt me-2"></i>
        <span>Invoices</span>
    </a>
</li>
<li class="nav-item">
    <a class="nav-link ps-4" href="#" data-target="payment-payroll-content">
        <i class="bi bi-people me-2"></i>
        <span>Payroll</span>
    </a>
</li>
<li class="nav-item">
    <a class="nav-link ps-4" href="#" data-target="payment-reports-content">
        <i class="bi bi-graph-up me-2"></i>
        <span>Reports</span>
    </a>
</li>
```

## 3. Content Container HTML

Add to main content area in `admin/index.html`:

```html
<!-- Payment Center Content -->
<div id="payment-center-content" class="content-section d-none">
    <div class="container-fluid">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1"><i class="bi bi-wallet2 me-2"></i>Payment Center</h2>
                <p class="text-muted mb-0">Manage invoices, payments, and payroll</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-primary" id="btn-new-invoice">
                    <i class="bi bi-plus-lg me-1"></i>New Invoice
                </button>
                <button class="btn btn-outline-primary" id="btn-record-payment">
                    <i class="bi bi-cash me-1"></i>Record Payment
                </button>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="row g-3 mb-4" id="payment-stats-row">
            <!-- Dynamically populated -->
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs" id="paymentTabs" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#invoices-tab">
                    <i class="bi bi-receipt me-1"></i>Invoices
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#payments-tab">
                    <i class="bi bi-cash-stack me-1"></i>Payments
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#payroll-tab">
                    <i class="bi bi-people me-1"></i>Payroll
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#reports-tab">
                    <i class="bi bi-bar-chart me-1"></i>Reports
                </button>
            </li>
        </ul>

        <!-- Tab Content -->
        <div class="tab-content pt-3" id="paymentTabContent">
            <!-- Invoices Tab -->
            <div class="tab-pane fade show active" id="invoices-tab">
                <!-- Filters -->
                <div class="card bg-dark mb-3">
                    <div class="card-body">
                        <div class="row g-2">
                            <div class="col-md-3">
                                <input type="text" class="form-control" id="invoice-search" placeholder="Search...">
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="invoice-status-filter">
                                    <option value="">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <input type="date" class="form-control" id="invoice-date-from" placeholder="From">
                            </div>
                            <div class="col-md-2">
                                <input type="date" class="form-control" id="invoice-date-to" placeholder="To">
                            </div>
                            <div class="col-md-3 text-end">
                                <button class="btn btn-outline-secondary" id="btn-filter-invoices">
                                    <i class="bi bi-funnel"></i> Filter
                                </button>
                                <button class="btn btn-outline-warning" id="btn-send-reminders">
                                    <i class="bi bi-bell"></i> Send Reminders
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Invoices Table -->
                <div class="table-responsive">
                    <table class="table table-dark table-hover align-middle" id="invoices-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Issue Date</th>
                                <th>Due Date</th>
                                <th class="text-end">Amount</th>
                                <th>Status</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="invoices-tbody">
                            <!-- Dynamically populated -->
                        </tbody>
                    </table>
                </div>
                <!-- Pagination -->
                <nav id="invoices-pagination"></nav>
            </div>

            <!-- Payments Tab -->
            <div class="tab-pane fade" id="payments-tab">
                <!-- Similar structure for payments list -->
            </div>

            <!-- Payroll Tab -->
            <div class="tab-pane fade" id="payroll-tab">
                <!-- Payroll runs list and actions -->
            </div>

            <!-- Reports Tab -->
            <div class="tab-pane fade" id="reports-tab">
                <!-- Report generation UI -->
            </div>
        </div>
    </div>
</div>
```

## 4. CSS Styling

Add to `src/admin/admin.css`:

```css
/* Payment Center Highlight */
.payment-center-nav {
    background: linear-gradient(135deg, rgba(25, 135, 84, 0.2) 0%, rgba(13, 110, 253, 0.2) 100%);
    border-radius: 8px;
    margin: 0 8px;
    padding: 12px 16px !important;
}

.payment-center-nav:hover {
    background: linear-gradient(135deg, rgba(25, 135, 84, 0.3) 0%, rgba(13, 110, 253, 0.3) 100%);
}

/* Status Badges */
.badge-draft { background-color: #6c757d; }
.badge-sent { background-color: #0d6efd; }
.badge-paid { background-color: #198754; }
.badge-partial { background-color: #ffc107; color: #000; }
.badge-overdue { background-color: #dc3545; }
.badge-void { background-color: #343a40; }

/* Stats Cards */
.payment-stat-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 20px;
}

.payment-stat-card .stat-value {
    font-size: 1.75rem;
    font-weight: 600;
}

.payment-stat-card .stat-label {
    color: rgba(255,255,255,0.6);
    font-size: 0.875rem;
}
```

## 5. Module Initialization

Add to `src/admin/admin.js`:

```javascript
async function initModule(targetId) {
    // ... existing cases ...
    
    if (targetId === 'payment-center-content') {
        const { initPaymentCenter } = await import('./modules/payments.js');
        initPaymentCenter();
    }
}
```

## 6. Module Structure (`payments.js`)

```javascript
import { supabase, apiCall } from '../../api/supabase.js';

// State
let currentFilters = {
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
};
let currentPage = 1;
const pageSize = 50;

export async function initPaymentCenter() {
    console.log('Initializing Payment Center...');
    
    // Load initial data
    await Promise.all([
        loadStats(),
        loadInvoices(),
    ]);
    
    // Setup event listeners
    setupEventListeners();
}

async function loadStats() {
    // Fetch and display summary stats
}

async function loadInvoices() {
    // Fetch and render invoices table
}

async function loadPayments() {
    // Fetch and render payments table
}

async function loadPayrollRuns() {
    // Fetch and render payroll runs
}

function setupEventListeners() {
    // Filter handlers
    // Modal handlers
    // Action button handlers
}

// CRUD Operations
async function createInvoice(data) { }
async function updateInvoice(id, data) { }
async function deleteInvoice(id) { }
async function sendInvoice(id) { }
async function recordPayment(data) { }
async function runPayroll(data) { }

// UI Helpers
function renderInvoiceRow(invoice) { }
function renderPaymentRow(payment) { }
function showInvoiceModal(invoice = null) { }
function showPaymentModal(invoiceId = null) { }
function formatCurrency(amount) { }
function getStatusBadge(status) { }
```

## 7. Reusable Components

### Invoice Modal
Use the shared `#crudModal` with dynamic content for creating/editing invoices.

### Payment Recording Modal
A simplified modal for recording payments against invoices.

### Confirmation Dialogs
Use Bootstrap's modal for delete confirmations and bulk action confirmations.

## Future Enhancements

- Add a dashboard view with charts using Chart.js
- Implement real-time updates using Supabase Realtime
- Add drag-and-drop for reordering invoice items
- Create keyboard shortcuts for common actions
- Add bulk actions (select multiple invoices for sending reminders)
