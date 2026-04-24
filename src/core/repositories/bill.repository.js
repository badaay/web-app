/**
 * Bill Repository — Data Access Layer
 * Handles queries for customer_bills table.
 */

export async function upsertBills(dbClient, bills, ignoreDuplicates = false) {
  return dbClient
    .from('customer_bills')
    .upsert(bills, { 
      onConflict: 'customer_id, period_date',
      ignoreDuplicates 
    })
    .select();
}

export async function findByIdWithCustomer(dbClient, id) {
  return dbClient
    .from('customer_bills')
    .select('*, customers(id, name, phone, customer_code)')
    .eq('id', id)
    .maybeSingle();
}

export async function updateStatus(dbClient, id, updates) {
  return dbClient
    .from('customer_bills')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function findAll(dbClient, { limit = 50, offset = 0, status = null } = {}) {
  let query = dbClient
    .from('customer_bills')
    .select('*, customers(name, customer_code)', { count: 'exact' })
    .order('period_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  return query;
}
