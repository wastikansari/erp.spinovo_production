import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { PaymentAlertListData, PaymentAlertStatus, PaymentAlertResolution } from '../types/paymentAlert';

export interface PaymentAlertFilters {
  status?: PaymentAlertStatus | '';
  resolution?: PaymentAlertResolution | '';
  search?: string;
}

export class PaymentAlertApiService extends BaseApiService {
  static async getPaymentAlerts(
    page: number = 1,
    limit: number = 20,
    filters: PaymentAlertFilters = {},
  ): Promise<ApiResponse<PaymentAlertListData>> {
    const query = this.buildQueryString({ page, limit, ...filters });
    return this.makeRequest<PaymentAlertListData>(`/admin/payment-alerts/list${query}`, {
      method: 'GET',
    });
  }
}
