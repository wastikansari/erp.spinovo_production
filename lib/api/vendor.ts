import { ApiResponse } from '../types';
import { CreateCopilotRequest } from '../types/copilot';
import { CreateVendorRequest, CreateVendorResponse, VendorDetailsData, VendorListData } from '../types/vendor';
import { BaseApiService } from './base';

// export class VendorApiServices extends BaseApiService {
// GET vendor list
//   static async getVendorList(page: number = 1, limit: number = 100) {
//     return this.makeRequest('/admin/vender/list', {
//       method: 'GET',
//     });
//   }

//   // REGISTER vendor
//   static async registerVendor(payload) {
//     return this.makeRequest('/admin/vender/register', {
//       method: 'POST',
//       body: JSON.stringify(payload),
//     });
//   }
// }

export class VendorApiService extends BaseApiService {
  static async getVendors(page: number = 1, limit: number = 20): Promise<ApiResponse<VendorListData>> {
    console.log(`=== FETCHING VENDORS ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<VendorListData>(`/admin/vendor/list?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getVendorDetails(vendorId: string): Promise<ApiResponse<VendorDetailsData>> {
    console.log(`=== FETCHING VENDOR DETAILS ===`);
    console.log(`Vendor ID: ${vendorId}`);

    if (!vendorId || vendorId === 'undefined' || vendorId === 'null') {
      console.error('Invalid vendor ID provided:', vendorId);
      throw new Error('Invalid vendor ID provided');
    }

    return this.makeRequest<VendorDetailsData>(`/admin/vendor/profile/${vendorId}`, {
      method: 'GET',
    });
  }

  static async createVendor(data: CreateVendorRequest): Promise<ApiResponse<CreateVendorResponse>> {
    console.log(`=== CREATING VENDOR ===`);
    console.log('Data:', { ...data, password: '[HIDDEN]' });

    return this.makeRequest<CreateVendorResponse>('/admin/vendor/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}