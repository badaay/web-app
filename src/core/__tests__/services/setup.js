import { vi, beforeEach } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';

/**
 * Common setup for service-layer tests.
 * Clears all mocks before each test.
 * 
 * @returns {Object} { mockDb, mockDbB, mockAuth }
 */
export const setupServiceTest = () => {
  const mockDb = createMockDbClient();
  const mockDbB = createMockDbClient();
  const mockAuth = {
    auth: { 
      admin: { 
        createUser: vi.fn(), 
        deleteUser: vi.fn(),
        resetPasswordForEmail: vi.fn()
      } 
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  return { mockDb, mockDbB, mockAuth };
};
