import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { B2BRevenueSummary, DashboardData, DashboardFilterType, RevenueSummary } from '../types/dashboard';

export class DashboardApiService extends BaseApiService {
  static async getRevenueSummary(): Promise<ApiResponse<RevenueSummary>> {
    return this.makeRequest<RevenueSummary>('/admin/dashboard/revenue', {
      method: 'GET',
    });
  }

  static async getB2BRevenueSummary(): Promise<ApiResponse<B2BRevenueSummary>> {
    return this.makeRequest<B2BRevenueSummary>('/admin/dashboard/revenue/b2b', {
      method: 'GET',
    });
  }

  static async getDashboard(): Promise<ApiResponse<DashboardData>> {
    return this.makeRequest<DashboardData>('/admin/dashboard', {
      method: 'GET',
    });
  }

  static async getDashboardFiltered(filterType: DashboardFilterType): Promise<ApiResponse<DashboardData>> {
    const query = this.buildQueryString({ filter_type: filterType });
    return this.makeRequest<DashboardData>(`/admin/dashboard/filter${query}`, {
      method: 'GET',
    });
  }

  static async getDashboardByRange(startDate: string, endDate: string): Promise<ApiResponse<DashboardData>> {
    const query = this.buildQueryString({ filter_type: 'custom', start_date: startDate, end_date: endDate });
    return this.makeRequest<DashboardData>(`/admin/dashboard/filter${query}`, {
      method: 'GET',
    });
  }
}