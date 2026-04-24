import { describe, it, expect } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as woRepo from '../../repositories/work-order.repository.js';

describe('WorkOrderRepository', () => {
  it('should call findAll correctly with status and search', async () => {
    const db = createMockDbClient();
    await woRepo.findAll(db, { limit: 10, offset: 0, status: 'open', search: 'Fix' });

    expect(db.from).toHaveBeenCalledWith('work_orders');
    expect(db._builder.select).toHaveBeenCalled();
    expect(db._builder.eq).toHaveBeenCalledWith('status', 'open');
    expect(db._builder.ilike).toHaveBeenCalledWith('title', '%Fix%');
    expect(db._builder.range).toHaveBeenCalledWith(0, 9);
    expect(db._builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should call claimAtomic with safety constraints', async () => {
    const db = createMockDbClient();
    await woRepo.claimAtomic(db, '1', 'tech-1', 'Ket');

    expect(db.from).toHaveBeenCalledWith('work_orders');
    expect(db._builder.update).toHaveBeenCalledWith(expect.objectContaining({
      claimed_by: 'tech-1',
      status: 'open',
      ket: 'Ket'
    }));
    expect(db._builder.eq).toHaveBeenCalledWith('id', '1');
    expect(db._builder.eq).toHaveBeenCalledWith('status', 'confirmed');
    expect(db._builder.is).toHaveBeenCalledWith('claimed_by', null);
    expect(db._builder.maybeSingle).toHaveBeenCalled();
  });

  it('should call closeWithPointsRpc correctly', async () => {
    const db = createMockDbClient();
    await woRepo.closeWithPointsRpc(db, '1', { notes: 'Done' });

    expect(db.rpc).toHaveBeenCalledWith('close_work_order_with_points', {
      p_work_order_id: '1',
      p_close_data: { notes: 'Done' }
    });
  });

  it('should call upsertAssignments correctly', async () => {
    const db = createMockDbClient();
    const assignments = [{ work_order_id: '1', employee_id: '2' }];
    await woRepo.upsertAssignments(db, assignments);

    expect(db.from).toHaveBeenCalledWith('work_order_assignments');
    expect(db._builder.upsert).toHaveBeenCalledWith(assignments, { onConflict: 'work_order_id,employee_id' });
  });
});
