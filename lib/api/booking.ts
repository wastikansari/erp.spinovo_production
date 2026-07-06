import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import {
  BookingListData,
  BookingDetailsData,
  SubOrderDetailsData,
  ServiceCategoryData,
  ServiceCategoryListData,
  MainOrderDetailsData,
  UpdateGarmentRequest,
  AddServiceRequest,
  PendingQCListData,
  PendingQCOrder,
} from '../types/booking';
import { API_URL } from '../config/constants';
import { AuthService } from '../auth';
import { OrderTimelineResponse } from '../types/orderTimeline';


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

  // TODAY'S ORDERS ONLY
  static async getTodayBookings(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<BookingListData>> {
    return this.makeRequest<BookingListData>(
      `/admin/order/list/v2?page=${page}&limit=${limit}&today=true`,
      {
        method: 'GET',
      }
    );
  }

  // PENDING QUALITY CHECK MAIN ORDERS
  static async getPendingQualityCheckOrders(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PendingQCListData>> {
    return this.makeRequest<PendingQCListData>(
      `/admin/order/quality-check/mainorder/pending?page=${page}&limit=${limit}`,
      { method: 'GET' }
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

  // FULL SERVICE + CATEGORY LIST
  static async getServiceCategoryList(): Promise<ApiResponse<ServiceCategoryListData>> {
    return this.makeRequest<ServiceCategoryListData>(
      '/admin/service/category',
      { method: 'GET' }
    );
  }

  // MAIN ORDER DETAILS (order + subOrders)
  static async getMainOrderDetails(
    orderId: string
  ): Promise<ApiResponse<MainOrderDetailsData>> {
    if (!orderId) throw new Error('Invalid order id');
    return this.makeRequest<MainOrderDetailsData>(
      `/admin/order/details/${orderId}`,
      { method: 'GET' }
    );
  }

  // MAIN ORDER QC COMPLETED
  static async orderQcCompleted(orderId: string): Promise<ApiResponse<PendingQCOrder>> {
    if (!orderId) throw new Error('Invalid order id');
    return this.makeRequest<PendingQCOrder>(
      `${API_URL.ORDER_QC_COMPLETED}/${orderId}`,
      { method: 'GET' }
    );
  }

  // ADD NEW SERVICE WITH GARMENT DETAILS TO AN EXISTING ORDER
  static async addServiceWithGarments(
    payload: AddServiceRequest
  ): Promise<ApiResponse<unknown>> {
    return this.makeRequest(
      `${API_URL.ADD_SERVICE}/${payload.order_id}`,
      {
        method: 'POST',
        body: JSON.stringify({ garment_details: payload.garment_details }),
      }
    );
  }

  // CATEGORY LIST FOR GARMENT UPDATE
  static async getCategoryList(
    serviceId: string
  ): Promise<ApiResponse<ServiceCategoryData>> {
    return this.makeRequest<ServiceCategoryData>(
      `/admin/order/update/category/${serviceId}`,
      { method: 'GET' }
    );
  }

  // UPDATE SUB-ORDER GARMENT DETAILS
  // Sends multipart/form-data (not JSON) — this endpoint requires form fields.
  static async updateSubOrderGarment(
    payload: UpdateGarmentRequest
  ): Promise<ApiResponse<SubOrderDetailsData>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    // const form = new FormData();
    // form.append('sub_order_id', payload.sub_order_id);
    // form.append('garment_details', payload.garment_details);
    // form.append('unpaid_amount', String(payload.unpaid_amount));

const response = await fetch(
  `${this.API_BASE_URL}${API_URL.GARMENT_UPDATE}`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sub_order_id: String(payload.sub_order_id),
      garment_details: payload.garment_details,
      unpaid_amount: Number(payload.unpaid_amount),
    }),
  }
);

    let data: ApiResponse<SubOrderDetailsData>;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Server returned an invalid response (HTTP ${response.status})`);
    }

    if (!data.status) {
      throw new Error(data.msg || 'Failed to update garment details');
    }

    return data;
  }

  // UPDATE GARMENT SEGREGATION (QC v3)
  static async updateGarmentSegregation(
    subOrderId: string,
    garmentSegregated: Array<{
      category_id: number;
      category: string;
      category_prices: string;
      clothes: Array<{ name: string; qty: number }>;
      total_items: number;
      total_amount: number;
    }>
  ): Promise<ApiResponse<unknown>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${this.API_BASE_URL}/admin/suborder/garment/segregation/update`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sub_order_id: subOrderId, garment_segregated: garmentSegregated }),
    });
    const data = await response.json();
    if (!data.status) throw new Error(data.msg || 'Failed to save garment segregation');
    return data;
  }

  // CANCEL SUB-ORDER
  static async cancelSubOrder(subOrderId: string): Promise<ApiResponse<unknown>> {
    if (!subOrderId) throw new Error('Invalid sub-order id');
    return this.makeRequest(
      `/admin/order/quality-check/suborder/cancel/${subOrderId}`,
      { method: 'PATCH' }
    );
  }



// ORDER TIMELINE — pickup / process / delivery timestamps for all sub-orders
static async getOrderTimeline(
  page: number = 1,
  limit: number = 20,
  ord_status?: string
): Promise<ApiResponse<OrderTimelineResponse>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (ord_status) params.set('ord_status', ord_status);
  return this.makeRequest<OrderTimelineResponse>(
    `/admin/orders/pickup/process/time/details?${params.toString()}`,
    { method: 'GET' }
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

