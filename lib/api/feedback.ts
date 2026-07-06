import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { FeedbackListData, FeedbackDetailsData } from '../types/feedback';

export class FeedbackApiService extends BaseApiService {
  static async getFeedbackList(page: number = 1, limit: number = 20): Promise<ApiResponse<FeedbackListData>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return this.makeRequest<FeedbackListData>(`/admin/feedback/list?${params.toString()}`, {
      method: 'GET',
    });
  }

  static async getFeedbackByOrder(orderId: string): Promise<ApiResponse<FeedbackDetailsData>> {
    return this.makeRequest<FeedbackDetailsData>(`/admin/feedback/order/${orderId}`, {
      method: 'GET',
    });
  }
}
