# Invoice Generation and Viewing

This document details the plan for creating, sending, and viewing invoices.

## 1. Invoice Creation Flow

### Step 1: Open Invoice Modal
- User clicks "New Invoice" button
- Modal opens with empty form

### Step 2: Fill Invoice Details
1. **Customer Selection**
   - Searchable dropdown populated from `customers` table
   - Shows customer name, code, and phone
   - Auto-fills customer address

2. **Invoice Details**
   - Issue Date (default: today)
   - Due Date (default: today + `invoice_due_days` setting)

3. **Line Items** (Dynamic)
   - Package dropdown (from `packages` table) OR custom description
   - Quantity (default: 1)
   - Unit Price (auto-fills from package, editable)
   - Line Total (calculated)
   - Add/Remove item buttons

4. **Totals Section**
   - Subtotal (calculated)
   - Discount (optional, manual entry)
   - Tax (calculated from `tax_rate` setting)
   - **Total Amount** (calculated)

5. **Notes** (optional)

### Step 3: Save Invoice
- Click "Save as Draft" or "Save & Send"
- Backend generates:
  - `invoice_number`: `{prefix}-{YYYYMM}-{sequence}` (e.g., INV-202603-0001)
  - `view_hash`: 8-character unique alphanumeric hash

## 2. Invoice Number Generation

```javascript
// In API endpoint
async function generateInvoiceNumber(supabase) {
    const prefix = await getSetting('invoice_prefix') || 'INV';
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Get last invoice number for this month
    const { data } = await supabase
        .from('invoices')
        .select('invoice_number')
        .like('invoice_number', `${prefix}-${yearMonth}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1);
    
    let sequence = 1;
    if (data && data.length > 0) {
        const lastSeq = parseInt(data[0].invoice_number.split('-')[2]);
        sequence = lastSeq + 1;
    }
    
    return `${prefix}-${yearMonth}-${String(sequence).padStart(4, '0')}`;
}
```

## 3. View Hash Generation

```javascript
function generateViewHash() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let hash = '';
    for (let i = 0; i < 8; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}
```

## 4. Online Invoice View Page

### URL Structure
`https://your-domain.com/view-invoice.html?id={view_hash}`

### Page: `admin/view-invoice.html`

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: #f8f9fa;
            padding: 20px;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .invoice-header {
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-logo {
            max-height: 60px;
        }
        .invoice-title {
            font-size: 2rem;
            font-weight: 700;
            color: #333;
        }
        .status-badge {
            font-size: 0.875rem;
            padding: 6px 12px;
            border-radius: 20px;
        }
        .status-sent { background: #cfe2ff; color: #084298; }
        .status-paid { background: #d1e7dd; color: #0f5132; }
        .status-overdue { background: #f8d7da; color: #842029; }
        .items-table th {
            background: #f8f9fa;
        }
        .total-row {
            font-weight: 600;
            font-size: 1.1rem;
        }
        .amount-due {
            font-size: 1.5rem;
            color: #dc3545;
        }
        .amount-due.paid {
            color: #198754;
        }
        @media print {
            body { padding: 0; background: white; }
            .invoice-container { box-shadow: none; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="invoice-container" id="invoice-content">
        <div class="text-center py-5" id="loading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Loading invoice...</p>
        </div>
    </div>
    
    <!-- Print Button -->
    <div class="text-center mt-3 no-print">
        <button class="btn btn-outline-secondary" onclick="window.print()">
            <i class="bi bi-printer"></i> Print Invoice
        </button>
    </div>

    <script type="module">
        import { supabase } from '../src/api/supabase.js';
        
        async function loadInvoice() {
            const urlParams = new URLSearchParams(window.location.search);
            const hash = urlParams.get('id');
            
            if (!hash) {
                showError('Invalid invoice link');
                return;
            }
            
            try {
                const response = await fetch(`/api/public/invoice/${hash}`);
                if (!response.ok) {
                    throw new Error('Invoice not found');
                }
                
                const invoice = await response.json();
                renderInvoice(invoice);
            } catch (error) {
                showError(error.message);
            }
        }
        
        function renderInvoice(inv) {
            document.getElementById('invoice-content').innerHTML = `
                <!-- Invoice Header -->
                <div class="invoice-header">
                    <div class="row align-items-center">
                        <div class="col-6">
                            <h1 class="invoice-title">INVOICE</h1>
                            <p class="mb-0 text-muted">#${inv.invoice_number}</p>
                        </div>
                        <div class="col-6 text-end">
                            <h4 class="mb-1">${inv.company.name}</h4>
                            <p class="mb-0 small text-muted">${inv.company.address}</p>
                            <p class="mb-0 small text-muted">${inv.company.phone}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Customer & Invoice Info -->
                <div class="row mb-4">
                    <div class="col-6">
                        <h6 class="text-muted">Bill To:</h6>
                        <h5>${inv.customer.name}</h5>
                        <p class="mb-0 text-muted">${inv.customer.address || ''}</p>
                        <p class="mb-0 text-muted">${inv.customer.phone || ''}</p>
                    </div>
                    <div class="col-6 text-end">
                        <p class="mb-1"><strong>Issue Date:</strong> ${formatDate(inv.issue_date)}</p>
                        <p class="mb-1"><strong>Due Date:</strong> ${formatDate(inv.due_date)}</p>
                        <p class="mb-0">
                            <span class="status-badge status-${inv.status}">${inv.status.toUpperCase()}</span>
                        </p>
                    </div>
                </div>
                
                <!-- Line Items -->
                <table class="table items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="text-center">Qty</th>
                            <th class="text-end">Unit Price</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inv.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-end">${formatCurrency(item.unit_price)}</td>
                                <td class="text-end">${formatCurrency(item.total_price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end">Subtotal</td>
                            <td class="text-end">${formatCurrency(inv.subtotal)}</td>
                        </tr>
                        ${inv.discount_amount > 0 ? `
                        <tr>
                            <td colspan="3" class="text-end">Discount</td>
                            <td class="text-end text-danger">-${formatCurrency(inv.discount_amount)}</td>
                        </tr>
                        ` : ''}
                        ${inv.tax_amount > 0 ? `
                        <tr>
                            <td colspan="3" class="text-end">Tax</td>
                            <td class="text-end">${formatCurrency(inv.tax_amount)}</td>
                        </tr>
                        ` : ''}
                        <tr class="total-row">
                            <td colspan="3" class="text-end">Total</td>
                            <td class="text-end">${formatCurrency(inv.total_amount)}</td>
                        </tr>
                        ${inv.amount_paid > 0 ? `
                        <tr>
                            <td colspan="3" class="text-end text-success">Amount Paid</td>
                            <td class="text-end text-success">${formatCurrency(inv.amount_paid)}</td>
                        </tr>
                        ` : ''}
                        <tr class="total-row">
                            <td colspan="3" class="text-end">Amount Due</td>
                            <td class="text-end amount-due ${inv.amount_due === 0 ? 'paid' : ''}">
                                ${formatCurrency(inv.amount_due)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                
                ${inv.notes ? `
                <div class="mt-4 p-3 bg-light rounded">
                    <h6>Notes:</h6>
                    <p class="mb-0">${inv.notes}</p>
                </div>
                ` : ''}
                
                <!-- Payment History -->
                ${inv.payments && inv.payments.length > 0 ? `
                <div class="mt-4">
                    <h6>Payment History:</h6>
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Method</th>
                                <th class="text-end">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inv.payments.map(p => `
                                <tr>
                                    <td>${formatDate(p.date)}</td>
                                    <td>${p.method}</td>
                                    <td class="text-end">${formatCurrency(p.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
            `;
        }
        
        function formatDate(dateStr) {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }
        
        function formatCurrency(amount) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency', currency: 'IDR', minimumFractionDigits: 0
            }).format(amount);
        }
        
        function showError(message) {
            document.getElementById('invoice-content').innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                    <h4 class="mt-3">${message}</h4>
                    <p class="text-muted">Please check the link and try again.</p>
                </div>
            `;
        }
        
        loadInvoice();
    </script>
</body>
</html>
```

## 5. Sending Invoice

### Process Flow
1. Admin clicks "Send" on a draft invoice
2. Confirmation dialog shows customer info and message preview
3. On confirm:
   - API call to `/api/invoices/send`
   - Backend updates status to 'sent'
   - Backend sends WhatsApp message via Fonnte
   - Backend logs notification

### WhatsApp Message Template

```
Yth. {customer_name},

Invoice baru telah diterbitkan untuk Anda:

📄 No. Invoice: {invoice_number}
💰 Total: {total_amount}
📅 Jatuh Tempo: {due_date}

Silakan lihat detail invoice di:
{invoice_link}

Terima kasih.
{company_name}
```

## 6. Invoice Status Workflow

```
 ┌─────────┐
 │  DRAFT  │ ← Created, can be edited/deleted
 └────┬────┘
      │ Send
      ▼
 ┌─────────┐
 │  SENT   │ ← Sent to customer, waiting for payment
 └────┬────┘
      │
      ├──────────────────┐
      │ Partial Payment  │ Full Payment
      ▼                  ▼
 ┌─────────┐        ┌─────────┐
 │ PARTIAL │        │  PAID   │ ← Fully paid
 └────┬────┘        └─────────┘
      │ Full Payment
      ▼
 ┌─────────┐
 │  PAID   │
 └─────────┘

 Note: Sent/Partial can transition to OVERDUE automatically
       based on due_date (handled by scheduled job or on-read check)
```

## Future Enhancements

- PDF generation using a library like `jspdf` or server-side rendering
- Allow customers to download PDF from the online view
- Email delivery as an alternative to WhatsApp
- Customizable invoice templates (colors, logo, footer)
- Recurring invoice automation
- QR code for quick payment (integrates with QRIS)
