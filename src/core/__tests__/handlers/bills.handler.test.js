import { describe, it, expect, vi, beforeEach } from 'vitest';
import generateHandler from '../../../../api/bills/generate.js';
import markPaidHandler from '../../../../api/bills/mark-paid.js';
import * as billService from '../../services/bill.service.js';

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
    isFinance: vi.fn().mockResolvedValue(true),
    hasRole: vi.fn().mockResolvedValue(true),
    withCors: (h) => h,
    jsonResponse: (data, status = 200) => ({ status, data }),
    errorResponse: (msg, status = 500) => ({ status, error: msg })
  };
});

vi.mock('../../services/bill.service.js');

describe('Handler: Bills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/bills/generate', () => {
    it('should return 200 on success', async () => {
      billService.generateMonthlyBills.mockResolvedValue({ success: true, data: { count: 10 } });
      const req = { 
        method: 'POST', 
        url: 'http://localhost/api/bills/generate',
        json: () => Promise.resolve({ month: 4, year: 2026 })
      };
      const res = await generateHandler(req);
      expect(res.status).toBe(200);
      expect(billService.generateMonthlyBills).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/bills/mark-paid', () => {
    it('should return 404 if bill not found', async () => {
      billService.markBillAsPaid.mockResolvedValue({ success: false, statusHint: 'not_found', error: 'Bill not found' });
      const req = { 
        method: 'PATCH', 
        url: 'http://localhost/api/bills/mark-paid',
        json: () => Promise.resolve({ bill_id: 'b1' })
      };

      const res = await markPaidHandler(req);
      expect(res.status).toBe(404);
    });
  });
});
