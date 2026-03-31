# Payment Center Overview

This document provides a high-level overview of the new Payment Center module.

## 1. Purpose

The Payment Center will centralize all financial operations within the application, including:
- Customer subscription billing and invoicing.
- Employee payroll processing, including performance-based deductions and bonuses.
- Financial reporting and analytics.

## 2. Core Components

| Component | Description |
|-----------|-------------|
| **Database** | New tables to store payment, invoice, and notification data. |
| **API Endpoints** | Secure server-side logic for all payment-related operations. |
| **Admin UI** | A new module in the admin panel to manage all features. |
| **Notifications** | Integration with WhatsApp for payment reminders and invoice delivery. |

## 3. Development Phases

### Phase 1: Backend Foundation
- Database schema design and implementation
- Core API endpoints for CRUD operations

### Phase 2: Core UI
- Navigation integration in admin panel
- Payment Center main interface with tabs
- Invoice and payment list views

### Phase 3: Feature Integration
- Invoice generation and online viewing
- Employee payroll with points integration
- WhatsApp notifications for payments
- Weekly/monthly reporting

## 4. Key Features Summary

1. **Customer Invoices**: Create, send, and track customer invoices with unique online links.
2. **Payment Tracking**: Record and manage all incoming payments.
3. **Employee Payroll**: Calculate salaries with point-based deductions/bonuses.
4. **Notifications**: Automated WhatsApp reminders for due dates and invoice delivery.
5. **Reporting**: Weekly and monthly financial summaries.

## 5. Integration Points

- **Customers Table**: Link invoices to existing customers.
- **Employees Table**: Link payroll to employees.
- **Work Orders**: Fetch technician points for payroll calculations.
- **Fonnte/WhatsApp**: Send payment notifications.
- **Settings Table**: Store configurable values (point conversion rates, etc.).

See the other documents in this directory for detailed plans for each component.
