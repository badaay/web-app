import { describe, it, expect, vi } from 'vitest';
import { createMockDbClient } from '../test-helpers.js';
import * as settingRepo from '../../repositories/setting.repository.js';

describe('SettingRepository', () => {
  it('should call findAll correctly', async () => {
    const db = createMockDbClient();
    await settingRepo.findAll(db);

    expect(db.from).toHaveBeenCalledWith('app_settings');
    expect(db._builder.select).toHaveBeenCalledWith('*');
    expect(db._builder.order).toHaveBeenCalledWith('setting_group');
    expect(db._builder.order).toHaveBeenCalledWith('setting_key');
  });

  it('should call updateByKey correctly', async () => {
    const db = createMockDbClient();
    await settingRepo.updateByKey(db, 'FONNTE_TOKEN', 'new-token');

    expect(db.from).toHaveBeenCalledWith('app_settings');
    expect(db._builder.update).toHaveBeenCalledWith(expect.objectContaining({ 
      setting_value: 'new-token',
      updated_at: expect.any(String)
    }));
    expect(db._builder.eq).toHaveBeenCalledWith('setting_key', 'FONNTE_TOKEN');
    expect(db._builder.single).toHaveBeenCalled();
  });
});
