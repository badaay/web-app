/**
 * Customer Service — Business Logic Layer
 * Validates input and delegates to customer repository.
 * Contains phone uniqueness checks and active WO delete guards.
 */
import * as customerRepo from '../repositories/customer.repository.js';
import { ok, created, badRequest, notFound, conflict, serverError, unauthorized } from '../utils/http-mapper.js';
import { ALLOWED_CUSTOMER_FIELDS } from '../utils/constants.js';
import { whitelist } from '../utils/validators.js';

export async function listCustomers(dbClient, { limit = 50, offset = 0, search = '' } = {}) {
  const { data, error, count } = await customerRepo.findAll(dbClient, { limit, offset, search });
  if (error) return serverError(`Database error: ${error.message}`);
  return ok({ data, count, limit, offset });
}

export async function updateCustomer(dbClient, id, body) {
  if (!id) return badRequest('Customer id is required');

  const updates = whitelist(body, ALLOWED_CUSTOMER_FIELDS);
  if (Object.keys(updates).length === 0) return badRequest('No valid fields to update');

  // Phone uniqueness check
  if (updates.phone) {
    const { data: dup } = await customerRepo.findByPhone(dbClient, updates.phone, id);
    if (dup) return conflict('Phone number already in use by another customer');
  }

  const { data, error } = await customerRepo.updateById(dbClient, id, updates);
  if (error) return serverError(`Database error: ${error.message}`);
  if (!data) return notFound('Customer not found');
  return ok(data);
}

export async function deleteCustomer(dbClient, authClient, id) {
  if (!id) return badRequest('Customer id is required');

  // Verify existence
  const { data: existing } = await customerRepo.findById(dbClient, id);
  if (!existing) return notFound('Customer not found');

  // Guard: active work orders
  const { count } = await customerRepo.countActiveWorkOrders(dbClient, id);
  if (count > 0) {
    return conflict(`Cannot delete: customer has ${count} active work order(s). Close them first.`);
  }

  // Delete customer record
  const { error } = await customerRepo.deleteById(dbClient, id);
  if (error) return serverError(`Delete failed: ${error.message}`);

  // Also delete auth user (best effort)
  if (authClient) {
    try {
      await authClient.auth.admin.deleteUser(id);
    } catch (e) {
      // Non-fatal: customer row is already deleted
      console.warn(`[CustomerService] Auth user deletion failed for ${id}:`, e.message);
    }
  }

  return ok({ message: `Customer '${existing.name}' deleted` });
}

// ── Registration & Login (Wave 2.4) ────────────────────────────────────────

export async function registerCustomer(dbClient, body) {
  if (!body.name || !body.phone) {
    return badRequest('Name and phone are required');
  }

  // Check phone uniqueness
  const { data: existing } = await customerRepo.findByPhone(dbClient, body.phone);
  if (existing) {
    return conflict('Phone number already registered. Please login or use another number.');
  }

  const payload = whitelist(body, ALLOWED_CUSTOMER_FIELDS);
  
  const { data, error } = await customerRepo.create(dbClient, payload);
  if (error) return serverError(`Registration failed: ${error.message}`);

  return created(data);
}

export async function loginCustomer(dbClient, authClient, phone, password) {
  if (!phone || !password) return badRequest('Phone and password are required');

  // Find customer by phone
  const { data: customer } = await customerRepo.findByPhone(dbClient, phone);
  if (!customer) return unauthorized('Invalid phone number or password');

  // Fetch full customer to get email
  const { data: fullCustomer } = await customerRepo.findById(dbClient, customer.id);

  if (!fullCustomer || !fullCustomer.email) {
    return unauthorized('Customer account incomplete (missing email)');
  }

  const { data, error } = await authClient.auth.signInWithPassword({
    email: fullCustomer.email,
    password: password
  });

  if (error || !data.session) {
    return unauthorized('Invalid phone number or password');
  }

  return ok({
    session: data.session,
    user: data.user
  });
}
