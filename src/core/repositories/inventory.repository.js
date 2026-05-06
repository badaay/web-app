/**
 * Inventory Repository — Data Access Layer
 * Handles ONLY Supabase queries for inventory_items table.
 */

export async function findAll(dbClient) {
  return dbClient
    .from('inventory_items')
    .select('*')
    .order('name');
}

export async function findById(dbClient, id) {
  return dbClient
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single();
}

export async function create(dbClient, payload) {
  return dbClient
    .from('inventory_items')
    .insert(payload)
    .select()
    .single();
}

export async function updateById(dbClient, id, updates) {
  return dbClient
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
}

export async function deleteById(dbClient, id) {
  return dbClient
    .from('inventory_items')
    .delete()
    .eq('id', id);
}

export async function findManyByIds(dbClient, ids) {
  return dbClient
    .from('inventory_items')
    .select('id, name, unit_cost, unit')
    .in('id', ids);
}

export async function decrementStock(dbClient, id, amount) {
  return dbClient.rpc('decrement_inventory_stock', { 
    item_id: id, 
    amount: amount 
  });
}
