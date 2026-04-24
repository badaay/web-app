import { describe, it, expect } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as employeeRepo from '../../repositories/employee.repository.js';

describe('EmployeeRepository', () => {
  it('should call findAll correctly with pagination', async () => {
    const db = createMockDbClient();
    await employeeRepo.findAll(db, { limit: 10, offset: 0, search: 'Budi' });

    expect(db.from).toHaveBeenCalledWith('employees');
    expect(db._builder.select).toHaveBeenCalledWith('*, roles(name)', { count: 'exact' });
    expect(db._builder.or).toHaveBeenCalledWith('name.ilike.%Budi%,employee_id.ilike.%Budi%,email.ilike.%Budi%');
    expect(db._builder.range).toHaveBeenCalledWith(0, 9);
    expect(db._builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should call findById correctly', async () => {
    const db = createMockDbClient();
    await employeeRepo.findById(db, '1');

    expect(db.from).toHaveBeenCalledWith('employees');
    expect(db._builder.select).toHaveBeenCalledWith('*');
    expect(db._builder.eq).toHaveBeenCalledWith('id', '1');
    expect(db._builder.maybeSingle).toHaveBeenCalled();
  });
});
