import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { 
  AssignBookingListData, 
  AssignBookingRequest, 
  AssignBookingResponse 
} from '../types/assign';

export class AssignApiService extends BaseApiService {
  static async getAssignedBookings(page: number = 1, limit: number = 20): Promise<ApiResponse<AssignBookingListData>> {
    console.log(`=== FETCHING ASSIGNED BOOKINGS ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<AssignBookingListData>(`/admin/assign/list?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async assignBooking(data: AssignBookingRequest): Promise<ApiResponse<AssignBookingResponse>> {
    console.log(`=== ASSIGNING BOOKING ===`);
    console.log('Data:', data);
    
    return this.makeRequest<AssignBookingResponse>('/admin/booking/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}