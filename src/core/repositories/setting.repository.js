/**
 * Setting Repository — Data Access Layer
 * Handles ONLY Supabase queries for app_settings table.
 */

export async function findAll(dbClient) {
  return dbClient
    .from('app_settings')
    .select('*')
    .order('setting_group')
    .order('setting_key');
}

export async function updateByKey(dbClient, settingKey, settingValue) {
  return dbClient
    .from('app_settings')
    .update({ setting_value: settingValue, updated_at: new Date().toISOString() })
    .eq('setting_key', settingKey)
    .select()
    .single();
}
