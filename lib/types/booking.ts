import { BaseEntity } from './index';

export interface Booking extends BaseEntity {
  customer_id: string;
  order_no: number;
  order_display_no: string;
  order_stage_id: number;
  order_type: string;
  service_id: number;
  service_name: string;
  garment_qty: number;
  garment_original_amount: number;
  garment_discount_amount: number;
  service_charges: number;
  slot_charges: number;
  order_amount: number;
  transaction_id: string;
  booking_date: string;
  booking_time: string;
  address_id: string;
  ord_status: string;
  delivery_charge: number;
  tip_amount: number;
  total_billing: number;
  payment_mode: string;
  payment_status: string;
  handling_charges: number;
  order_details: string;
  
  
}

export interface BookingListData {
  totalOrders: number;
  total_pages: number;
  page: number;
  bookingList: Booking[];
}

export interface BookingDetailsData {
  order: Booking;
  customer: Customer;
  address: Address;
}

// Import from other type files
import { Customer, Address } from './customer';