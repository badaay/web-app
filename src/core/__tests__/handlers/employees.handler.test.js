import { describe, it, expect, vi, beforeEach } from 'vitest';
import indexHandler from '../../../../api/employees/index.js';
import * as employeeService from '../../services/employee.service.js';

vi.mock('../../../../api/_lib/supabase.js', () => ({
  supabaseAdmin: {},
  verifyAuth: vi.fn().mockResolvedValue({ user: { id: 'admin-1' }, error: null }),
  isAdmin: vi.fn().mockResolvedValue(true),
  withCors: (h) => h,
  jsonResponse: (data, status = 200) => ({ status, data }),
  errorResponse: (msg, status = 500) => ({ status, error: msg })
}));

vi.mock('../../services/employee.service.js');

describe('Handler: Employees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/employees', () => {
    it('should return 200 on success', async () => {
      employeeService.listEmployees.mockResolvedValue({ success: true, data: { data: [] } });
      const req = { method: 'GET', url: 'http://localhost/api/employees?limit=10' };
      const res = await indexHandler(req);
      expect(res.status).toBe(200);
      expect(employeeService.listEmployees).toHaveBeenCalled();
    });

    it('should return 500 on server error', async () => {
      employeeService.listEmployees.mockResolvedValue({ success: false, statusHint: 'server_error', error: 'Fail' });
      const req = { method: 'GET', url: 'http://localhost/api/employees' };
      const res = await indexHandler(req);
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/employees', () => {
    it('should return 401 if unauthorized', async () => {
      const { verifyAuth } = await import('../../../../api/_lib/supabase.js');
      verifyAuth.mockResolvedValueOnce({ error: 'Unauthorized' });
      const req = { method: 'POST', url: 'http://localhost/api/employees' };
      const res = await indexHandler(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 on bad request', async () => {
      const { verifyAuth } = await import('../../../../api/_lib/supabase.js');
      verifyAuth.mockResolvedValueOnce({ user: { id: 'admin' }, error: null });
      employeeService.createEmployee.mockResolvedValue({ success: false, statusHint: 'bad_request', error: 'Missing name' });
      
      const req = { 
        method: 'POST', 
        url: 'http://localhost/api/employees',
        json: () => Promise.resolve({ position: 'Tech' })
      };
      const res = await indexHandler(req);
      expect(res.status).toBe(400);
    });

    it('should return 201 on success', async () => {
      const { verifyAuth } = await import('../../../../api/_lib/supabase.js');
      verifyAuth.mockResolvedValueOnce({ user: { id: 'admin' }, error: null });
      employeeService.createEmployee.mockResolvedValue({ success: true, data: { id: '1' } });
      
      const req = { 
        method: 'POST', 
        url: 'http://localhost/api/employees',
        json: () => Promise.resolve({ name: 'Budi', position: 'Tech' })
      };
      const res = await indexHandler(req);
      expect(res.status).toBe(201);
    });
  });
});
