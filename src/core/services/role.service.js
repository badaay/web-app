/**
 * Role Service — Business Logic Layer
 * Validates input and delegates to role repository.
 */
import * as roleRepo from '../repositories/role.repository.js';
import { ok, created, badRequest, serverError } from '../utils/http-mapper.js';

export async function listRoles(dbClient) {
  const { data, error } = await roleRepo.findAll(dbClient);
  if (error) return serverError(`Database error: ${error.message}`);
  return ok(data);
}

export async function createRole(dbClient, body) {
  if (!body.name) return badRequest('name is required');
  if (!body.code) return badRequest('code is required');

  const payload = {
    name: body.name,
    code: body.code,
    description: body.description || null,
  };

  const { data, error } = await roleRepo.create(dbClient, payload);
  if (error) return serverError(`Database error: ${error.message}`);
  return created(data);
}
