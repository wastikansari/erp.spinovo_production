import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { API_URL } from '../config/constants';
import {
  WhatsappSettingsData,
  WhatsappToggleRequest,
  WhatsappSettingsUpdateRequest,
} from '../types/whatsappNotifications';

export class WhatsappSettingsApiService extends BaseApiService {
  static async getSettings(): Promise<ApiResponse<WhatsappSettingsData>> {
    return this.makeRequest<WhatsappSettingsData>(API_URL.WHATSAPP_SETTINGS, {
      method: 'GET',
    });
  }

  // Admin-level: flips one event's on/off switch only.
  static async toggleEvent(data: WhatsappToggleRequest): Promise<ApiResponse<WhatsappSettingsData>> {
    return this.makeRequest<WhatsappSettingsData>(API_URL.WHATSAPP_SETTINGS_TOGGLE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Super-admin only (enforced on the backend) — full customization:
  // admin numbers list + per-event template name/language.
  static async updateSettings(
    data: WhatsappSettingsUpdateRequest,
  ): Promise<ApiResponse<WhatsappSettingsData>> {
    return this.makeRequest<WhatsappSettingsData>(API_URL.WHATSAPP_SETTINGS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
