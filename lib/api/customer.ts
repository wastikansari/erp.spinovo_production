import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { CustomerListData, CustomerDetailsData } from '../types/customer';
import { APP_CONFIG, API_URL } from '../config/constants';
import { AuthService } from '../auth';

export class CustomerApiService extends BaseApiService {
  static async getCustomers(page: number = 1, limit: number = 20): Promise<ApiResponse<CustomerListData>> {
    return this.makeRequest<CustomerListData>(`/admin/customer/list?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async exportCustomers(): Promise<void> {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    const url = `${API_URL.BASE_URL}/admin/customer/export`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-App-Version': APP_CONFIG.version,
      },
    });

    if (!response.ok) throw new Error(`Export failed: ${response.status}`);

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="(.+?)"/);
    const filename = match ? match[1] : `customers_export_${Date.now()}.xlsx`;

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  }

  static async getCustomerDetails(customerId: string): Promise<ApiResponse<CustomerDetailsData>> {
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
      throw new Error('Invalid customer ID provided');
    }
    
    return this.makeRequest<CustomerDetailsData>(`/admin/customer/details/${customerId}`, {
      method: 'GET',
    });
  }
}