import { describe, it, expect, vi, beforeEach } from 'vitest';
import indexHandler from '../../../../api/customers/index.js';
import idHandler from '../../../../api/customers/[id].js';
import * as customerService from '../../services/customer.service.js';

vi.mock('../../../../api/_lib/supabase.js', () => ({
  supabaseAdmin: {},
  verifyAuth: vi.fn().mockResolvedValue({ user: { id: 'admin-1' }, error: null }),
  isAdmin: vi.fn().mockResolvedValue(true),
  withCors: (h) => h,
  jsonResponse: (data, status = 200) => ({ status, data }),
  errorResponse: (msg, status = 500) => ({ status, error: msg })
}));

vi.mock('../../services/customer.service.js');

describe('Handler: Customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/customers', () => {
    it('should return 200 on success', async () => {
      customerService.listCustomers.mockResolvedValue({ success: true, data: { data: [] } });
      const req = { method: 'GET', url: 'http://localhost/api/customers?limit=10' };
      const res = await indexHandler(req);
      expect(res.status).toBe(200);
      expect(customerService.listCustomers).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/customers/[id]', () => {
    it('should return 401 if unauthorized', async () => {
      const { verifyAuth } = await import('../../../../api/_lib/supabase.js');
      verifyAuth.mockResolvedValueOnce({ error: 'Unauthorized' });
      const req = { method: 'PATCH', url: 'http://localhost/api/customers/1' };
      const res = await idHandler(req);
      expect(res.status).toBe(401);
    });

    it('should return 409 on conflict', async () => {
      const { verifyAuth } = await import('../../../../api/_lib/supabase.js');
      verifyAuth.mockResolvedValueOnce({ user: { id: 'admin' }, error: null });
      customerService.updateCustomer.mockResolvedValue({ success: false, statusHint: 'conflict', error: 'Duplicate phone' });
      
      const req = { 
        method: 'PATCH', 
        url: 'http://localhost/api/customers/1',
        json: () => Promise.resolve({ phone: '0812' })
      };
      const res = await idHandler(req);
      expect(res.status).toBe(409);
    });

    it('should return 200 on success', async () => {
      const { verifyAuth } = await import('../../../../api/_lib/supabase.js');
      verifyAuth.mockResolvedValueOnce({ user: { id: 'admin' }, error: null });
      customerService.updateCustomer.mockResolvedValue({ success: true, data: { id: '1' } });
      
      const req = { 
        method: 'PATCH', 
        url: 'http://localhost/api/customers/1',
        json: () => Promise.resolve({ phone: '0812' })
      };
      const res = await idHandler(req);
      expect(res.status).toBe(200);
    });
  });
});
