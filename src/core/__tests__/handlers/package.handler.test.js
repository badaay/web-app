import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../../../api/packages/index.js';
import * as packageService from '../../services/package.service.js';

// Mock the shared library
vi.mock('../../../../api/_lib/supabase.js', () => ({
  supabaseAdmin: {},
  verifyAuth: vi.fn().mockResolvedValue({ user: { id: 'admin-1' }, error: null }),
  isAdmin: vi.fn().mockResolvedValue(true),
  withCors: (h) => h,
  jsonResponse: (data, status = 200) => ({ status, data }),
  errorResponse: (msg, status = 500) => ({ status, error: msg })
}));

// Mock the service
vi.mock('../../services/package.service.js');

describe('Handler: Packages Index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/packages', () => {
    it('should return 200 on success', async () => {
      packageService.listPackages.mockResolvedValue({ success: true, data: [] });
      const req = { method: 'GET' };
      const res = await handler(req);
      expect(res.status).toBe(200);
      expect(packageService.listPackages).toHaveBeenCalled();
    });

    it('should return 500 on service failure', async () => {
      packageService.listPackages.mockResolvedValue({ success: false, statusHint: 'server_error', error: 'Fail' });
      const req = { method: 'GET' };
      const res = await handler(req);
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/packages', () => {
    it('should return 401 if unauthorized', async () => {
      const { verifyAuth } = await import('../../../../api/_lib/supabase.js');
      verifyAuth.mockResolvedValueOnce({ error: 'Unauthorized' });
      const req = { method: 'POST' };
      const res = await handler(req);
      expect(res.status).toBe(401);
    });

    it('should return 201 on success', async () => {
      packageService.createPackage.mockResolvedValue({ success: true, data: { id: '1' } });
      const req = { 
        method: 'POST', 
        json: () => Promise.resolve({ name: 'P1', price: 100 }) 
      };
      const res = await handler(req);
      expect(res.status).toBe(201);
      expect(packageService.createPackage).toHaveBeenCalled();
    });
  });
});
