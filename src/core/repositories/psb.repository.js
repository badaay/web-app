/**
 * PSB Repository — Data Access Layer
 * Handles queries for psb_registrations table.
 */

export async function findById(dbClient, id) {
  return dbClient
    .from('psb_registrations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
}

export async function updateStatus(dbClient, id, status) {
  return dbClient
    .from('psb_registrations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function findAll(dbClient, { limit = 50, offset = 0, status = null } = {}) {
  let query = dbClient
    .from('psb_registrations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  return query;
}
