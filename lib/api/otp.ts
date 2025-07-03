import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { OTPRequestListData } from '../types/otp';

export class OTPApiService extends BaseApiService {
  static async getOTPRequests(page: number = 1, limit: number = 20): Promise<ApiResponse<OTPRequestListData>> {
    console.log(`=== FETCHING OTP REQUESTS ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<OTPRequestListData>(`/admin/customer/otpreques?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }
}