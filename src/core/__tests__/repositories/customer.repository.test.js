import { describe, it, expect } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as customerRepo from '../../repositories/customer.repository.js';

describe('CustomerRepository', () => {
  it('should call findAll correctly with pagination', async () => {
    const db = createMockDbClient();
    await customerRepo.findAll(db, { limit: 10, offset: 0, search: 'Budi' });

    expect(db.from).toHaveBeenCalledWith('customers');
    expect(db._builder.select).toHaveBeenCalledWith('*, roles(name)', { count: 'exact' });
    expect(db._builder.or).toHaveBeenCalledWith('name.ilike.%Budi%,customer_code.ilike.%Budi%,phone.ilike.%Budi%');
    expect(db._builder.range).toHaveBeenCalledWith(0, 9);
    expect(db._builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should call findById correctly', async () => {
    const db = createMockDbClient();
    await customerRepo.findById(db, '1');

    expect(db.from).toHaveBeenCalledWith('customers');
    expect(db._builder.select).toHaveBeenCalledWith('*');
    expect(db._builder.eq).toHaveBeenCalledWith('id', '1');
    expect(db._builder.maybeSingle).toHaveBeenCalled();
  });

  it('should call findByPhone correctly', async () => {
    const db = createMockDbClient();
    await customerRepo.findByPhone(db, '0812', '1');

    expect(db.from).toHaveBeenCalledWith('customers');
    expect(db._builder.select).toHaveBeenCalledWith('id');
    expect(db._builder.eq).toHaveBeenCalledWith('phone', '0812');
    expect(db._builder.neq).toHaveBeenCalledWith('id', '1');
    expect(db._builder.maybeSingle).toHaveBeenCalled();
  });
});
