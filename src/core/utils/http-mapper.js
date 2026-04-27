/**
 * StatusHint → HTTP status code mapping.
 * Used by Handlers to translate Service-layer results into HTTP responses.
 */
const STATUS_MAP = {
  ok:           200,
  created:      201,
  bad_request:  400,
  unauthorized: 401,
  forbidden:    403,
  not_found:    404,
  conflict:     409,
  unavailable:  503,
  server_error: 500
};

export function mapToHttpStatus(statusHint) {
  return STATUS_MAP[statusHint] || 500;
}

/**
 * Create a standardised service result object.
 */
export function serviceResult(success, statusHint, data = null, error = null) {
  return { success, statusHint, data, error };
}

export function ok(data)              { return serviceResult(true,  'ok',          data); }
export function created(data)         { return serviceResult(true,  'created',     data); }
export function badRequest(error)     { return serviceResult(false, 'bad_request', null, error); }
export function notFound(error)       { return serviceResult(false, 'not_found',   null, error); }
export function conflict(error)       { return serviceResult(false, 'conflict',    null, error); }
export function forbidden(error)      { return serviceResult(false, 'forbidden',   null, error); }
export function unauthorized(error)   { return serviceResult(false, 'unauthorized', null, error); }
export function serverError(error)    { return serviceResult(false, 'server_error', null, error); }
export function unavailable(error)    { return serviceResult(false, 'unavailable', null, error); }
