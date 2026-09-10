import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import {
  DailyReportData,
  DailyReportHistoryResponse,
  DailyReportResendResult,
  DailyReportOrdersResponse,
} from '../types/dailyReport';

export interface DailyReportOrdersParams {
  date?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class DailyReportApiService extends BaseApiService {
  static async getToday(): Promise<ApiResponse<DailyReportData>> {
    return this.makeRequest<DailyReportData>('/admin/daily-report/today', {
      method: 'GET',
    });
  }

  static async getByDate(date: string): Promise<ApiResponse<DailyReportData>> {
    const query = this.buildQueryString({ date });
    return this.makeRequest<DailyReportData>(`/admin/daily-report${query}`, {
      method: 'GET',
    });
  }

  static async getHistory(limit: number = 30): Promise<ApiResponse<DailyReportHistoryResponse>> {
    const query = this.buildQueryString({ limit });
    return this.makeRequest<DailyReportHistoryResponse>(`/admin/daily-report/history${query}`, {
      method: 'GET',
    });
  }

  // Regenerates + emails a day's report immediately (defaults to today).
  static async resend(date?: string): Promise<ApiResponse<DailyReportResendResult>> {
    return this.makeRequest<DailyReportResendResult>('/admin/daily-report/resend', {
      method: 'POST',
      body: JSON.stringify(date ? { date } : {}),
    });
  }

  // Paginated, filterable "Daily Order Details" rows.
  static async getOrders(params: DailyReportOrdersParams = {}): Promise<ApiResponse<DailyReportOrdersResponse>> {
    const query = this.buildQueryString({
      date: params.date,
      status: params.status && params.status !== 'all' ? params.status : undefined,
      search: params.search,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    });
    return this.makeRequest<DailyReportOrdersResponse>(`/admin/daily-report/orders${query}`, {
      method: 'GET',
    });
  }
}
