/**
 * Role Repository — Data Access Layer
 * Handles ONLY Supabase queries for roles table.
 */

export async function findAll(dbClient) {
  return dbClient
    .from('roles')
    .select('*')
    .order('name');
}

export async function create(dbClient, payload) {
  return dbClient
    .from('roles')
    .insert(payload)
    .select()
    .single();
}
