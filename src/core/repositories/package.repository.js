/**
 * Package Repository — Data Access Layer
 * Handles ONLY Supabase queries for internet_packages table.
 */

export async function findAll(dbClient) {
  return dbClient
    .from('internet_packages')
    .select('*')
    .order('name');
}

export async function findById(dbClient, id) {
  return dbClient
    .from('internet_packages')
    .select('*')
    .eq('id', id)
    .single();
}

export async function create(dbClient, payload) {
  return dbClient
    .from('internet_packages')
    .insert(payload)
    .select()
    .single();
}

export async function updateById(dbClient, id, updates) {
  return dbClient
    .from('internet_packages')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
}

export async function deleteById(dbClient, id) {
  return dbClient
    .from('internet_packages')
    .delete()
    .eq('id', id);
}
