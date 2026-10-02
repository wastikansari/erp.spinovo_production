import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { API_URL } from '../config/constants';
import {
  SlotSettingsData,
  SlotOverridesData,
  SlotDateOverride,
  SlotRulesUpdate,
  SlotTemplateInput,
  SlotPreviewData,
} from '../types/slotSettings';

export class SlotSettingsApiService extends BaseApiService {
  static async getSettings(): Promise<ApiResponse<SlotSettingsData>> {
    return this.makeRequest<SlotSettingsData>(API_URL.SLOT_SETTINGS, { method: 'GET' });
  }

  static async updateRules(data: SlotRulesUpdate): Promise<ApiResponse<SlotSettingsData>> {
    return this.makeRequest<SlotSettingsData>(API_URL.SLOT_RULES, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async createSlot(data: SlotTemplateInput): Promise<ApiResponse<SlotSettingsData>> {
    return this.makeRequest<SlotSettingsData>(API_URL.SLOT_ITEM, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  static async updateSlot(id: string, data: SlotTemplateInput): Promise<ApiResponse<SlotSettingsData>> {
    return this.makeRequest<SlotSettingsData>(`${API_URL.SLOT_ITEM}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteSlot(id: string): Promise<ApiResponse<SlotSettingsData>> {
    return this.makeRequest<SlotSettingsData>(`${API_URL.SLOT_ITEM}/${id}`, {
      method: 'DELETE',
    }, true);
  }

  static async getOverrides(): Promise<ApiResponse<SlotOverridesData>> {
    return this.makeRequest<SlotOverridesData>(API_URL.SLOT_OVERRIDES, { method: 'GET' });
  }

  static async saveOverride(data: SlotDateOverride): Promise<ApiResponse<{ override: SlotDateOverride }>> {
    return this.makeRequest<{ override: SlotDateOverride }>(API_URL.SLOT_OVERRIDE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Resets a date back to the daily template.
  static async deleteOverride(date: string): Promise<ApiResponse<{}>> {
    return this.makeRequest<{}>(
      `${API_URL.SLOT_OVERRIDE}?date=${encodeURIComponent(date)}`,
      { method: 'DELETE' },
    );
  }

  // Without args: pickup slots exactly as the app sees them. With a pickup
  // date + time range: the scheduled-delivery slots for that pickup.
  static async preview(pickupDate?: string, pickupTime?: string): Promise<ApiResponse<SlotPreviewData>> {
    const qs = pickupDate && pickupTime
      ? `?pickup_date=${encodeURIComponent(pickupDate)}&pickup_time=${encodeURIComponent(pickupTime)}`
      : '';
    return this.makeRequest<SlotPreviewData>(`${API_URL.SLOT_PREVIEW}${qs}`, { method: 'GET' });
  }
}
