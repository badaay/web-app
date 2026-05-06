/**
 * Employee Repository — Data Access Layer
 * Handles ONLY Supabase queries for employees table.
 */

export async function findAll(dbClient, { limit = 50, offset = 0, search = '' } = {}) {
  let query = dbClient
    .from('employees')
    .select('*, roles(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%,email.ilike.%${search}%`);
  }

  return query;
}

export async function findById(dbClient, id) {
  return dbClient
    .from('employees')
    .select('*')
    .eq('id', id)
    .maybeSingle();
}

export async function create(dbClient, payload) {
  return dbClient
    .from('employees')
    .insert(payload)
    .select()
    .single();
}

export async function updateById(dbClient, id, updates) {
  return dbClient
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
}

export async function deleteById(dbClient, id) {
  return dbClient
    .from('employees')
    .delete()
    .eq('id', id);
}

// ── Salary Config (Wave 2.2) ────────────────────────────────────────────────

export async function findSalaryConfigs(dbClient, employeeId) {
  return dbClient
    .from('employee_salary_configs')
    .select('*')
    .eq('employee_id', employeeId)
    .order('effective_from', { ascending: false });
}

export async function upsertSalaryConfig(dbClient, payload) {
  return dbClient
    .from('employee_salary_configs')
    .upsert(payload, { onConflict: 'employee_id,effective_from' })
    .select()
    .single();
}
