import { describe, it, expect, vi } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as billRepo from '../../repositories/bill.repository.js';

describe('BillRepository', () => {
  it('should call upsertBills correctly', async () => {
    const db = createMockDbClient();
    const bills = [{ customer_id: '1', period_date: '2026-04-01' }];
    await billRepo.upsertBills(db, bills, true);

    expect(db.from).toHaveBeenCalledWith('customer_bills');
    expect(db._builder.upsert).toHaveBeenCalledWith(bills, { onConflict: 'customer_id, period_date', ignoreDuplicates: true });
    expect(db._builder.select).toHaveBeenCalled();
  });

  it('should call findByIdWithCustomer correctly', async () => {
    const db = createMockDbClient();
    await billRepo.findByIdWithCustomer(db, '1');

    expect(db.from).toHaveBeenCalledWith('customer_bills');
    expect(db._builder.select).toHaveBeenCalledWith('*, customers(id, name, phone, customer_code)');
    expect(db._builder.eq).toHaveBeenCalledWith('id', '1');
    expect(db._builder.maybeSingle).toHaveBeenCalled();
  });

  it('should call updateStatus correctly', async () => {
    const db = createMockDbClient();
    await billRepo.updateStatus(db, '1', { status: 'paid' });

    expect(db.from).toHaveBeenCalledWith('customer_bills');
    expect(db._builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid', updated_at: expect.any(String) }));
    expect(db._builder.eq).toHaveBeenCalledWith('id', '1');
  });

  it('should call findAll correctly with pagination', async () => {
    const db = createMockDbClient();
    await billRepo.findAll(db, { limit: 10, offset: 0, status: 'unpaid' });

    expect(db.from).toHaveBeenCalledWith('customer_bills');
    expect(db._builder.select).toHaveBeenCalledWith('*, customers(name, customer_code)', { count: 'exact' });
    expect(db._builder.order).toHaveBeenCalledWith('period_date', { ascending: false });
    expect(db._builder.range).toHaveBeenCalledWith(0, 9);
    expect(db._builder.eq).toHaveBeenCalledWith('status', 'unpaid');
  });
});
