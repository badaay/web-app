import { describe, it, expect, vi, beforeEach } from 'vitest';
import indexHandler from '../../../../api/work-orders/index.js';
import idHandler from '../../../../api/work-orders/[id].js';
import confirmHandler from '../../../../api/work-orders/confirm.js';
import claimHandler from '../../../../api/work-orders/claim.js';
import closeHandler from '../../../../api/work-orders/close.js';
import * as woService from '../../services/work-order.service.js';

vi.mock('../../../../api/_lib/supabase.js', () => ({
  supabaseAdmin: {},
  verifyAuth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', user_metadata: { role: 'admin' } }, error: null }),
  isAdmin: vi.fn().mockResolvedValue(true),
  hasRole: vi.fn().mockResolvedValue(true),
  withCors: (h) => h,
  jsonResponse: (data, status = 200) => ({ status, data }),
  errorResponse: (msg, status = 500) => ({ status, error: msg })
}));

vi.mock('../../services/work-order.service.js');

describe('Handler: Work Orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/work-orders', () => {
    it('should return 200 on success', async () => {
      woService.listWorkOrders.mockResolvedValue({ success: true, data: { data: [] } });
      const req = { method: 'GET', url: 'http://localhost/api/work-orders?limit=10' };
      const res = await indexHandler(req);
      expect(res.status).toBe(200);
      expect(woService.listWorkOrders).toHaveBeenCalled();
    });
  });

  describe('POST /api/work-orders/confirm', () => {
    it('should return 200 on success', async () => {
      woService.confirmWorkOrder.mockResolvedValue({ success: true, data: { id: '1' } });
      const req = { 
        method: 'POST', 
        url: 'http://localhost/api/work-orders/confirm',
        json: () => Promise.resolve({ id: '1' })
      };
      const res = await confirmHandler(req);
      expect(res.status).toBe(200);
      expect(woService.confirmWorkOrder).toHaveBeenCalled();
    });
  });

  describe('POST /api/work-orders/claim', () => {
    it('should return 409 if race condition occurs', async () => {
      woService.claimWorkOrder.mockResolvedValue({ success: false, statusHint: 'conflict', error: 'Already claimed' });
      const req = { 
        method: 'POST', 
        url: 'http://localhost/api/work-orders/claim',
        json: () => Promise.resolve({ id: '1' })
      };
      const res = await claimHandler(req);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/work-orders/close', () => {
    it('should return 403 if unauthorized', async () => {
      woService.closeWorkOrder.mockResolvedValue({ success: false, statusHint: 'forbidden', error: 'Forbidden' });
      const req = { 
        method: 'POST', 
        url: 'http://localhost/api/work-orders/close',
        json: () => Promise.resolve({ id: '1' })
      };
      const res = await closeHandler(req);
      expect(res.status).toBe(403);
    });
  });
});
