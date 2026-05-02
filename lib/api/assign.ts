import { AssignBookingListData, AssignBookingRequest, AssignBookingResponse } from '../types/assign';
import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { API_URL } from '../config/constants';

export class AssignApiService extends BaseApiService {
  static async getAssignedBookings(page: number = 1, limit: number = 20): Promise<ApiResponse<AssignBookingListData>> {
    console.log(`=== FETCHING ASSIGNED BOOKINGS ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<AssignBookingListData>(`${API_URL.PICKUP_LIST}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async asignPickupBooking(data: AssignBookingRequest): Promise<ApiResponse<AssignBookingResponse>> {
    console.log(`=== PICKUPASSIGNING BOOKING ===`);
    console.log('Data:', data);
    
    return this.makeRequest<AssignBookingResponse>(API_URL.PICKUP_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}