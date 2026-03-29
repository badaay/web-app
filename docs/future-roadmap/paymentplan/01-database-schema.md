# Database Schema for Payments

This document outlines the required database schema changes for the Payment Center. These tables will be added to `src/api/schema.sql`.

## 1. `invoices` Table

Stores customer invoice records.

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, paid, partial, overdue, void
    view_hash TEXT UNIQUE NOT NULL, -- For public URL access (8-char unique hash)
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_view_hash ON invoices(view_hash);
```

## 2. `invoice_items` Table

Stores individual line items for each invoice.

```sql
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL, -- Optional link to package
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    sort_order INT DEFAULT 0
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
```

## 3. `payments` Table

Stores records of all payments, whether from customers or to employees.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'customer_payment', 'payroll', 'expense'
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL, -- For customer payments
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- For payroll
    payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT, -- 'bank_transfer', 'cash', 'e-wallet', 'other'
    transaction_ref TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_employee ON payments(employee_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_type ON payments(type);
```

## 4. `payroll_runs` Table

Groups employee payments into specific payroll cycles.

```sql
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_bonuses NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
    employee_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, paid
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payroll_runs_period ON payroll_runs(period_start, period_end);
```

## 5. `payroll_items` Table

Individual employee records within a payroll run.

```sql
CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    base_salary NUMERIC(12, 2) NOT NULL,
    points_earned INT NOT NULL DEFAULT 0,
    point_value NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Monetary value of points
    deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
    bonuses NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_pay NUMERIC(12, 2) NOT NULL,
    notes TEXT
);

CREATE INDEX idx_payroll_items_run ON payroll_items(payroll_run_id);
CREATE INDEX idx_payroll_items_employee ON payroll_items(employee_id);
```

## 6. `payment_notifications` Table

Logs all payment-related notifications sent out.

```sql
CREATE TABLE payment_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'invoice_sent', 'reminder', 'overdue', 'thank_you'
    channel TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'sms'
    recipient_phone TEXT,
    message_content TEXT,
    status TEXT NOT NULL, -- 'pending', 'sent', 'failed', 'delivered'
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payment_notifications_invoice ON payment_notifications(invoice_id);
CREATE INDEX idx_payment_notifications_status ON payment_notifications(status);
CREATE INDEX idx_payment_notifications_sent_at ON payment_notifications(sent_at);
```

## 7. Settings Additions

Add these keys to the existing `settings` table:

```sql
INSERT INTO settings (setting_key, setting_value, description) VALUES
('point_to_currency_rate', '10000', 'IDR value per technician point'),
('invoice_prefix', 'INV', 'Prefix for invoice numbers'),
('invoice_due_days', '14', 'Default days until invoice due date'),
('payment_reminder_days', '3', 'Days before due date to send reminder'),
('company_name', 'Your Company Name', 'Company name for invoices'),
('company_address', 'Your Address', 'Company address for invoices'),
('company_phone', '', 'Company phone for invoices'),
('company_email', '', 'Company email for invoices'),
('tax_rate', '0', 'Default tax rate percentage');
```

## RLS Policies (To Be Implemented)

```sql
-- Invoices: Admin can do everything, customers can view their own
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to invoices" ON invoices FOR ALL USING (is_admin());
CREATE POLICY "Customers view own invoices" ON invoices FOR SELECT USING (customer_id = auth.uid());

-- Payments: Admin only
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to payments" ON payments FOR ALL USING (is_admin());

-- Payment notifications: Admin only
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to notifications" ON payment_notifications FOR ALL USING (is_admin());
```

## Future Enhancements

- Add `recurring_invoices` table for subscription automation.
- Add `expense_categories` table for company expense tracking.
- Implement soft deletes with `deleted_at` column.
- Add audit trail with `updated_by` columns.
