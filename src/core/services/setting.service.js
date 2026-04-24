/**
 * Setting Service — Business Logic Layer
 * Validates input and delegates to setting repository.
 */
import * as settingRepo from '../repositories/setting.repository.js';
import { ok, badRequest, notFound, serverError } from '../utils/http-mapper.js';

export async function listSettings(dbClient) {
  const { data, error } = await settingRepo.findAll(dbClient);
  if (error) return serverError(`Database error: ${error.message}`);
  return ok(data);
}

export async function updateSetting(dbClient, body) {
  if (!body.setting_key) return badRequest('setting_key is required');
  if (body.setting_value === undefined) return badRequest('setting_value is required');

  const { data, error } = await settingRepo.updateByKey(dbClient, body.setting_key, body.setting_value);
  if (error) return serverError(`Database error: ${error.message}`);
  if (!data) return notFound(`Setting '${body.setting_key}' not found`);
  return ok(data);
}
