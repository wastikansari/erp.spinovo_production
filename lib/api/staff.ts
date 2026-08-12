import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { API_URL } from '../config/constants';
import { StaffMember, CreateStaffRequest, UpdateStaffRequest } from '../types/staff';

export class StaffApiService extends BaseApiService {
  static async list(): Promise<ApiResponse<{ staff: StaffMember[] }>> {
    return this.makeRequest<{ staff: StaffMember[] }>(API_URL.STAFF_BASE, {
      method: 'GET',
    });
  }

  static async getById(staffId: string): Promise<ApiResponse<{ staff: StaffMember }>> {
    return this.makeRequest<{ staff: StaffMember }>(`${API_URL.STAFF_BASE}/${staffId}`, {
      method: 'GET',
    });
  }

  static async create(data: CreateStaffRequest): Promise<ApiResponse<{ staff: StaffMember }>> {
    return this.makeRequest<{ staff: StaffMember }>(API_URL.STAFF_BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async update(
    staffId: string,
    data: UpdateStaffRequest,
  ): Promise<ApiResponse<{ staff: StaffMember }>> {
    return this.makeRequest<{ staff: StaffMember }>(`${API_URL.STAFF_BASE}/${staffId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deactivate(staffId: string): Promise<ApiResponse<{ staff: StaffMember }>> {
    return this.makeRequest<{ staff: StaffMember }>(`${API_URL.STAFF_BASE}/${staffId}/deactivate`, {
      method: 'PATCH',
    });
  }
}
