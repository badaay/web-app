/**
 * Employee Service — Business Logic Layer
 * Validates input and delegates to employee repository.
 */
import * as employeeRepo from '../repositories/employee.repository.js';
import { ok, created, badRequest, notFound, serverError } from '../utils/http-mapper.js';
import { ALLOWED_EMPLOYEE_FIELDS, ALLOWED_SALARY_CONFIG_FIELDS } from '../utils/constants.js';
import { whitelist } from '../utils/validators.js';

export async function listEmployees(dbClient, { limit = 50, offset = 0, search = '' } = {}) {
  const { data, error, count } = await employeeRepo.findAll(dbClient, { limit, offset, search });
  if (error) return serverError(`Database error: ${error.message}`);
  return ok({ data, count, limit, offset });
}

export async function createEmployee(dbClient, body) {
  if (!body.name) return badRequest('name is required');
  if (!body.employee_id) return badRequest('employee_id is required');
  if (!body.position) return badRequest('position is required');

  const payload = whitelist(body, ALLOWED_EMPLOYEE_FIELDS);

  const { data, error } = await employeeRepo.create(dbClient, payload);
  if (error) return serverError(`Database error: ${error.message}`);
  return created(data);
}

export async function updateEmployee(dbClient, id, body) {
  if (!id) return badRequest('Employee id is required');

  const updates = whitelist(body, ALLOWED_EMPLOYEE_FIELDS);
  if (Object.keys(updates).length === 0) return badRequest('No valid fields to update');

  const { data, error } = await employeeRepo.updateById(dbClient, id, updates);
  if (error) return serverError(`Database error: ${error.message}`);
  if (!data) return notFound('Employee not found');
  return ok(data);
}

export async function deleteEmployee(dbClient, id) {
  if (!id) return badRequest('Employee id is required');

  const { data: existing } = await employeeRepo.findById(dbClient, id);
  if (!existing) return notFound('Employee not found');

  const { error } = await employeeRepo.deleteById(dbClient, id);
  if (error) return serverError(`Delete failed: ${error.message}`);
  return ok({ message: `Employee '${existing.name}' deleted` });
}

// ── Salary Config (Wave 2.2) ────────────────────────────────────────────────

export async function getSalaryConfigs(dbClient, employeeId) {
  if (!employeeId) return badRequest('Employee id is required');
  const { data, error } = await employeeRepo.findSalaryConfigs(dbClient, employeeId);
  if (error) return serverError(`Database error: ${error.message}`);
  return ok(data);
}

export async function upsertSalaryConfig(dbClient, employeeId, body) {
  if (!employeeId) return badRequest('Employee id is required');
  if (!body.effective_from) return badRequest('effective_from is required');

  const payload = {
    ...whitelist(body, ALLOWED_SALARY_CONFIG_FIELDS),
    employee_id: employeeId
  };

  const { data, error } = await employeeRepo.upsertSalaryConfig(dbClient, payload);
  if (error) return serverError(`Database error: ${error.message}`);
  return ok(data);
}
