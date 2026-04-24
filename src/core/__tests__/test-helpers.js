/**
 * Test helpers — mock factories for Supabase client and HTTP request/response.
 */
import { vi } from 'vitest';

/**
 * Create a mock Supabase client with chainable query builder.
 * Each call to .from() returns a fresh query builder.
 *
 * Usage in tests:
 *   const db = createMockDbClient();
 *   db._builder.mockResolvedValue({ data: [...], error: null });
 */
export function createMockDbClient() {
  const builder = {
    select:      vi.fn().mockReturnThis(),
    insert:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
    delete:      vi.fn().mockReturnThis(),
    upsert:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    neq:         vi.fn().mockReturnThis(),
    in:          vi.fn().mockReturnThis(),
    is:          vi.fn().mockReturnThis(),
    gte:         vi.fn().mockReturnThis(),
    lte:         vi.fn().mockReturnThis(),
    ilike:       vi.fn().mockReturnThis(),
    or:          vi.fn().mockReturnThis(),
    order:       vi.fn().mockReturnThis(),
    range:       vi.fn().mockReturnThis(),
    limit:       vi.fn().mockReturnThis(),
    single:      vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    // Terminal — must call onResolved to resolve the promise
    then:        vi.fn((onRes) => Promise.resolve({ data: null, error: null }).then(onRes)),
  };

  // Allow tests to set the final resolved value
  const setResult = (result) => {
    const resolvedResult = { data: null, error: null, count: null, ...result };
    builder.then.mockImplementation((onRes) => Promise.resolve(resolvedResult).then(onRes));
    builder.single.mockResolvedValue(resolvedResult);
    builder.maybeSingle.mockResolvedValue(resolvedResult);
  };

  const client = {
    from: vi.fn(() => builder),
    rpc:  vi.fn(),
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      }
    },
    _builder: builder,
    _setResult: setResult,
  };

  return client;
}

/**
 * Create a chainable mock Supabase query builder for fine-grained control.
 * Returns a fresh builder where every method returns `this` until a terminal call.
 */
export function createMockQueryBuilder(resolvedValue = { data: null, error: null }) {
  const builder = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'is', 'gte', 'lte', 'ilike', 'or',
    'order', 'range', 'limit', 'single', 'maybeSingle'
  ];

  methods.forEach(m => {
    builder[m] = vi.fn().mockReturnValue(builder);
  });

  // Terminal methods resolve to final value
  builder.single.mockResolvedValue(resolvedValue);
  builder.maybeSingle.mockResolvedValue(resolvedValue);

  // Make the builder itself a thenable so `await query` works
  Object.assign(builder, resolvedValue);

  return builder;
}
