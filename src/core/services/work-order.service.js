/**
 * Work Order Service — Business Logic Layer
 * Orchestrates WO lifecycle, state transitions, and notifications.
 */
import * as woRepo from '../repositories/work-order.repository.js';
import * as psbRepo from '../repositories/psb.repository.js';
import * as customerRepo from '../repositories/customer.repository.js';
import * as employeeRepo from '../repositories/employee.repository.js';
import * as inventoryRepo from '../repositories/inventory.repository.js';
import { processWorkOrderInventory } from './inventory.service.js';
import { ok, created, badRequest, notFound, conflict, serverError, forbidden } from '../utils/http-mapper.js';
import { ALLOWED_WORK_ORDER_FIELDS } from '../utils/constants.js';
import { whitelist } from '../utils/validators.js';
import { notifyWorkOrderEvent } from '../../../api/_lib/fonnte.js';
import { APP_CONFIG } from '../../../src/api/config.js';
import { isAdmin } from '../../../api/_lib/supabase.js';

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

export async function completeWorkOrder(dbClient, id, user) {
  if (!id) return badRequest('Work order id is required');
  if (!user) return forbidden('Authentication required');

  const { data: wo } = await woRepo.findByIdWithAssignments(dbClient, id);
  if (!wo) return notFound('Work order not found');
  if (wo.status !== 'open') return conflict(`Cannot complete: current status is '${wo.status}'`);

  const assignments = wo.work_order_assignments || [];
  const isAssigned = assignments.some(a => a.employee_id === user.id);
  const canComplete = isAssigned || (await isAdmin(dbClient, user.id));
  if (!canComplete) return forbidden('You are not assigned to this work order');

  const { data: updatedWO, error } = await woRepo.transitionStatus(dbClient, id, 'open', 'completed', {
    completed_at: new Date().toISOString()
  });

  if (error) return serverError(`Failed to complete: ${error.message}`);
  if (!updatedWO) return conflict('Work order status changed while processing');

  await notifyWorkOrderEvent(id, 'wo_completed').catch(e => console.error('[WO-NOTIF] Error:', e));

  return ok(updatedWO);
}

export async function requestRevision(dbClient, id, reason, user) {
  if (!id) return badRequest('Work order id is required');
  if (!reason) return badRequest('Revision reason is required');
  if (!user) return forbidden('Authentication required');

  if (!(await isAdmin(dbClient, user.id))) return forbidden('Only admins can request revisions');

  const { data: updatedWO, error } = await woRepo.transitionStatus(dbClient, id, 'completed', 'open', {
    ket: `[REVISION] ${reason}`
  });

  if (error) return serverError(`Failed to request revision: ${error.message}`);
  if (!updatedWO) return conflict('Work order is not in completed status');

  await notifyWorkOrderEvent(id, 'wo_revision_requested').catch(e => console.error('[WO-NOTIF] Error:', e));

  return ok(updatedWO);
}

/**
 * verifyWorkOrder (Story 1.1 + 1.2 + 2.3)
 * Approves a completed job, awards points, and tracks inventory costs.
 */
export async function verifyWorkOrder(dbClient, authClient, id, body, user, isAuthorizedParam = false) {
  if (!id) return badRequest('Work order id is required');
  
  if (!user && !isAuthorizedParam) return forbidden('Authentication required');
  
  const isAuthorized = isAuthorizedParam || (await isAdmin(dbClient, user.id));
  if (!isAuthorized) return forbidden('Only admins can verify work orders');

  const { adjustments = [], closeData = {}, inventory_used = [] } = body;

  const { data: wo, error: fetchErr } = await woRepo.findByIdWithAssignments(dbClient, id);
  if (fetchErr || !wo) return notFound('Work order not found');
  if (wo.status !== 'completed') return badRequest(`Work order is not in 'completed' status (current: ${wo.status})`);

  // 0. Process Inventory Usage (Story 2.3)
  const { totalMaterialCost, inventorySnapshot } = await processWorkOrderInventory(dbClient, inventory_used);


  // 1. Transition status to closed + Record Financial Metadata (AC3)
  const { data: updatedWO, error: transitionErr } = await woRepo.transitionStatus(dbClient, id, 'completed', 'closed', {
    material_cost: totalMaterialCost,
    inventory_used: inventorySnapshot
  });
  if (transitionErr || !updatedWO) return serverError('Failed to transition work order to closed');

  // 2. Award Points with Adjustments (Project B)
  const { data: rpcResult, error: rpcError } = await woRepo.closeWithPointsRpc(dbClient, id, closeData);
  if (rpcError) console.warn('[POINT-RPC] Warning:', rpcError.message);

  // 3. Update Local Assignment Points (Story 1.2)
  const assignments = wo.work_order_assignments || [];
  const basePoint = wo.master_queue_types?.base_point || 0;

  for (const assignment of assignments) {
    const adj = adjustments.find(a => a.employee_id === assignment.employee_id) || {};
    const bonus = parseInt(adj.bonus_points || 0);
    const deduction = parseInt(adj.deduction_points || 0);
    const reason = adj.adjustment_reason || '';

    if ((bonus !== 0 || deduction !== 0) && !reason) {
      console.warn(`[WO-VERIFY] Warning: Adjustment made for ${assignment.employee_id} without reason.`);
    }

    // Calculation Logic: Base * Multiplier + Bonus - Deduction
    const baseCalculated = assignment.assignment_role === 'lead' ? basePoint : Math.floor(basePoint * 0.7);
    const finalPoints = Math.max(0, baseCalculated + bonus - deduction);

    await woRepo.updateAssignmentPoints(dbClient, assignment.id, {
      points_earned: finalPoints,
      bonus_points: bonus,
      deduction_points: deduction,
      adjustment_reason: reason
    }).catch(e => console.error(`[WO-ASSIGN-UPDATE] Error for ${assignment.id}:`, e.message));
  }

  // 4. Handle PSB lifecycle (Hardware sync + Customer Auth)
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

    if (closeData.mac_address || closeData.damping) {
      await customerRepo.updateById(dbClient, wo.customer_id, {
        mac_address: closeData.mac_address || undefined,
        damping: closeData.damping || undefined
      });
    }
  }

  await notifyWorkOrderEvent(id, 'wo_closed').catch(e => console.error('[WO-NOTIF] Error:', e));

  return ok({ message: 'Work order verified and closed', data: updatedWO });
}

// Deprecated: Refactored into verifyWorkOrder
export async function closeWorkOrder(dbClient, authClient, id, closeData, user, isAuthorizedParam = false) {
  return verifyWorkOrder(dbClient, authClient, id, { closeData }, user, isAuthorizedParam);
}
