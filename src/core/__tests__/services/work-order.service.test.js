/**
 * Work Order Service — Unit Tests
 * TDD Phase: RED
 */
import { describe, it, expect, vi } from 'vitest';
import { setupServiceTest } from './setup.js';

vi.mock('../../repositories/work-order.repository.js');
vi.mock('../../../../api/_lib/fonnte.js', () => ({
  notifyWorkOrderEvent: vi.fn().mockResolvedValue()
}));
vi.mock('../../repositories/employee.repository.js');
vi.mock('../../repositories/customer.repository.js');
vi.mock('../../repositories/psb.repository.js');
vi.mock('../../repositories/inventory.repository.js');
vi.mock('../../../../src/api/config.js', () => ({
  APP_CONFIG: { AUTH_DOMAIN_SUFFIX: '@test.com' }
}));
vi.mock('../../../../api/_lib/supabase.js', () => ({
  isAdmin: vi.fn().mockResolvedValue(true)
}));

import * as woRepo from '../../repositories/work-order.repository.js';
import * as employeeRepo from '../../repositories/employee.repository.js';
import * as customerRepo from '../../repositories/customer.repository.js';
import * as psbRepo from '../../repositories/psb.repository.js';
import * as inventoryRepo from '../../repositories/inventory.repository.js';
import { isAdmin } from '../../../../api/_lib/supabase.js';
import { notifyWorkOrderEvent } from '../../../../api/_lib/fonnte.js';
import {
  listWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  confirmWorkOrder,
  claimWorkOrder,
  completeWorkOrder,
  verifyWorkOrder,
  requestRevision,
  closeWorkOrder
} from '../../services/work-order.service.js';

describe('WorkOrderService', () => {
  const { mockDb, mockAuth } = setupServiceTest();
  // Ensure the admin mock has createUser
  mockAuth.auth.admin.createUser = vi.fn();


  // ── listWorkOrders ──────────────────────────────────────────────────────

  describe('listWorkOrders', () => {
    it('should return paginated work orders', async () => {
      const wos = [{ id: '1', title: 'PSB' }];
      woRepo.findAll.mockResolvedValue({ data: wos, error: null, count: 1 });

      const result = await listWorkOrders(mockDb, { limit: 50, offset: 0 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: wos, count: 1, limit: 50, offset: 0 });
    });

    it('should pass status and search params', async () => {
      woRepo.findAll.mockResolvedValue({ data: [], error: null, count: 0 });

      await listWorkOrders(mockDb, { limit: 50, offset: 0, status: 'waiting', search: 'psb' });

      expect(woRepo.findAll).toHaveBeenCalledWith(mockDb, {
        limit: 50, offset: 0, status: 'waiting', search: 'psb',
      });
    });
  });

  // ── createWorkOrder ─────────────────────────────────────────────────────

  describe('createWorkOrder', () => {
    it('should reject missing type_id or title', async () => {
      const result1 = await createWorkOrder(mockDb, { title: 'PSB' });
      expect(result1.success).toBe(false);
      expect(result1.statusHint).toBe('bad_request');

      const result2 = await createWorkOrder(mockDb, { type_id: 'uuid' });
      expect(result2.success).toBe(false);
      expect(result2.statusHint).toBe('bad_request');
    });

    it('should create WO and notify', async () => {
      const created = { id: 'uuid-1', title: 'PSB', status: 'waiting' };
      woRepo.create.mockResolvedValue({ data: created, error: null });

      const result = await createWorkOrder(mockDb, { type_id: 't-1', title: 'PSB' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
      expect(notifyWorkOrderEvent).toHaveBeenCalledWith('uuid-1', 'wo_created');
    });
  });

  // ── updateWorkOrder ─────────────────────────────────────────────────────

  describe('updateWorkOrder', () => {
    it('should reject empty updates', async () => {
      const result = await updateWorkOrder(mockDb, 'uuid-1', { bad: 'field' });
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should update successfully', async () => {
      const updated = { id: 'uuid-1', ket: 'Test' };
      woRepo.updateById.mockResolvedValue({ data: updated, error: null });

      const result = await updateWorkOrder(mockDb, 'uuid-1', { ket: 'Test' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
    });
  });

  // ── deleteWorkOrder ─────────────────────────────────────────────────────

  describe('deleteWorkOrder', () => {
    it('should delete successfully', async () => {
      woRepo.deleteById.mockResolvedValue({ error: null });

      const result = await deleteWorkOrder(mockDb, 'uuid-1');

      expect(result.success).toBe(true);
    });
  });

  // ── confirmWorkOrder ────────────────────────────────────────────────────

  describe('confirmWorkOrder', () => {
    it('should reject if not found', async () => {
      woRepo.findById.mockResolvedValue({ data: null });
      const result = await confirmWorkOrder(mockDb, 'ghost');
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('not_found');
    });

    it('should reject if not waiting', async () => {
      woRepo.findById.mockResolvedValue({ data: { id: '1', status: 'open' } });
      const result = await confirmWorkOrder(mockDb, '1');
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('conflict');
    });

    it('should confirm, create monitoring, and notify', async () => {
      woRepo.findById.mockResolvedValue({ data: { id: '1', status: 'waiting' } });
      woRepo.updateById.mockResolvedValue({ data: { id: '1', status: 'confirmed' }, error: null });
      woRepo.createMonitoring.mockResolvedValue({ error: null });

      const result = await confirmWorkOrder(mockDb, '1', 'emp-1');

      expect(result.success).toBe(true);
      expect(woRepo.updateById).toHaveBeenCalledWith(mockDb, '1', { status: 'confirmed', employee_id: 'emp-1' });
      expect(notifyWorkOrderEvent).toHaveBeenCalledWith('1', 'wo_confirmed');
    });
  });

  // ── claimWorkOrder ──────────────────────────────────────────────────────

  describe('claimWorkOrder', () => {
    it('should reject if missing tech id', async () => {
      const result = await claimWorkOrder(mockDb, '1', { ket: 'notes' }, { id: 'user-1' });
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should reject unauthorized claim for others', async () => {
      employeeRepo.findById.mockResolvedValue({ data: { id: 'tech-2', email: 'tech2@test.com' } });
      const result = await claimWorkOrder(mockDb, '1', { technicianId: 'tech-2' }, { id: 'user-1', email: 'tech1@test.com' }, false);
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('forbidden');
    });

    it('should allow admin to claim for others', async () => {
      woRepo.claimAtomic.mockResolvedValue({ data: { id: '1' }, error: null });
      woRepo.upsertAssignments.mockResolvedValue({ error: null });

      const result = await claimWorkOrder(mockDb, '1', { technicianId: 'tech-2' }, { id: 'admin-1' }, true);
      
      expect(result.success).toBe(true);
      expect(woRepo.claimAtomic).toHaveBeenCalledWith(mockDb, '1', 'tech-2', undefined);
      expect(notifyWorkOrderEvent).toHaveBeenCalledWith('1', 'wo_open');
    });

    it('should reject if WO not available (race condition)', async () => {
      woRepo.claimAtomic.mockResolvedValue({ data: null, error: null });

      const result = await claimWorkOrder(mockDb, '1', { technicianId: 'tech-1' }, { id: 'tech-1' }, false);
      
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('conflict');
    });
  });

  // ── closeWorkOrder ──────────────────────────────────────────────────────

  describe('closeWorkOrder', () => {
    it('should reject if WO not found', async () => {
      woRepo.findByIdWithAssignments.mockResolvedValue({ data: null });
      const result = await closeWorkOrder(mockDb, mockAuth, '1', {}, { id: 'user-1' }, false);
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('not_found');
    });

    it('should reject unauthorized closure', async () => {
      woRepo.findByIdWithAssignments.mockResolvedValue({ 
        data: { id: '1', status: 'completed', work_order_assignments: [{ employee_id: 'tech-2' }] } 
      });
      employeeRepo.findById.mockResolvedValue({ data: { id: 'tech-2', email: 'tech2@test.com' } });
      isAdmin.mockResolvedValue(false);
      
      const result = await closeWorkOrder(mockDb, mockAuth, '1', {}, { id: 'user-1', email: 'tech1@test.com' }, false);
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('forbidden');
    });

    it('should call rpc to close and notify', async () => {
      woRepo.findByIdWithAssignments.mockResolvedValue({ 
        data: { id: '1', status: 'completed', master_queue_types: { base_point: 10 }, work_order_assignments: [{ id: 'a1', employee_id: 'tech-1', assignment_role: 'lead' }] } 
      });
      woRepo.closeWithPointsRpc.mockResolvedValue({ data: {}, error: null });
      woRepo.transitionStatus.mockResolvedValue({ data: { id: '1', status: 'closed' }, error: null });
      woRepo.updateAssignmentPoints.mockResolvedValue({ error: null });
      isAdmin.mockResolvedValue(true);

      const result = await closeWorkOrder(mockDb, mockAuth, '1', { notes: 'done' }, { id: 'admin-1' }, false);

      expect(result.success).toBe(true);
      expect(woRepo.closeWithPointsRpc).toHaveBeenCalledWith(mockDb, '1', { notes: 'done' });
      expect(notifyWorkOrderEvent).toHaveBeenCalledWith('1', 'wo_closed');
    });
  });

  // ── completeWorkOrder ───────────────────────────────────────────────────

  describe('completeWorkOrder', () => {
    it('should transition status to completed and notify', async () => {
      woRepo.findByIdWithAssignments.mockResolvedValue({ 
        data: { id: '1', status: 'open', work_order_assignments: [{ employee_id: 'tech-1' }] } 
      });
      woRepo.transitionStatus.mockResolvedValue({ data: { id: '1', status: 'completed' }, error: null });

      const result = await completeWorkOrder(mockDb, '1', { id: 'tech-1' });

      expect(result.success).toBe(true);
      expect(woRepo.transitionStatus).toHaveBeenCalledWith(mockDb, '1', 'open', 'completed', expect.any(Object));
      expect(notifyWorkOrderEvent).toHaveBeenCalledWith('1', 'wo_completed');
    });

    it('should reject if not assigned (technician)', async () => {
      isAdmin.mockResolvedValue(false);
      woRepo.findByIdWithAssignments.mockResolvedValue({ 
        data: { id: '1', status: 'open', work_order_assignments: [{ employee_id: 'tech-2' }] } 
      });
      const result = await completeWorkOrder(mockDb, '1', { id: 'tech-1' });
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('forbidden');
    });

    it('should allow admin to complete even if not assigned', async () => {
      isAdmin.mockResolvedValue(true);
      woRepo.findByIdWithAssignments.mockResolvedValue({ 
        data: { id: '1', status: 'open', work_order_assignments: [{ employee_id: 'tech-2' }] } 
      });
      woRepo.transitionStatus.mockResolvedValue({ data: { id: '1', status: 'completed' }, error: null });

      const result = await completeWorkOrder(mockDb, '1', { id: 'admin-1' });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
    });
  });

  // ── requestRevision ─────────────────────────────────────────────────────

  describe('requestRevision', () => {
    it('should transition status back to open with notes', async () => {
      isAdmin.mockResolvedValue(true);
      woRepo.transitionStatus.mockResolvedValue({ data: { id: '1', status: 'open' }, error: null });

      const result = await requestRevision(mockDb, '1', 'Foto tidak jelas', { id: 'admin-1' });

      expect(result.success).toBe(true);
      expect(woRepo.transitionStatus).toHaveBeenCalledWith(mockDb, '1', 'completed', 'open', {
        ket: '[REVISION] Foto tidak jelas'
      });
      expect(notifyWorkOrderEvent).toHaveBeenCalledWith('1', 'wo_revision_requested');
    });
  });

  // ── verifyWorkOrder (Story 1.2) ──────────────────────────────────────────

  describe('verifyWorkOrder', () => {
    it('should calculate final points with bonus and deductions', async () => {
      const wo = { 
        id: '1', 
        status: 'completed', 
        master_queue_types: { base_point: 100 },
        work_order_assignments: [
          { id: 'a1', employee_id: 'lead-1', assignment_role: 'lead' },
          { id: 'a2', employee_id: 'mem-1', assignment_role: 'member' }
        ]
      };
      woRepo.findByIdWithAssignments.mockResolvedValue({ data: wo });
      woRepo.transitionStatus.mockResolvedValue({ data: { ...wo, status: 'closed' }, error: null });
      woRepo.closeWithPointsRpc.mockResolvedValue({ data: {}, error: null });
      woRepo.updateAssignmentPoints.mockResolvedValue({ error: null });

      const adjustments = [
        { employee_id: 'lead-1', bonus_points: 20, deduction_points: 10, adjustment_reason: 'Good work' },
        { employee_id: 'mem-1', bonus_points: 0, deduction_points: 80, adjustment_reason: 'Late' }
      ];

      isAdmin.mockResolvedValue(true);
      const result = await verifyWorkOrder(mockDb, mockAuth, '1', { adjustments }, { id: 'admin-1' });

      expect(result.success).toBe(true);
      
      // Lead: 100 (base) + 20 (bonus) - 10 (deduction) = 110
      expect(woRepo.updateAssignmentPoints).toHaveBeenCalledWith(mockDb, 'a1', expect.objectContaining({
        points_earned: 110,
        bonus_points: 20,
        deduction_points: 10
      }));

      // Member: 70 (base) + 0 (bonus) - 80 (deduction) = -10 -> Floor 0
      expect(woRepo.updateAssignmentPoints).toHaveBeenCalledWith(mockDb, 'a2', expect.objectContaining({
        points_earned: 0,
        bonus_points: 0,
        deduction_points: 80
      }));
    });

    it('should calculate material cost and decrement stock during verification', async () => {
      const wo = { 
        id: '1', 
        status: 'completed', 
        master_queue_types: { base_point: 100 },
        work_order_assignments: [{ id: 'a1', employee_id: 'lead-1', assignment_role: 'lead' }]
      };
      woRepo.findByIdWithAssignments.mockResolvedValue({ data: wo });
      woRepo.transitionStatus.mockResolvedValue({ data: { ...wo, status: 'closed' }, error: null });
      woRepo.closeWithPointsRpc.mockResolvedValue({ data: {}, error: null });
      woRepo.updateAssignmentPoints.mockResolvedValue({ error: null });
      
      const inventory_used = [
        { item_id: 'inv-1', quantity: 2 },
        { item_id: 'inv-2', quantity: 5 }
      ];
      
      inventoryRepo.findManyByIds.mockResolvedValue({
        data: [
          { id: 'inv-1', name: 'ONT', unit_cost: 200000, unit: 'pcs' },
          { id: 'inv-2', name: 'Cable', unit_cost: 5000, unit: 'm' }
        ],
        error: null
      });
      inventoryRepo.decrementStock.mockResolvedValue({ error: null });

      isAdmin.mockResolvedValue(true);
      const result = await verifyWorkOrder(mockDb, mockAuth, '1', { inventory_used }, { id: 'admin-1' });

      expect(result.success).toBe(true);
      
      // Total cost: (2 * 200000) + (5 * 5000) = 400000 + 25000 = 425000
      expect(woRepo.transitionStatus).toHaveBeenCalledWith(
        mockDb, '1', 'completed', 'closed', 
        expect.objectContaining({
          material_cost: 425000,
          inventory_used: expect.arrayContaining([
            expect.objectContaining({ item_id: 'inv-1', name: 'ONT', subtotal: 400000 }),
            expect.objectContaining({ item_id: 'inv-2', name: 'Cable', subtotal: 25000 })
          ])
        })
      );

      expect(inventoryRepo.decrementStock).toHaveBeenCalledTimes(2);
      expect(inventoryRepo.decrementStock).toHaveBeenCalledWith(mockDb, 'inv-1', 2);
      expect(inventoryRepo.decrementStock).toHaveBeenCalledWith(mockDb, 'inv-2', 5);
    });

    it('should reject if not in completed status', async () => {
      woRepo.findByIdWithAssignments.mockResolvedValue({ data: { id: '1', status: 'open' } });
      isAdmin.mockResolvedValue(true);
      const result = await verifyWorkOrder(mockDb, mockAuth, '1', {}, { id: 'admin-1' });
      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('bad_request');
    });
  });
});
