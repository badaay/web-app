/**
 * Bill Service — Business Logic Layer
 * Handles monthly bill generation and payment processing.
 */
import * as billRepo from '../repositories/bill.repository.js';
import * as customerRepo from '../repositories/customer.repository.js';
import * as packageRepo from '../repositories/package.repository.js';
import * as financeRepo from '../repositories/finance.repository.js';
import { ok, badRequest, notFound, serverError } from '../utils/http-mapper.js';
import { enqueueNotification, getTokenConfig } from '../../../api/_lib/fonnte.js';
import { APP_CONFIG } from '../../../src/api/config.js';

export async function generateMonthlyBills(dbClient, dbClientB, month, year, overwrite = true) {
  if (!month || !year) return badRequest('Month and Year are required');

  const periodDate = `${year}-${String(month).padStart(2, '0')}-01`;

  // 1. Get packages to map prices
  const { data: packages } = await packageRepo.findAll(dbClient);
  const packagePrices = Object.fromEntries((packages || []).map(p => [p.name, p.price]));

  // 2. Get active customers
  const { data: customers, error: custErr } = await customerRepo.findAll(dbClient);
  if (custErr) return serverError(`Customer fetch error: ${custErr.message}`);
  if (!customers || customers.length === 0) return ok({ message: 'No customers found', count: 0 });

  const billsToInsert = [];
  const dueDateObj = new Date(periodDate);
  dueDateObj.setDate(dueDateObj.getDate() + 10);
  const dueDate = dueDateObj.toISOString().split('T')[0];

  for (const customer of customers) {
    const price = packagePrices[customer.packet] || 0;
    if (price <= 0) continue;

    billsToInsert.push({
      customer_id: customer.id,
      period_date: periodDate,
      due_date: dueDate,
      amount: price,
      status: 'unpaid',
      secret_token: crypto.randomUUID().replace(/-/g, '')
    });
  }

  if (billsToInsert.length === 0) return ok({ message: 'No bills to generate', count: 0 });

  // 3. Upsert into DB
  const { data, error } = await billRepo.upsertBills(dbClientB || dbClient, billsToInsert, !overwrite);
  if (error) return serverError(`Upsert failed: ${error.message}`);

  return ok({ 
    message: `Generated ${data.length} bills for ${periodDate}`, 
    count: data.length 
  });
}

export async function markBillAsPaid(dbClient, dbClientB, billId, paymentData, user) {
  if (!billId) return badRequest('Bill ID is required');

  const { data: bill, error: fetchErr } = await billRepo.findByIdWithCustomer(dbClient, billId);
  if (fetchErr || !bill) return notFound('Bill not found');
  if (bill.status === 'paid') return badRequest('Bill is already paid');

  const { payment_method = 'transfer', bank_account_id, payment_date, notes } = paymentData;
  const realPaymentDate = payment_date || new Date().toISOString();

  // 1. Update bill status
  const { error: updateErr } = await billRepo.updateStatus(dbClient, billId, {
    status: 'paid',
    payment_method,
    payment_date: realPaymentDate,
    notes: notes || bill.notes
  });
  if (updateErr) return serverError(`Update failed: ${updateErr.message}`);

  // 2. Create financial transaction (Ledger)
  if (dbClientB) {
    const txPayload = {
      transaction_date: realPaymentDate.split('T')[0],
      transaction_type: 'income',
      category: 'Layanan Internet',
      description: `Pembayaran internet ${bill.customers?.name} (${bill.customers?.customer_code || ''})`,
      amount: bill.amount,
      bank_account_id: bank_account_id || null,
      reference_no: bill.id,
      created_by: user.id
    };
    await financeRepo.createTransaction(dbClientB, txPayload).catch(e => console.error('[Finance] Ledger skip:', e.message));
  }

  // 3. Notify
  const cfg = await getTokenConfig().catch(() => null);
  if (cfg && bill.customers?.phone) {
    const variables = {
      name: bill.customers.name,
      period: new Date(bill.period_date).toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
      amount: new Intl.NumberFormat('id-ID').format(bill.amount),
      invoice_link: `${APP_CONFIG?.BASE_URL || ''}/invoice.html?token=${bill.secret_token}`
    };

    await enqueueNotification({
      recipient: bill.customers.phone,
      messageType: 'payment_received',
      payload: variables,
      priority: 1,
      refId: `pay-${bill.id}`,
      sourceId: bill.customers.id,
      routingMap: cfg.routing
    }).catch(e => console.error('[BillNotif] Skip:', e.message));
  }

  return ok({ message: 'Bill marked as paid' });
}
