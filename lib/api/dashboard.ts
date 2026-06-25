import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { DashboardData } from '../types/dashboard';

export class DashboardApiService extends BaseApiService {
  static async getDashboard(): Promise<ApiResponse<DashboardData>> {
    return this.makeRequest<DashboardData>('/admin/dashboard', {
      method: 'GET',
    });
  }
}