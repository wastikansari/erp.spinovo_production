import { PickupAssignBookingListData, PickupAssignBookingRequest, PickupAssignBookingResponse } from '../types/pickup-assign';
import { ProcessAssignListData, ProcessAssignRequest, ProcessAssignResponse, PendingSubOrderListData } from '../types/process-assign';
import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { API_URL } from '../config/constants';
import { DeliveryAssignBookingListData, DeliveryAssignBookingRequest, DeliveryAssignBookingResponse, DeliveryPendingSubOrderListData } from '../types/delivery-assign';

export class AssignApiService extends BaseApiService {
  
  static async getPickupAssignedList(page: number = 1, limit: number = 20): Promise<ApiResponse<PickupAssignBookingListData>> {
    console.log(`=== FETCHING PICKUP ASSIGNED LIST ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<PickupAssignBookingListData>(`${API_URL.PICKUP_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async pickupAssign(data: PickupAssignBookingRequest): Promise<ApiResponse<PickupAssignBookingResponse>> {
    console.log(`=== PICKUP ASSIGN ===`);
    console.log('Data:', data);

    return this.makeRequest<PickupAssignBookingResponse>(API_URL.PICKUP_ASSIGN, {
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
    console.log(`=== FETCHING PROCESS ASSIGNED LIST ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<ProcessAssignListData>(`${API_URL.PROCESS_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async processAssign(data: ProcessAssignRequest): Promise<ApiResponse<ProcessAssignResponse>> {
    console.log(`=== FETCHING PROCESS ASSIGN ===`);
    console.log('Data:', data);

    return this.makeRequest<ProcessAssignResponse>(API_URL.PROCESS_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getPendingProcessSuborders(page: number = 1, limit: number = 20): Promise<ApiResponse<PendingSubOrderListData>> {
    return this.makeRequest<PendingSubOrderListData>(`${API_URL.PROCESS_SUBORDER_PENDING}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async processAssignCompleted(booking_id: string,): Promise<ApiResponse<ProcessAssignResponse>> {
    console.log(`=== FETCHING PROCESS ASSIGN COMPLETED ===`);
    console.log('Data:', booking_id);

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
    console.log(`=== FETCHING DELIVERY ASSIGNED LIST ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<DeliveryAssignBookingListData>(`${API_URL.DELIVERY_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getDeliveryPendingSuborders(page: number = 1, limit: number = 20): Promise<ApiResponse<DeliveryPendingSubOrderListData>> {
    return this.makeRequest<DeliveryPendingSubOrderListData>(`${API_URL.DELIVERY_SUBORDER_PENDING}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async deliveryAssign(data: DeliveryAssignBookingRequest): Promise<ApiResponse<DeliveryAssignBookingResponse>> {
    console.log(`=== FETCHING DELIVERY ASSIGN ===`);
    console.log('Data:', data);

    return this.makeRequest<DeliveryAssignBookingResponse>(API_URL.DELIVERY_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

}

