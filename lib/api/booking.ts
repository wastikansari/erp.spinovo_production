import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { BookingListData, BookingDetailsData } from '../types/booking';

export class BookingApiService extends BaseApiService {
  static async getBookings(page: number = 1, limit: number = 20): Promise<ApiResponse<BookingListData>> {
    console.log(`=== FETCHING BOOKINGS ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<BookingListData>(`/admin/booking/list?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getBookingDetails(bookingId: string): Promise<ApiResponse<BookingDetailsData>> {
    console.log(`=== FETCHING BOOKING DETAILS ===`);
    console.log(`Booking ID: ${bookingId}`);
    
    if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
      console.error('Invalid booking ID provided:', bookingId);
      throw new Error('Invalid booking ID provided');
    }
    
    return this.makeRequest<BookingDetailsData>(`/admin/booking/details/${bookingId}`, {
      method: 'GET',
    });
  }
}