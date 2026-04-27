import { describe, it, expect, vi, beforeEach } from 'vitest';
import calculateHandler from '../../../../api/payroll/calculate.js';
import * as payrollService from '../../services/payroll.service.js';

vi.mock('../../../../api/_lib/supabase.js', () => {
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve({ data: [], error: null }))
  };
  mockClient.from.mockReturnValue(mockClient);
  mockClient.select.mockReturnValue(mockClient);
  mockClient.insert.mockReturnValue(mockClient);
  mockClient.update.mockReturnValue(mockClient);
  mockClient.delete.mockReturnValue(mockClient);


  return {
    supabaseAdmin: mockClient,
    supabaseAdminB: mockClient,
    verifyAuth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', user_metadata: { role: 'admin' } }, error: null }),
    isAdmin: vi.fn().mockResolvedValue(true),
    hasRole: vi.fn().mockResolvedValue(true),
    withCors: (h) => h,
    jsonResponse: (data, status = 200) => ({ status, data }),
    errorResponse: (msg, status = 500) => ({ status, error: msg })
  };
});

vi.mock('../../services/payroll.service.js');

describe('Handler: Payroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/payroll/calculate', () => {
    it('should return 200 on success', async () => {
      payrollService.calculatePayroll.mockResolvedValue({ success: true, data: {} });
      const req = { 
        method: 'POST', 
        url: 'http://localhost/api/payroll/calculate',
        json: () => Promise.resolve({ period_id: 'p1' })
      };
      const res = await calculateHandler(req);
      expect(res.status).toBe(200);
      expect(payrollService.calculatePayroll).toHaveBeenCalled();
    });
  });
});
