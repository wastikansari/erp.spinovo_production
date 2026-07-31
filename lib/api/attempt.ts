import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { API_URL } from '../config/constants';
import {
  AttemptedOrderListData,
  AttemptReasonListData,
  AttemptReasonCreateRequest,
  AttemptReasonUpdateRequest,
  AttemptReason,
} from '../types/attempt';

export class AttemptApiService extends BaseApiService {
  static async getAttemptedOrders(
    page: number = 1,
    limit: number = 20,
    type?: 'pickup' | 'delivery',
  ): Promise<ApiResponse<AttemptedOrderListData>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.set('type', type);
    return this.makeRequest<AttemptedOrderListData>(`${API_URL.ATTEMPTED_ORDERS}?${params}`, {
      method: 'GET',
    });
  }

  static async getAttemptReasons(): Promise<ApiResponse<AttemptReasonListData>> {
    return this.makeRequest<AttemptReasonListData>(API_URL.ATTEMPT_REASON_LIST, {
      method: 'GET',
    });
  }

  static async createAttemptReason(
    data: AttemptReasonCreateRequest,
  ): Promise<ApiResponse<{ reason: AttemptReason }>> {
    return this.makeRequest<{ reason: AttemptReason }>(API_URL.ATTEMPT_REASON_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateAttemptReason(
    id: string,
    data: AttemptReasonUpdateRequest,
  ): Promise<ApiResponse<{ reason: AttemptReason }>> {
    return this.makeRequest<{ reason: AttemptReason }>(`${API_URL.ATTEMPT_REASON_UPDATE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}
