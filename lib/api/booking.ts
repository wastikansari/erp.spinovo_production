import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import {
  BookingListData,
  BookingDetailsData,
  SubOrderDetailsData,
} from '../types/booking';

export class BookingApiService extends BaseApiService {
  // ORDER LIST V2
  static async getBookings(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<BookingListData>> {
    return this.makeRequest<BookingListData>(
      `/admin/order/list/v2?page=${page}&limit=${limit}`,
      {
        method: 'GET',
      }
    );
  }

  // ORDER DETAILS V2
  static async getBookingDetails(
    bookingId: string
  ): Promise<ApiResponse<BookingDetailsData>> {
    if (!bookingId) {
      throw new Error('Invalid booking id');
    }

    return this.makeRequest<BookingDetailsData>(
      `/admin/order/details/v2/${bookingId}`,
      {
        method: 'GET',
      }
    );
  }

  // SUB ORDER DETAILS V2
  static async getSubOrderDetails(
    subOrderId: string
  ): Promise<ApiResponse<SubOrderDetailsData>> {
    if (!subOrderId) {
      throw new Error('Invalid sub order id');
    }

    return this.makeRequest<SubOrderDetailsData>(
      `/admin/order/sub/details/v2/${subOrderId}`,
      {
        method: 'GET',
      }
    );
  }
}


// import { BaseApiService } from './base';
// import { ApiResponse } from '../types';
// import { BookingListData, BookingDetailsData } from '../types/booking';

// export class BookingApiService extends BaseApiService {
//   static async getBookings(page: number = 1, limit: number = 20): Promise<ApiResponse<BookingListData>> {
//     console.log(`=== FETCHING BOOKINGS ===`);
//     console.log(`Page: ${page}, Limit: ${limit}`);
//     return this.makeRequest<BookingListData>(`/admin/booking/list?page=${page}&limit=${limit}`, {
//       method: 'GET',
//     });
//   }

//   static async getBookingDetails(bookingId: string): Promise<ApiResponse<BookingDetailsData>> {
//     console.log(`=== FETCHING BOOKING DETAILS ===`);
//     console.log(`Booking ID: ${bookingId}`);
    
//     if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
//       console.error('Invalid booking ID provided:', bookingId);
//       throw new Error('Invalid booking ID provided');
//     }
    
//     return this.makeRequest<BookingDetailsData>(`/admin/booking/details/${bookingId}`, {
//       method: 'GET',
//     });
//   }
// }

