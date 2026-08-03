import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { API_URL } from '../config/constants';
import {
  B2BPickupPendingListData,
  B2BPickupAssignedListData,
  B2BPickupAssignRequest,
  B2BPickupAssignResponse,
  B2BPickupReassignRequest,
  B2BPickupReassignResponse,
} from '../types/b2b-pickup-assign';
import {
  B2BQualityCheckPendingListData,
  B2BQcCompletedPayload,
  B2BQcCompletedResponse,
  B2BProcessPendingListData,
  B2BProcessAssignedListData,
  B2BProcessAssignRequest,
  B2BProcessAssignResponse,
  B2BProcessCompletedResponse,
  B2BProcessInwardPendingListData,
  B2BVerifyInwardOtpResponse,
} from '../types/b2b-process-assign';
import {
  B2BDeliveryPendingListData,
  B2BDeliveryAssignedListData,
  B2BDeliveryAssignRequest,
  B2BDeliveryAssignResponse,
  B2BDeliveryReassignRequest,
  B2BDeliveryReassignResponse,
  B2BDeliveredListData,
} from '../types/b2b-delivery-assign';

// Mirrors lib/api/assign.ts (retail AssignApiService) method-naming
// convention 1:1 for the new isolated B2B order pipeline
// (/admin/b2b/order/*) — pickup → QC → vendor process → delivery.
export class B2BAssignApiService extends BaseApiService {
  // ── Pickup ──────────────────────────────────────────────────────────────

  static async getPickupPendingList(page: number = 1, limit: number = 20): Promise<ApiResponse<B2BPickupPendingListData>> {
    return this.makeRequest<B2BPickupPendingListData>(`${API_URL.B2B_PICKUP_PENDING}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getPickupAssignedList(page: number = 1, limit: number = 20): Promise<ApiResponse<B2BPickupAssignedListData>> {
    return this.makeRequest<B2BPickupAssignedListData>(`${API_URL.B2B_PICKUP_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async pickupAssign(data: B2BPickupAssignRequest): Promise<ApiResponse<B2BPickupAssignResponse>> {
    return this.makeRequest<B2BPickupAssignResponse>(API_URL.B2B_PICKUP_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async pickupReassign(data: B2BPickupReassignRequest): Promise<ApiResponse<B2BPickupReassignResponse>> {
    return this.makeRequest<B2BPickupReassignResponse>(API_URL.B2B_PICKUP_REASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ── Quality Check ───────────────────────────────────────────────────────

  static async getQualityCheckPendingList(page: number = 1, limit: number = 20): Promise<ApiResponse<B2BQualityCheckPendingListData>> {
    return this.makeRequest<B2BQualityCheckPendingListData>(`${API_URL.B2B_QUALITY_CHECK_PENDING}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async qcCompleted(orderId: string, payload: B2BQcCompletedPayload): Promise<ApiResponse<B2BQcCompletedResponse>> {
    const formData = new FormData();
    formData.append('items', JSON.stringify(payload.items));
    if (payload.note) formData.append('note', payload.note);
    if (payload.photo) formData.append('photo', payload.photo);
    return this.makeRequest<B2BQcCompletedResponse>(`${API_URL.B2B_QC_COMPLETED}/${orderId}`, {
      method: 'POST',
      body: formData,
    });
  }

  // ── Vendor Process Assignment ───────────────────────────────────────────

  static async getProcessPendingList(page: number = 1, limit: number = 20): Promise<ApiResponse<B2BProcessPendingListData>> {
    return this.makeRequest<B2BProcessPendingListData>(`${API_URL.B2B_PROCESS_PENDING}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async processAssign(data: B2BProcessAssignRequest): Promise<ApiResponse<B2BProcessAssignResponse>> {
    return this.makeRequest<B2BProcessAssignResponse>(API_URL.B2B_PROCESS_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getProcessAssignedList(page: number = 1, limit: number = 20): Promise<ApiResponse<B2BProcessAssignedListData>> {
    return this.makeRequest<B2BProcessAssignedListData>(`${API_URL.B2B_PROCESS_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  // Legacy admin-side completion path (mirrors retail's processAssignCompleted).
  // Real vendor-driven completion is the OTP flow below.
  static async processAssignCompleted(id: string): Promise<ApiResponse<B2BProcessCompletedResponse>> {
    return this.makeRequest<B2BProcessCompletedResponse>(`${API_URL.B2B_PROCESS_COMPLETED}/${id}`, {
      method: 'GET',
    });
  }

  static async getProcessInwardPendingList(page: number = 1, limit: number = 20): Promise<ApiResponse<B2BProcessInwardPendingListData>> {
    return this.makeRequest<B2BProcessInwardPendingListData>(`${API_URL.B2B_PROCESS_INWARD_PENDING}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async verifyProcessInwardOtp(processId: string, otp: string): Promise<ApiResponse<B2BVerifyInwardOtpResponse>> {
    return this.makeRequest<B2BVerifyInwardOtpResponse>(`/admin/b2b/order/process/${processId}/verify-inward-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  // ── Delivery ─────────────────────────────────────────────────────────────

  static async getDeliveryPendingList(page: number = 1, limit: number = 20): Promise<ApiResponse<B2BDeliveryPendingListData>> {
    return this.makeRequest<B2BDeliveryPendingListData>(`${API_URL.B2B_DELIVERY_PENDING}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async deliveryAssign(data: B2BDeliveryAssignRequest): Promise<ApiResponse<B2BDeliveryAssignResponse>> {
    return this.makeRequest<B2BDeliveryAssignResponse>(API_URL.B2B_DELIVERY_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deliveryReassign(data: B2BDeliveryReassignRequest): Promise<ApiResponse<B2BDeliveryReassignResponse>> {
    return this.makeRequest<B2BDeliveryReassignResponse>(API_URL.B2B_DELIVERY_REASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getDeliveryAssignedList(page: number = 1, limit: number = 20): Promise<ApiResponse<B2BDeliveryAssignedListData>> {
    return this.makeRequest<B2BDeliveryAssignedListData>(`${API_URL.B2B_DELIVERY_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getDeliveredList(page: number = 1, limit: number = 20): Promise<ApiResponse<B2BDeliveredListData>> {
    return this.makeRequest<B2BDeliveredListData>(`${API_URL.B2B_DELIVERED_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }
}
