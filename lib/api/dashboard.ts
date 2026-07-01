import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { DashboardData, DashboardFilterType } from '../types/dashboard';

export class DashboardApiService extends BaseApiService {
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