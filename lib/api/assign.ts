import { PickupAssignBookingListData, PickupAssignBookingRequest, PickupAssignBookingResponse, PickupReassignRequest, PickupReassignResponse } from '../types/pickup-assign';
import {
  ProcessAssignListData,
  ProcessAssignRequest,
  ProcessAssignResponse,
  PendingSubOrderListData,
  ProcessServiceSummary,
  VendorInwardOutwardData,
  IroningOrder,
  ServiceVendorConfig,
} from '../types/process-assign';
import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { API_URL } from '../config/constants';
import { DeliveryAssignBookingListData, DeliveryAssignBookingRequest, DeliveryAssignBookingResponse, DeliveryPendingSubOrderListData, CancelPendingSubOrderListData, DeliveryReassignRequest, DeliveryReassignResponse } from '../types/delivery-assign';
import { BookingListData } from '../types/booking';

export class AssignApiService extends BaseApiService {


    static async getPickupPendingList(page: number = 1, limit: number = 20): Promise<ApiResponse<BookingListData>> {
      return this.makeRequest<BookingListData>(`${API_URL.PICKUP_PENDING}?page=${page}&limit=${limit}`, {
        method: 'GET',
        }
      );
    }
  
  static async getPickupAssignedList(page: number = 1, limit: number = 20): Promise<ApiResponse<PickupAssignBookingListData>> {
    return this.makeRequest<PickupAssignBookingListData>(`${API_URL.PICKUP_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async pickupAssign(data: PickupAssignBookingRequest): Promise<ApiResponse<PickupAssignBookingResponse>> {
    return this.makeRequest<PickupAssignBookingResponse>(API_URL.PICKUP_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async pickupReassign(data: PickupReassignRequest): Promise<ApiResponse<PickupReassignResponse>> {
    return this.makeRequest<PickupReassignResponse>(API_URL.PICKUP_REASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getPendingQualityCheckSuborders(page: number = 1, limit: number = 20): Promise<ApiResponse<PendingSubOrderListData>> {
    return this.makeRequest<PendingSubOrderListData>(`${API_URL.QUALITY_CHECK_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getProcessAssignedList(page: number = 1, limit: number = 20): Promise<ApiResponse<ProcessAssignListData>> {
    return this.makeRequest<ProcessAssignListData>(`${API_URL.PROCESS_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async processAssign(data: ProcessAssignRequest): Promise<ApiResponse<ProcessAssignResponse>> {
    return this.makeRequest<ProcessAssignResponse>(API_URL.PROCESS_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getPendingProcessSuborders(
    page: number = 1,
    limit: number = 20,
    serviceId?: number,
  ): Promise<ApiResponse<PendingSubOrderListData>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (serviceId != null) params.set('service_id', String(serviceId));
    return this.makeRequest<PendingSubOrderListData>(`${API_URL.PROCESS_SUBORDER_PENDING}?${params}`, {
      method: 'GET',
    });
  }

    static async getIroningPendingSuborders(
    page: number = 1,
    limit: number = 20,
    serviceId?: number,
  ): Promise<ApiResponse<PendingSubOrderListData>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (serviceId != null) params.set('service_id', String(serviceId));
    return this.makeRequest<PendingSubOrderListData>(`${API_URL.IRONING_PENDING}?${params}`, {
      method: 'GET',
    });
  }

    static async getWashDcPendingSuborders(
    page: number = 1,
    limit: number = 20,
    serviceId?: number,
  ): Promise<ApiResponse<PendingSubOrderListData>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (serviceId != null) params.set('service_id', String(serviceId));
    return this.makeRequest<PendingSubOrderListData>(`${API_URL.WASH_DC_PENDING}?${params}`, {
      method: 'GET',
    });
  }

  // ── Process Pending summary (service-grouped counts, no hardcoded names) ──
  static async getProcessPendingSummary(): Promise<ApiResponse<{ summary: ProcessServiceSummary[]; total: number }>> {
    return this.makeRequest(`${API_URL.PROCESS_PENDING_SUMMARY}`, { method: 'GET' });
  }

    static async getWashDCPendingSummary(): Promise<ApiResponse<{ summary: ProcessServiceSummary[]; total: number }>> {
    return this.makeRequest(`${API_URL.WASH_DC_PENDING}`, { method: 'GET' });
  }

    static async getIroningPendingSummary(): Promise<ApiResponse<{ summary: ProcessServiceSummary[]; total: number }>> {
    return this.makeRequest(`${API_URL.IRONING_PENDING}`, { method: 'GET' });
  }

  // ── Vendor Outward ────────────────────────────────────────────────────────
  static async getVendorOutward(page = 1, limit = 20): Promise<ApiResponse<VendorInwardOutwardData>> {
    return this.makeRequest(`${API_URL.VENDOR_OUTWARD}?page=${page}&limit=${limit}`, { method: 'GET' });
  }

  // ── Vendor Inward Pending ─────────────────────────────────────────────────
  static async getVendorInwardPending(page = 1, limit = 20): Promise<ApiResponse<VendorInwardOutwardData>> {
    return this.makeRequest(`${API_URL.VENDOR_INWARD_PENDING}?page=${page}&limit=${limit}`, { method: 'GET' });
  }

  // ── Verify Inward OTP ─────────────────────────────────────────────────────
  static async verifyInwardOtp(processId: string, otp: string): Promise<ApiResponse<{ next_status: string; service_id: number }>> {
    return this.makeRequest(`/admin/vendor/orders/${processId}/verify-inward-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  // ── Ironing Pending ───────────────────────────────────────────────────────
  static async getIroningPending(page = 1, limit = 20): Promise<ApiResponse<{ orders: IroningOrder[]; total: number; page: number; totalPages: number }>> {
    return this.makeRequest(`${API_URL.IRONING_PENDING}?page=${page}&limit=${limit}`, { method: 'GET' });
  }

  static async startIroning(subOrderId: string): Promise<ApiResponse<{ ord_status: string }>> {
    return this.makeRequest(`/admin/orders/${subOrderId}/ironing-start`, { method: 'PATCH' });
  }

  static async completeIroning(subOrderId: string): Promise<ApiResponse<{ ord_status: string }>> {
    return this.makeRequest(`/admin/orders/${subOrderId}/ironing-complete`, { method: 'PATCH' });
  }

  // ── Service vendor config (dynamic — never hardcode service names) ─────────
  static async getServiceVendorConfig(): Promise<ApiResponse<{ services: ServiceVendorConfig[] }>> {
    return this.makeRequest(`${API_URL.SERVICE_VENDOR_CONFIG}`, { method: 'GET' });
  }

  static async processAssignCompleted(booking_id: string,): Promise<ApiResponse<ProcessAssignResponse>> {
    return this.makeRequest<ProcessAssignResponse>(`${API_URL.PROCESS_COMPLETED}/${booking_id}`, {
      method: 'GET',
    });
  }

  static async qualityCheckCompleted(subOrderId: string): Promise<ApiResponse<unknown>> {
    return this.makeRequest<unknown>(`${API_URL.QUALITY_CHECK_COMPLETED}/${subOrderId}`, {
      method: 'GET',
    });
  }

  static async getDeliveryAssignedList(page: number = 1, limit: number = 20): Promise<ApiResponse<DeliveryAssignBookingListData>> {
    return this.makeRequest<DeliveryAssignBookingListData>(`${API_URL.DELIVERY_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

    static async getDeliveredList(page: number = 1, limit: number = 20): Promise<ApiResponse<DeliveryAssignBookingListData>> {
    return this.makeRequest<DeliveryAssignBookingListData>(`${API_URL.DELIVERED_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getDeliveryPendingSuborders(page: number = 1, limit: number = 20): Promise<ApiResponse<DeliveryPendingSubOrderListData>> {
    return this.makeRequest<DeliveryPendingSubOrderListData>(`${API_URL.DELIVERY_SUBORDER_PENDING}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getCancelPendingSuborders(page: number = 1, limit: number = 20): Promise<ApiResponse<CancelPendingSubOrderListData>> {
    return this.makeRequest<CancelPendingSubOrderListData>(`${API_URL.CANCEL_SUBORDER_PENDING}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async deliveryAssign(data: DeliveryAssignBookingRequest): Promise<ApiResponse<DeliveryAssignBookingResponse>> {
    return this.makeRequest<DeliveryAssignBookingResponse>(API_URL.DELIVERY_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deliveryReassign(data: DeliveryReassignRequest): Promise<ApiResponse<DeliveryReassignResponse>> {
    return this.makeRequest<DeliveryReassignResponse>(API_URL.DELIVERY_REASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

}

