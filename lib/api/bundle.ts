import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import {
  BundleBooking,
  BundleBookingDetailsData,
  BundleConfig,
  BundleConfigData,
  BundleConfigUpdate,
  BundleConvertRequest,
  BundleCounts,
  BundleListData,
  BundleStatus,
} from '../types/bundle';

const BASE = '/admin/bundle';

export interface BundleListFilters {
  status?: BundleStatus | '';
  search?: string;
  service_id?: string;
}

export class BundleApiService extends BaseApiService {
  static async getBookings(page: number, limit: number, filters: BundleListFilters): Promise<ApiResponse<BundleListData>> {
    const query = this.buildQueryString({ page, limit, ...filters });
    return this.makeRequest(`${BASE}/bookings${query}`, { method: 'GET' });
  }

  static async getSummary(serviceId?: string): Promise<ApiResponse<{ counts: BundleCounts }>> {
    return this.makeRequest(`${BASE}/summary${this.buildQueryString({ service_id: serviceId })}`, { method: 'GET' });
  }

  static async getBooking(id: string): Promise<ApiResponse<BundleBookingDetailsData>> {
    return this.makeRequest(`${BASE}/bookings/${id}`, { method: 'GET' });
  }

  // skipRetry on every write — a retried status change / refund after a slow
  // response must never run twice.
  static async setStatus(id: string, status: 'visit_scheduled' | 'visit_done'): Promise<ApiResponse<{ booking: BundleBooking }>> {
    return this.makeRequest(`${BASE}/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, true);
  }

  static async closeConsultation(id: string): Promise<ApiResponse<{ booking: BundleBooking }>> {
    return this.makeRequest(`${BASE}/bookings/${id}/consultation`, { method: 'POST' }, true);
  }

  static async convert(
    id: string,
    data: BundleConvertRequest,
  ): Promise<ApiResponse<{ booking: BundleBooking; order: { _id: string; order_display_no: string; total_billing: number; paid_amount: number } }>> {
    return this.makeRequest(`${BASE}/bookings/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }, true);
  }

  static async cancel(id: string, note: string): Promise<ApiResponse<{ booking: BundleBooking }>> {
    return this.makeRequest(`${BASE}/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ note }) }, true);
  }

  static async getConfig(serviceId: string | number): Promise<ApiResponse<BundleConfigData>> {
    return this.makeRequest(`${BASE}/config/${serviceId}`, { method: 'GET' });
  }

  static async updateConfig(
    serviceId: string | number,
    data: BundleConfigUpdate,
  ): Promise<ApiResponse<{ config: BundleConfig; changes?: string[] }>> {
    return this.makeRequest(`${BASE}/config/${serviceId}`, { method: 'PUT', body: JSON.stringify(data) }, true);
  }

  static async uploadBanner(serviceId: string | number, file: File): Promise<ApiResponse<{ banner_url: string }>> {
    const form = new FormData();
    form.append('image', file);
    return this.makeRequest(`${BASE}/config/${serviceId}/banner`, { method: 'POST', body: form }, true);
  }
}
