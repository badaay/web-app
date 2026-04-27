/**
 * Customer Repository — Data Access Layer
 * Handles ONLY Supabase queries for customers table.
 */

export async function findAll(dbClient, { limit = 50, offset = 0, search = '' } = {}) {
  let query = dbClient
    .from('customers')
    .select('*, roles(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,customer_code.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  return query;
}

export async function findById(dbClient, id) {
  return dbClient
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
}

export async function create(dbClient, payload) {
  return dbClient
    .from('customers')
    .insert(payload)
    .select()
    .single();
}

export async function updateById(dbClient, id, updates) {
  return dbClient
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
}

export async function deleteById(dbClient, id) {
  return dbClient
    .from('customers')
    .delete()
    .eq('id', id);
}

/**
 * Check if a phone number is already in use by another customer.
 * @returns {{ data: object|null }} — data is non-null if duplicate exists
 */
export async function findByPhone(dbClient, phone, excludeId) {
  return dbClient
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .neq('id', excludeId)
    .maybeSingle();
}

/**
 * Count active (non-closed) work orders for a customer.
 * @returns {{ count: number }}
 */
export async function countActiveWorkOrders(dbClient, customerId) {
  const { count } = await dbClient
    .from('work_orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .in('status', ['waiting', 'confirmed', 'open']);

  return { count: count || 0 };
}
