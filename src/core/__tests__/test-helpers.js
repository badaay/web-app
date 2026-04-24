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
    // Terminal — override in tests to resolve final values
    then:        vi.fn(),
  };

  // Allow tests to set the final resolved value
  // Usage: db._setResult({ data: [...], error: null, count: 5 })
  const setResult = (result) => {
    const resolvedResult = { data: null, error: null, count: null, ...result };
    // Make the builder itself thenable (like Supabase client)
    builder.select.mockReturnValue(Object.assign(Object.create(builder), resolvedResult));
    builder.insert.mockReturnValue(Object.assign(Object.create(builder), resolvedResult));
    builder.update.mockReturnValue(Object.assign(Object.create(builder), resolvedResult));
    builder.delete.mockReturnValue(Object.assign(Object.create(builder), resolvedResult));
    // Also set on terminal methods
    builder.single.mockResolvedValue(resolvedResult);
    builder.maybeSingle.mockResolvedValue(resolvedResult);
    // Make builder itself resolve
    Object.assign(builder, resolvedResult);
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
