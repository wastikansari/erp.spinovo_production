import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { PendingPaymentV2ListData, PendingPaymentV2Status } from '../types/payment-v2';

export interface PaymentV2Filters {
  status?: PendingPaymentV2Status | '';
  stuckOnly?: boolean;
  search?: string;
}

export class PaymentV2ApiService extends BaseApiService {
  static async getPayments(
    page: number = 1,
    limit: number = 20,
    filters: PaymentV2Filters = {}
  ): Promise<ApiResponse<PendingPaymentV2ListData>> {
    const query = this.buildQueryString({ page, limit, ...filters });
    return this.makeRequest<PendingPaymentV2ListData>(`/admin/payment-v2/list${query}`, {
      method: 'GET',
    });
  }
}
