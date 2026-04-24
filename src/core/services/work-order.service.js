/**
 * Work Order Service — Business Logic Layer
 * Orchestrates WO lifecycle, state transitions, and notifications.
 */
import * as woRepo from '../repositories/work-order.repository.js';
import * as psbRepo from '../repositories/psb.repository.js';
import * as customerRepo from '../repositories/customer.repository.js';
import * as employeeRepo from '../repositories/employee.repository.js';
import { ok, created, badRequest, notFound, conflict, serverError, forbidden } from '../utils/http-mapper.js';
import { ALLOWED_WORK_ORDER_FIELDS } from '../utils/constants.js';
import { whitelist } from '../utils/validators.js';
import { notifyWorkOrderEvent } from '../../../api/_lib/fonnte.js';
import { APP_CONFIG } from '../../../src/api/config.js';

export async function listWorkOrders(dbClient, { limit = 50, offset = 0, status = null, search = '' } = {}) {
  const { data, error, count } = await woRepo.findAll(dbClient, { limit, offset, status, search });
  if (error) return serverError(`Database error: ${error.message}`);
  return ok({ data, count, limit, offset });
}

export async function createWorkOrder(dbClient, body) {
  if (!body.type_id || !body.title) return badRequest('type_id and title are required');

  const payload = {
    ...whitelist(body, ALLOWED_WORK_ORDER_FIELDS),
    status: 'waiting',
    created_at: new Date().toISOString()
  };

  const { data, error } = await woRepo.create(dbClient, payload);
  if (error) return serverError(`Database error: ${error.message}`);

  // Notify
  await notifyWorkOrderEvent(data.id, 'wo_created').catch(e => console.error('[WO-NOTIF] Error:', e));

  return created(data);
}

export async function updateWorkOrder(dbClient, id, body) {
  if (!id) return badRequest('Work order id is required');
  const updates = whitelist(body, ALLOWED_WORK_ORDER_FIELDS);
  if (Object.keys(updates).length === 0) return badRequest('No valid fields to update');

  const { data, error } = await woRepo.updateById(dbClient, id, updates);
  if (error) return serverError(`Database error: ${error.message}`);
  if (!data) return notFound('Work order not found');

  return ok(data);
}

export async function deleteWorkOrder(dbClient, id) {
  if (!id) return badRequest('Work order id is required');
  const { error } = await woRepo.deleteById(dbClient, id);
  if (error) return serverError(`Delete failed: ${error.message}`);
  return ok({ message: 'Work order deleted' });
}

export async function confirmWorkOrder(dbClient, id, employeeId) {
  if (!id) return badRequest('Work order id is required');

  const { data: wo } = await woRepo.findById(dbClient, id);
  if (!wo) return notFound('Work order not found');
  if (wo.status !== 'waiting') return conflict(`Cannot confirm: current status is '${wo.status}'`);

  const updatePayload = { status: 'confirmed' };
  if (employeeId) updatePayload.employee_id = employeeId;

  const { data: updatedWO, error: updateErr } = await woRepo.updateById(dbClient, id, updatePayload);
  if (updateErr) return serverError(`Failed to confirm: ${updateErr.message}`);

  // Create monitoring record
  const monitorPayload = {
    work_order_id: id,
    employee_id: employeeId || null,
    notes: 'Work order dikonfirmasi oleh admin.',
  };
  await woRepo.createMonitoring(dbClient, monitorPayload).catch(e => console.warn('Monitor record skip:', e.message));

  await notifyWorkOrderEvent(id, 'wo_confirmed').catch(e => console.error('[WO-NOTIF] Error:', e));

  return ok(updatedWO);
}

export async function claimWorkOrder(dbClient, id, body, user, isAuthorizedParam = false) {
  if (!id) return badRequest('Work order id is required');
  const { technicianId, teamMembers = [], ket } = body;
  if (!technicianId) return badRequest('technicianId is required');

  let isAuthorized = (technicianId === user.id) || isAuthorizedParam;

  if (!isAuthorized) {
    const { data: techRecord } = await employeeRepo.findById(dbClient, technicianId);
    if (techRecord && techRecord.email === user.email) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) return forbidden('You can only claim work orders for yourself');

  const { data: wo, error: woErr } = await woRepo.claimAtomic(dbClient, id, technicianId, ket);
  if (woErr) return serverError(`Database error: ${woErr.message}`);
  if (!wo) return conflict('Work order is no longer available or already claimed');

  // Team assignments
  const assignmentRows = [
    { work_order_id: id, employee_id: technicianId, assignment_role: 'lead', assigned_at: new Date().toISOString() },
    ...teamMembers.map(memberId => ({
      work_order_id: id, employee_id: memberId, assignment_role: 'member', assigned_at: new Date().toISOString()
    }))
  ];

  await woRepo.upsertAssignments(dbClient, assignmentRows).catch(e => console.warn('Assignment skip:', e.message));

  await notifyWorkOrderEvent(id, 'wo_open').catch(e => console.error('[WO-NOTIF] Error:', e));

  return ok(wo);
}

export async function closeWorkOrder(dbClient, authClient, id, closeData, user, isAuthorizedParam = false) {
  if (!id) return badRequest('Work order id is required');

  const { data: wo, error: fetchErr } = await woRepo.findByIdWithAssignments(dbClient, id);
  if (fetchErr || !wo) return notFound('Work order not found');
  if (wo.status === 'closed') return badRequest('Work order is already closed');

  const assignments = wo.work_order_assignments || [];
  let isAuthorized = assignments.some(a => a.employee_id === user.id) || isAuthorizedParam;

  if (!isAuthorized) {
    const employeeIds = assignments.map(a => a.employee_id);
    for (const empId of employeeIds) {
      const { data: techRow } = await employeeRepo.findById(dbClient, empId);
      if (techRow && techRow.email === user.email) {
        isAuthorized = true;
        break;
      }
    }
  }

  if (!isAuthorized) return forbidden('You can only close work orders assigned to you');

  // 1. Mark as closed + Award points (Project B)
  const { data: rpcResult, error: rpcError } = await woRepo.closeWithPointsRpc(dbClient, id, closeData);
  if (rpcError) return serverError(`Failed to close work order: ${rpcError.message}`);

  // 2. Handle PSB lifecycle if applicable
  if (wo.customer_id) {
    const { data: psb } = await psbRepo.findById(dbClient, wo.customer_id);
    
    if (psb && psb.status !== 'completed') {
      const generatedPassword = Math.random().toString(36).slice(-8);
      const email = `${psb.phone}${APP_CONFIG?.AUTH_DOMAIN_SUFFIX || '@sifatih.com'}`;
      
      const { error: authErr } = await authClient.auth.admin.createUser({
        id: wo.customer_id,
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { role: 'customer', name: psb.name }
      });
      
      if (!authErr) {
        await psbRepo.updateStatus(dbClient, psb.id, 'completed');
        await customerRepo.updateById(dbClient, psb.id, { email });
        console.log(`[PSB-AUTO] Auth created for ${psb.phone}. Pwd: ${generatedPassword}`);
      }
    }

    // 3. Hardware sync
    if (closeData.mac_address || closeData.damping) {
      await customerRepo.updateById(dbClient, wo.customer_id, {
        mac_address: closeData.mac_address || undefined,
        damping: closeData.damping || undefined
      });
    }
  }

  // 4. Update assignment points for local reference
  if (assignments.length > 0 && wo.master_queue_types?.base_point) {
    const basePoint = wo.master_queue_types.base_point;
    for (const assignment of assignments) {
      const points = assignment.assignment_role === 'lead' ? basePoint : Math.floor(basePoint * 0.7);
      await woRepo.updateAssignmentsPoints(dbClient, assignment.id, points);
    }
  }

  await notifyWorkOrderEvent(id, 'wo_closed').catch(e => console.error('[WO-NOTIF] Error:', e));

  return ok(rpcResult);
}
