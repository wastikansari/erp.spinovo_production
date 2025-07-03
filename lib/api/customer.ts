import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { CustomerListData, CustomerDetailsData } from '../types/customer';

export class CustomerApiService extends BaseApiService {
  static async getCustomers(page: number = 1, limit: number = 20): Promise<ApiResponse<CustomerListData>> {
    console.log(`=== FETCHING CUSTOMERS ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<CustomerListData>(`/admin/customer/list?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getCustomerDetails(customerId: string): Promise<ApiResponse<CustomerDetailsData>> {
    console.log(`=== FETCHING CUSTOMER DETAILS ===`);
    console.log(`Customer ID: ${customerId}`);
    
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
      console.error('Invalid customer ID provided:', customerId);
      throw new Error('Invalid customer ID provided');
    }
    
    return this.makeRequest<CustomerDetailsData>(`/admin/customer/details/${customerId}`, {
      method: 'GET',
    });
  }
}