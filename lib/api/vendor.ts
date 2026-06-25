import { ApiResponse } from '../types';
import {
  CreateVendorRequest,
  CreateVendorResponse,
  VendorDetailsData,
  VendorListData,
  VendorKycDetailData,
  PendingKycListData,
} from '../types/vendor';
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

    static async getIroningVendors(page: number = 1, limit: number = 20): Promise<ApiResponse<VendorListData>> {
    console.log(`=== FETCHING VENDORS ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<VendorListData>(`/admin/ironing/vendor/list`, {
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

  // ── KYC review ──────────────────────────────────────────────────────────────

  // Vendors awaiting review (kycStatus = "submitted")
  static async getPendingKyc(page: number = 1, limit: number = 20): Promise<ApiResponse<PendingKycListData>> {
    return this.makeRequest<PendingKycListData>(
      `/admin/vendor/kyc/pending?page=${page}&limit=${limit}`,
      { method: 'GET' },
    );
  }

  // Full KYC detail (vendor + submitted prices)
  static async getVendorKycDetail(vendorId: string): Promise<ApiResponse<VendorKycDetailData>> {
    if (!vendorId || vendorId === 'undefined' || vendorId === 'null') {
      throw new Error('Invalid vendor ID provided');
    }
    return this.makeRequest<VendorKycDetailData>(`/admin/vendor/kyc/${vendorId}`, {
      method: 'GET',
    });
  }

  // Approve KYC → activates account + approves pending prices
  static async approveKyc(vendorId: string): Promise<ApiResponse<{ kycStatus: string; accountIsActive: boolean }>> {
    return this.makeRequest(`/admin/vendor/kyc/${vendorId}/approve`, {
      method: 'PATCH',
    });
  }

  // Reject KYC with a reason
  static async rejectKyc(vendorId: string, reason: string): Promise<ApiResponse<{ kycStatus: string; kycRejectionReason: string }>> {
    return this.makeRequest(`/admin/vendor/kyc/${vendorId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // ── Per-price-entry approve / reject ────────────────────────────────────────

  static async approveSinglePrice(priceId: string): Promise<ApiResponse<{ price: object }>> {
    return this.makeRequest(`/admin/vendor/price/${priceId}/approve`, {
      method: 'PATCH',
    });
  }

  static async rejectSinglePrice(priceId: string, remark: string): Promise<ApiResponse<{ price: object }>> {
    return this.makeRequest(`/admin/vendor/price/${priceId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ remark }),
    });
  }

  static async approveBankDetails(vendorId: string): Promise<ApiResponse<{ bankDetailsApproved: boolean }>> {
    return this.makeRequest(`/admin/vendor/${vendorId}/bank-details/approve`, {
      method: 'PATCH',
    });
  }
}