/**
 * Work Order Repository — Data Access Layer
 * Handles ONLY Supabase queries for work_orders and related tables.
 */

export async function findAll(dbClient, { limit = 50, offset = 0, status = null, search = '' } = {}) {
  let query = dbClient
    .from('work_orders')
    .select(
      `*, customers(name, address, phone, lat, lng, packet),
       work_order_assignments(assignment_role, employees(name)),
       master_queue_types(name, color, icon, base_point)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('title', `%${search}%`);

  return query;
}

export async function findById(dbClient, id) {
  return dbClient
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
}

export async function create(dbClient, payload) {
  return dbClient
    .from('work_orders')
    .insert(payload)
    .select('*, customers(name), employees!employee_id(name)')
    .single();
}

export async function updateById(dbClient, id, updates) {
  return dbClient
    .from('work_orders')
    .update(updates)
    .eq('id', id)
    .select('*, customers(name, phone, address), employees(name)')
    .single();
}

export async function deleteById(dbClient, id) {
  return dbClient
    .from('work_orders')
    .delete()
    .eq('id', id);
}

export async function createMonitoring(dbClient, payload) {
  return dbClient
    .from('installation_monitorings')
    .insert(payload);
}

export async function claimAtomic(dbClient, id, technicianId, ket) {
  return dbClient
    .from('work_orders')
    .update({
      claimed_by: technicianId,
      status: 'open',
      claimed_at: new Date().toISOString(),
      ...(ket && { ket })
    })
    .eq('id', id)
    .eq('status', 'confirmed')
    .is('claimed_by', null)
    .select('*')
    .maybeSingle();
}

export async function upsertAssignments(dbClient, assignments) {
  return dbClient
    .from('work_order_assignments')
    .upsert(assignments, { onConflict: 'work_order_id,employee_id' });
}

export async function findByIdWithAssignments(dbClient, id) {
  return dbClient
    .from('work_orders')
    .select('*, master_queue_types(base_point), work_order_assignments(*)')
    .eq('id', id)
    .maybeSingle();
}

export async function closeWithPointsRpc(dbClient, id, closeData) {
  return dbClient.rpc('close_work_order_with_points', {
    p_work_order_id: id,
    p_close_data: closeData
  });
}

export async function updateAssignmentsPoints(dbClient, assignmentId, pointsToAdd) {
  return dbClient
    .from('work_order_assignments')
    .update({ points_earned: pointsToAdd })
    .eq('id', assignmentId);
}
