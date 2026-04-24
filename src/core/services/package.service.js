/**
 * Package Service — Business Logic Layer
 * Validates input and delegates to package repository.
 */
import * as packageRepo from '../repositories/package.repository.js';
import { ok, created, badRequest, notFound, serverError } from '../utils/http-mapper.js';
import { ALLOWED_PACKAGE_FIELDS } from '../utils/constants.js';
import { whitelist } from '../utils/validators.js';

export async function listPackages(dbClient) {
  const { data, error } = await packageRepo.findAll(dbClient);
  if (error) return serverError(`Database error: ${error.message}`);
  return ok(data);
}

export async function createPackage(dbClient, body) {
  if (!body.name) return badRequest('name is required');
  if (body.price == null) return badRequest('price is required');

  const payload = {
    name: body.name,
    price: body.price,
    speed: body.speed || null,
    description: body.description || null,
  };

  const { data, error } = await packageRepo.create(dbClient, payload);
  if (error) return serverError(`Database error: ${error.message}`);
  return created(data);
}

export async function updatePackage(dbClient, id, body) {
  if (!id) return badRequest('Package id is required');

  const updates = whitelist(body, ALLOWED_PACKAGE_FIELDS);
  if (Object.keys(updates).length === 0) return badRequest('No valid fields to update');

  const { data, error } = await packageRepo.updateById(dbClient, id, updates);
  if (error) return serverError(`Database error: ${error.message}`);
  if (!data) return notFound('Package not found');
  return ok(data);
}

export async function deletePackage(dbClient, id) {
  if (!id) return badRequest('Package id is required');

  const { error } = await packageRepo.deleteById(dbClient, id);
  if (error) return serverError(`Delete failed: ${error.message}`);
  return ok({ message: 'Package deleted' });
}
