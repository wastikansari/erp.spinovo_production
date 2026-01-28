import { BaseApiService } from './base';

export class VendorApiService extends BaseApiService {
  // GET vendor list
  static async getVendorList() {
    return this.makeRequest('/admin/vender/list', {
      method: 'GET',
    });
  }

  // REGISTER vendor
  static async registerVendor(payload) {
    return this.makeRequest('/admin/vender/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
