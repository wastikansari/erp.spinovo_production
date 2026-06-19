import { ApiResponse } from '../types';
import { API_URL } from '../config/constants';
import { BaseApiService } from './base';
import {
  VendorOrderListData,
  VendorOrderStatsData,
  ActiveVendorListData,
  ReassignResponse,
  VendorOrderStatus,
  OverdueOrderListData,
  VendorPerformanceListData,
  VendorOrderSummaryData,
} from '../types/vendor-orders';

export class VendorOrderApiService extends BaseApiService {

  // All vendor orders — optionally filtered by status
  static async getVendorOrders(
    page = 1,
    limit = 20,
    status: VendorOrderStatus | 'all' = 'all',
  ): Promise<ApiResponse<VendorOrderListData>> {
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      status,
    }).toString();
    return this.makeRequest<VendorOrderListData>(
      `${API_URL.VENDOR_ORDERS}?${qs}`,
      { method: 'GET' },
    );
  }

  // Dashboard stat cards
  static async getStats(): Promise<ApiResponse<VendorOrderStatsData>> {
    return this.makeRequest<VendorOrderStatsData>(
      API_URL.VENDOR_ORDERS_STATS,
      { method: 'GET' },
    );
  }

  // Orders rejected by vendors — needs reassignment
  static async getRejectedOrders(
    page = 1,
    limit = 20,
  ): Promise<ApiResponse<VendorOrderListData>> {
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    }).toString();
    return this.makeRequest<VendorOrderListData>(
      `${API_URL.VENDOR_ORDERS_REJECTED}?${qs}`,
      { method: 'GET' },
    );
  }

  // Active vendors available for reassignment
  static async getActiveVendors(): Promise<ApiResponse<ActiveVendorListData>> {
    return this.makeRequest<ActiveVendorListData>(
      API_URL.VENDOR_LIST_ACTIVE,
      { method: 'GET' },
    );
  }

  // Overdue orders (timer running but past deadline)
  static async getOverdueOrders(page = 1, limit = 20): Promise<ApiResponse<OverdueOrderListData>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();
    return this.makeRequest<OverdueOrderListData>(
      `${API_URL.VENDOR_ORDERS}/overdue?${qs}`,
      { method: 'GET' },
    );
  }

  // Per-vendor performance stats
  static async getVendorPerformance(page = 1, limit = 20): Promise<ApiResponse<VendorPerformanceListData>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();
    return this.makeRequest<VendorPerformanceListData>(
      `/admin/vendor/performance?${qs}`,
      { method: 'GET' },
    );
  }

  // Orders for a specific vendor (for vendor detail page)
  static async getVendorOrderSummary(vendorId: string): Promise<ApiResponse<VendorOrderSummaryData>> {
    return this.makeRequest<VendorOrderSummaryData>(
      `/admin/vendor/${vendorId}/orders/summary`,
      { method: 'GET' },
    );
  }

  // Reassign a rejected order to a new vendor
  static async reassignOrder(
    processId: string,
    vendorId: string,
  ): Promise<ApiResponse<ReassignResponse>> {
    return this.makeRequest<ReassignResponse>(
      `/admin/vendor/orders/${processId}/reassign`,
      {
        method: 'POST',
        body: JSON.stringify({ vendor_id: vendorId }),
      },
    );
  }
}
