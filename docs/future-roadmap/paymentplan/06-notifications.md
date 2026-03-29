# Payment Notifications

This document describes the plan for implementing payment-related notifications via WhatsApp, using the existing Fonnte integration.

## 1. Notification Types

| Type | Trigger | Recipient | Purpose |
|------|---------|-----------|---------|
| `invoice_sent` | Admin sends invoice | Customer | Deliver invoice link |
| `reminder` | Cron job (X days before due) | Customer | Remind about upcoming payment |
| `overdue` | Cron job (after due date) | Customer | Alert about overdue payment |
| `thank_you` | Payment recorded | Customer | Confirm payment received |
| `payslip` | Payroll processed | Employee | Deliver payslip (future) |

## 2. Message Templates

### Invoice Sent
```
Yth. {customer_name},

Invoice baru telah diterbitkan:

📄 No. Invoice: {invoice_number}
💰 Total: {total_amount}
📅 Jatuh Tempo: {due_date}

Lihat detail invoice:
{invoice_link}

Terima kasih.
{company_name}
```

### Payment Reminder (X days before due)
```
Yth. {customer_name},

Pengingat pembayaran:

📄 Invoice: {invoice_number}
💰 Jumlah: {amount_due}
📅 Jatuh Tempo: {due_date} ({days_until_due} hari lagi)

Lihat invoice: {invoice_link}

Abaikan jika sudah membayar.
{company_name}
```

### Overdue Notice
```
Yth. {customer_name},

Pembayaran Anda telah melewati jatuh tempo:

📄 Invoice: {invoice_number}
💰 Jumlah: {amount_due}
📅 Jatuh Tempo: {due_date} (terlambat {days_overdue} hari)

Segera lakukan pembayaran untuk menghindari pemutusan layanan.

Lihat invoice: {invoice_link}

{company_name}
```

### Thank You (Payment Received)
```
Yth. {customer_name},

Pembayaran Anda telah kami terima:

📄 Invoice: {invoice_number}
💰 Jumlah Bayar: {payment_amount}
📅 Tanggal: {payment_date}

{remaining_message}

Terima kasih atas pembayaran Anda.
{company_name}
```

Where `{remaining_message}` is:
- If fully paid: "Invoice telah LUNAS."
- If partial: "Sisa pembayaran: {amount_due}"

## 3. Implementation Architecture

### API Endpoints

```
/api/notifications/
├── send-invoice.js      # POST - Send single invoice notification
├── send-reminder.js     # POST - Send single reminder
├── bulk-reminders.js    # POST - Send reminders for invoices due in X days
├── send-thankyou.js     # POST - Send payment confirmation
└── history.js           # GET - List notification history
```

### Notification Service Module

Create `api/_lib/payment-notifications.js`:

```javascript
import { sendWhatsApp } from './fonnte.js';
import { createClient } from './supabase.js';

const templates = {
    invoice_sent: (data) => `Yth. ${data.customer_name},

Invoice baru telah diterbitkan:

📄 No. Invoice: ${data.invoice_number}
💰 Total: ${formatCurrency(data.total_amount)}
📅 Jatuh Tempo: ${formatDate(data.due_date)}

Lihat detail invoice:
${data.invoice_link}

Terima kasih.
${data.company_name}`,

    reminder: (data) => `Yth. ${data.customer_name},

Pengingat pembayaran:

📄 Invoice: ${data.invoice_number}
💰 Jumlah: ${formatCurrency(data.amount_due)}
📅 Jatuh Tempo: ${formatDate(data.due_date)} (${data.days_until_due} hari lagi)

Lihat invoice: ${data.invoice_link}

Abaikan jika sudah membayar.
${data.company_name}`,

    overdue: (data) => `Yth. ${data.customer_name},

Pembayaran Anda telah melewati jatuh tempo:

📄 Invoice: ${data.invoice_number}
💰 Jumlah: ${formatCurrency(data.amount_due)}
📅 Jatuh Tempo: ${formatDate(data.due_date)} (terlambat ${data.days_overdue} hari)

Segera lakukan pembayaran.

Lihat invoice: ${data.invoice_link}

${data.company_name}`,

    thank_you: (data) => `Yth. ${data.customer_name},

Pembayaran Anda telah kami terima:

📄 Invoice: ${data.invoice_number}
💰 Jumlah Bayar: ${formatCurrency(data.payment_amount)}
📅 Tanggal: ${formatDate(data.payment_date)}

${data.is_fully_paid ? 'Invoice telah LUNAS.' : `Sisa pembayaran: ${formatCurrency(data.amount_due)}`}

Terima kasih.
${data.company_name}`
};

export async function sendPaymentNotification(type, data) {
    const supabase = createClient();
    
    // Build message from template
    const message = templates[type](data);
    
    // Send via Fonnte
    const result = await sendWhatsApp(data.phone, message);
    
    // Log notification
    await supabase.from('payment_notifications').insert({
        invoice_id: data.invoice_id,
        customer_id: data.customer_id,
        type,
        channel: 'whatsapp',
        recipient_phone: data.phone,
        message_content: message,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null
    });
    
    return result;
}

export async function sendBulkReminders(daysBeforeDue, limit = 100) {
    const supabase = createClient();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeDue);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // Find unpaid invoices due on target date
    const { data: invoices } = await supabase
        .from('invoices')
        .select(`
            id, invoice_number, due_date, total_amount, view_hash,
            customer:customers(id, name, phone_number)
        `)
        .in('status', ['sent', 'partial'])
        .eq('due_date', targetDateStr)
        .limit(limit);
    
    const results = { sent: 0, failed: 0, errors: [] };
    
    for (const inv of invoices) {
        if (!inv.customer?.phone_number) continue;
        
        const result = await sendPaymentNotification('reminder', {
            invoice_id: inv.id,
            customer_id: inv.customer.id,
            customer_name: inv.customer.name,
            phone: inv.customer.phone_number,
            invoice_number: inv.invoice_number,
            amount_due: inv.total_amount, // TODO: calculate actual amount due
            due_date: inv.due_date,
            days_until_due: daysBeforeDue,
            invoice_link: `${process.env.APP_URL}/view-invoice.html?id=${inv.view_hash}`,
            company_name: await getSetting('company_name')
        });
        
        if (result.success) results.sent++;
        else {
            results.failed++;
            results.errors.push({ invoice_id: inv.id, error: result.error });
        }
        
        // Rate limiting: wait 1 second between messages
        await new Promise(r => setTimeout(r, 1000));
    }
    
    return results;
}
```

## 4. Bulk Reminder Scheduling

### Using Vercel Cron

Add to `vercel.json`:

```json
{
    "crons": [
        {
            "path": "/api/notifications/cron-reminders",
            "schedule": "0 9 * * *"
        }
    ]
}
```

### Cron Endpoint

Create `api/notifications/cron-reminders.js`:

```javascript
import { sendBulkReminders } from '../_lib/payment-notifications.js';

export const config = { runtime: 'edge' };

export default async function handler(request) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    const results = {
        reminders_3_days: await sendBulkReminders(3, 50),
        reminders_1_day: await sendBulkReminders(1, 50),
        overdue: await sendBulkOverdue(50)
    };
    
    return Response.json(results);
}
```

## 5. Admin UI for Notifications

### Bulk Send UI

In the Payment Center → Invoices tab, add a "Send Reminders" button:

```html
<button class="btn btn-outline-warning" id="btn-send-reminders">
    <i class="bi bi-bell"></i> Send Reminders
</button>
```

Clicking opens modal:

```
╔══════════════════════════════════════════════════════════╗
║ Send Payment Reminders                                   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║ Send reminders to customers with invoices due in:        ║
║                                                          ║
║ ○ 3 days (found: 12 invoices)                           ║
║ ○ 1 day (found: 5 invoices)                             ║
║ ○ Overdue (found: 8 invoices)                           ║
║                                                          ║
║ Maximum messages: [ 50 ▼ ]                               ║
║                                                          ║
║ Note: Messages will be sent via WhatsApp with 1 second  ║
║ delay between each to respect rate limits.              ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                      [ Cancel ]  [ Send Reminders ]      ║
╚══════════════════════════════════════════════════════════╝
```

### Notification History View

Add a sub-tab or section to view sent notifications:

```
╔══════════════════════════════════════════════════════════════════╗
║ Notification History                              [ Filter ▼ ]   ║
╠══════════════════════════════════════════════════════════════════╣
║ Date/Time    │ Type     │ Customer    │ Invoice   │ Status      ║
╠══════════════════════════════════════════════════════════════════╣
║ 29 Mar 09:15 │ Reminder │ John Doe    │ INV-0012  │ ✓ Sent      ║
║ 29 Mar 09:14 │ Reminder │ Jane Smith  │ INV-0011  │ ✓ Sent      ║
║ 28 Mar 14:30 │ Invoice  │ Bob Wilson  │ INV-0015  │ ✓ Sent      ║
║ 28 Mar 10:00 │ Thank You│ Alice Brown │ INV-0009  │ ✓ Sent      ║
║ 27 Mar 09:16 │ Reminder │ Tom Lee     │ INV-0008  │ ✗ Failed    ║
╚══════════════════════════════════════════════════════════════════╝
```

## 6. Rate Limiting & Error Handling

### Rate Limits
- Fonnte free tier: ~100 messages/day
- Implement configurable daily limit in settings
- Track sent count in a daily counter

### Error Handling
- Log all failures with error messages
- Allow retry of failed notifications
- Alert admin if failure rate is high

### Settings
| Key | Default | Description |
|-----|---------|-------------|
| `notification_daily_limit` | 100 | Max notifications per day |
| `reminder_days_before` | 3 | Days before due to send reminder |
| `enable_auto_reminders` | true | Enable/disable cron reminders |

## Future Enhancements

- **Email Channel**: Add email as alternative notification method
- **SMS Fallback**: If WhatsApp fails, try SMS
- **Template Editor**: Admin UI to customize message templates
- **Scheduling**: Let admin schedule specific send times
- **Delivery Status**: Integrate with Fonnte webhooks for delivery confirmation
- **Customer Preferences**: Let customers choose notification preferences
- **Multi-language**: Support Bahasa Indonesia and English templates
