import { BaseEntity } from './index';
import { Booking } from './booking';
import { Address } from './customer';
import { Vendor } from './vendor';

export interface ProcessAssignBooking extends BaseEntity {
  _id: string,
  booking_id: string;
  vendor_id: string;
  status: number;
  bookingObjectId: string;
  vendorObjectId: string;
  customerObjectId: string;
  order_details: Booking;
  address_details: Address;
  vendor_details: Vendor;
}

export interface ProcessAssignListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  assignList: ProcessAssignBooking[];
}

export interface ProcessAssignRequest {
  booking_id: string;
  vendor_id: string;
}

export interface ProcessAssignResponse {
  assign_id: string;
}