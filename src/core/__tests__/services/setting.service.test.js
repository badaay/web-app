/**
 * Setting Service — Unit Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { setupServiceTest } from './setup.js';

vi.mock('../../repositories/setting.repository.js');

import * as settingRepo from '../../repositories/setting.repository.js';
import { listSettings, updateSetting } from '../../services/setting.service.js';

describe('SettingService', () => {
  const { mockDb } = setupServiceTest();

  describe('listSettings', () => {
    it('should return all settings', async () => {
      const settings = [
        { id: '1', setting_key: 'FONNTE_TOKEN', setting_value: 'abc' },
        { id: '2', setting_key: 'FONNTE_DAILY_LIMIT', setting_value: '500' },
      ];
      settingRepo.findAll.mockResolvedValue({ data: settings, error: null });

      const result = await listSettings(mockDb);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(settings);
    });

    it('should return server_error on failure', async () => {
      settingRepo.findAll.mockResolvedValue({ data: null, error: { message: 'fail' } });

      const result = await listSettings(mockDb);

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('server_error');
    });
  });

  describe('updateSetting', () => {
    it('should reject if setting_key is missing', async () => {
      const result = await updateSetting(mockDb, { setting_value: 'new' });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should reject if setting_value is undefined', async () => {
      const result = await updateSetting(mockDb, { setting_key: 'FONNTE_TOKEN' });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('bad_request');
    });

    it('should update setting by key', async () => {
      const updated = { id: '1', setting_key: 'FONNTE_TOKEN', setting_value: 'new-token' };
      settingRepo.updateByKey.mockResolvedValue({ data: updated, error: null });

      const result = await updateSetting(mockDb, { setting_key: 'FONNTE_TOKEN', setting_value: 'new-token' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
      expect(settingRepo.updateByKey).toHaveBeenCalledWith(mockDb, 'FONNTE_TOKEN', 'new-token');
    });

    it('should return not_found if key does not exist', async () => {
      settingRepo.updateByKey.mockResolvedValue({ data: null, error: null });

      const result = await updateSetting(mockDb, { setting_key: 'NONEXISTENT', setting_value: 'x' });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('not_found');
    });

    it('should return server_error on db failure', async () => {
      settingRepo.updateByKey.mockResolvedValue({ data: null, error: { message: 'fail' } });

      const result = await updateSetting(mockDb, { setting_key: 'KEY', setting_value: 'v' });

      expect(result.success).toBe(false);
      expect(result.statusHint).toBe('server_error');
    });
  });
});
