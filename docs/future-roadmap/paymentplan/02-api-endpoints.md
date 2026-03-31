# API Endpoints for Payments

This document specifies the Vercel Edge Function endpoints required for the Payment Center.

## Base Path Structure

```
/api/
├── invoices/
│   ├── index.js          # GET list, POST create
│   ├── [id].js           # GET single, PATCH update, DELETE
│   ├── send.js           # POST send invoice notification
│   └── bulk-reminder.js  # POST send bulk reminders
├── payments/
│   ├── index.js          # GET list, POST record payment
│   ├── [id].js           # GET single, PATCH, DELETE
│   └── summary.js        # GET payment summary/stats
├── payroll/
│   ├── index.js          # GET runs list, POST create run
│   ├── [id].js           # GET run details, PATCH approve
│   ├── calculate.js      # POST preview calculation
│   └── process.js        # POST execute payroll
└── public/
    └── invoice/
        └── [hash].js     # GET public invoice view
```

## 1. Invoice Endpoints (`/api/invoices/`)

### GET `/api/invoices`
List all invoices with filtering and pagination.

**Query Parameters:**
- `status` - Filter by status (draft, sent, paid, overdue)
- `customer_id` - Filter by customer
- `date_from` - Filter by issue date start
- `date_to` - Filter by issue date end
- `due_from` - Filter by due date start
- `due_to` - Filter by due date end
- `search` - Search invoice number or customer name
- `limit` - Pagination limit (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "data": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### POST `/api/invoices`
Create a new invoice.

**Auth:** Admin required

**Request Body:**
```json
{
  "customer_id": "uuid",
  "due_date": "2026-04-15",
  "items": [
    {
      "description": "Internet Package - Gold",
      "package_id": "uuid",
      "quantity": 1,
      "unit_price": 350000
    }
  ],
  "notes": "Optional notes",
  "tax_rate": 0,
  "discount_amount": 0
}
```

**Response:** Created invoice object with generated `invoice_number` and `view_hash`.

### GET `/api/invoices/:id`
Get single invoice with items.

**Auth:** Admin required

### PATCH `/api/invoices/:id`
Update invoice (only draft status).

**Auth:** Admin required

**Allowed Fields:** `due_date`, `items`, `notes`, `status`, `discount_amount`

### DELETE `/api/invoices/:id`
Delete invoice (only draft status).

**Auth:** Admin required

### POST `/api/invoices/send`
Send invoice to customer via WhatsApp.

**Auth:** Admin required

**Request Body:**
```json
{
  "invoice_id": "uuid",
  "message_template": "custom" // optional, defaults to standard template
}
```

**Actions:**
1. Update invoice status to 'sent'
2. Send WhatsApp message with invoice link
3. Log notification in `payment_notifications`

### POST `/api/invoices/bulk-reminder`
Send reminders for invoices due soon or overdue.

**Auth:** Admin required

**Request Body:**
```json
{
  "type": "due_soon", // or "overdue"
  "days": 3, // days before/after due date
  "limit": 100 // max messages to send
}
```

## 2. Payment Endpoints (`/api/payments/`)

### GET `/api/payments`
List all payments with filtering.

**Query Parameters:**
- `type` - Filter by type (customer_payment, payroll)
- `invoice_id` - Filter by invoice
- `employee_id` - Filter by employee
- `date_from` - Filter start date
- `date_to` - Filter end date
- `payment_method` - Filter by method
- `limit`, `offset` - Pagination

### POST `/api/payments`
Record a new customer payment.

**Auth:** Admin required

**Request Body:**
```json
{
  "invoice_id": "uuid",
  "amount": 350000,
  "payment_date": "2026-03-29",
  "payment_method": "bank_transfer",
  "transaction_ref": "TRX123456",
  "notes": "Optional notes"
}
```

**Actions:**
1. Create payment record
2. Update invoice status (paid/partial) based on total payments
3. Optionally send thank you notification

### GET `/api/payments/:id`
Get single payment details.

### GET `/api/payments/summary`
Get payment summary statistics.

**Query Parameters:**
- `period` - 'weekly', 'monthly', 'yearly'
- `date` - Reference date

**Response:**
```json
{
  "total_revenue": 15000000,
  "total_payroll": 8000000,
  "net_income": 7000000,
  "invoices_issued": 25,
  "invoices_paid": 20,
  "invoices_overdue": 3,
  "overdue_amount": 1050000
}
```

## 3. Payroll Endpoints (`/api/payroll/`)

### GET `/api/payroll`
List payroll runs.

**Query Parameters:**
- `status` - Filter by status
- `year` - Filter by year
- `month` - Filter by month

### POST `/api/payroll/calculate`
Preview payroll calculation without saving.

**Auth:** Admin required

**Request Body:**
```json
{
  "period_start": "2026-03-01",
  "period_end": "2026-03-31",
  "employee_ids": [] // empty = all active employees
}
```

**Response:**
```json
{
  "period_start": "2026-03-01",
  "period_end": "2026-03-31",
  "employees": [
    {
      "employee_id": "uuid",
      "name": "John Doe",
      "base_salary": 5000000,
      "points_earned": 15,
      "point_value": 150000,
      "deductions": 0,
      "bonuses": 150000,
      "net_pay": 5150000
    }
  ],
  "totals": {
    "base_salary": 25000000,
    "deductions": 0,
    "bonuses": 750000,
    "net_pay": 25750000
  }
}
```

### POST `/api/payroll/process`
Execute and save payroll run.

**Auth:** Admin required

**Request Body:**
```json
{
  "period_start": "2026-03-01",
  "period_end": "2026-03-31",
  "employee_ids": [],
  "notes": "March 2026 Payroll"
}
```

**Actions:**
1. Create `payroll_runs` record
2. Create `payroll_items` for each employee
3. Create `payments` records with type 'payroll'

### GET `/api/payroll/:id`
Get payroll run details with all items.

### PATCH `/api/payroll/:id`
Update payroll run status (approve/void).

**Auth:** Admin required

## 4. Public Endpoints (`/api/public/`)

### GET `/api/public/invoice/:hash`
Get invoice for public viewing (no auth required).

**Response:**
```json
{
  "invoice_number": "INV-202603-0001",
  "issue_date": "2026-03-15",
  "due_date": "2026-03-29",
  "status": "sent",
  "customer": {
    "name": "John Doe",
    "address": "..."
  },
  "company": {
    "name": "Your Company",
    "address": "...",
    "phone": "...",
    "email": "..."
  },
  "items": [...],
  "subtotal": 350000,
  "tax_amount": 0,
  "discount_amount": 0,
  "total_amount": 350000,
  "payments": [
    {
      "date": "2026-03-20",
      "amount": 100000,
      "method": "bank_transfer"
    }
  ],
  "amount_paid": 100000,
  "amount_due": 250000
}
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Missing or invalid auth token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `CONFLICT` - Operation conflicts (e.g., invoice already paid)

## Future Enhancements

- Add webhook endpoint for payment gateway integration
- Add CSV/Excel export endpoints
- Add recurring invoice automation endpoints
- Add expense tracking endpoints
