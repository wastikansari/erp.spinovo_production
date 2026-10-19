import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { ChargeSettingsData } from '../types/chargeSettings';

export class ChargeSettingsApiService extends BaseApiService {
  static async getSettings(): Promise<ApiResponse<ChargeSettingsData>> {
    return this.makeRequest<ChargeSettingsData>('/admin/settings/charges', { method: 'GET' });
  }

  static async updateSettings(data: Record<string, number>): Promise<ApiResponse<ChargeSettingsData>> {
    return this.makeRequest<ChargeSettingsData>('/admin/settings/charges', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  }
}
