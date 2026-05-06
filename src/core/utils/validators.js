/**
 * Whitelist-filter an object's keys.
 * @param {Object} obj  — Source object
 * @param {string[]} allowed — Allowed key names
 * @returns {Object} — Filtered object containing only allowed keys
 */
export function whitelist(obj, allowed) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => allowed.includes(k))
  );
}

/**
 * Parse pagination params with sensible defaults.
 * @param {{ limit?: string|number, offset?: string|number }} params
 * @returns {{ limit: number, offset: number }}
 */
export function parsePagination(params = {}) {
  const limit = Math.min(Math.max(parseInt(params.limit) || 50, 1), 100);
  const offset = Math.max(parseInt(params.offset) || 0, 0);
  return { limit, offset };
}
