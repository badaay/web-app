import { describe, it, expect, vi, beforeEach } from 'vitest';
import recapHandler from '../../../../api/finance/recap.js';
import * as financeService from '../../services/finance.service.js';

vi.mock('../../../../api/_lib/supabase.js', () => {
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
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
    isFinance: vi.fn().mockResolvedValue(true),
    hasRole: vi.fn().mockResolvedValue(true),
    withCors: (h) => h,
    jsonResponse: (data, status = 200) => ({ status, data }),
    errorResponse: (msg, status = 500) => ({ status, error: msg })
  };
});

vi.mock('../../services/finance.service.js');

describe('Handler: Finance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/finance/recap', () => {
    it('should return 200 on success', async () => {
      financeService.getFinancialSummary.mockResolvedValue({ success: true, data: { income: 100 } });
      const req = { 
        method: 'GET', 
        url: 'http://localhost/api/finance/recap?startDate=2026-04-01'
      };
      const res = await recapHandler(req);
      expect(res.status).toBe(200);
      expect(financeService.getFinancialSummary).toHaveBeenCalled();
    });
  });
});
