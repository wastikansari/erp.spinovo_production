import { BaseEntity } from './index';
import { Booking } from './booking';
import { Address } from './customer';
import { Vendor } from './vendor';

export interface ProcessAssignBooking extends BaseEntity {
  _id: string;
  order_id: string;
  sub_order_id: string;
  vendor_id: string;
  status: number;
  isStarted: number;
  orderObjectId: string;
  subOrderObjectId: string;
  vendorObjectId: string;
  order_details: Booking;
  sub_order_details: PendingSubOrder;
  address_details: Address;
  vendor_details: Vendor;
}

export interface ProcessAssignListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  assignList: ProcessAssignBooking[];
}

export interface PendingSubOrder {
  _id: string;
  order_id: string;
  customer_id: string;
  address_id: string;
  service_id: string;
  service_name: string;
  order_no: string;
  sub_order_no: string;
  order_stage_id: number;
  booking_date: string;
  booking_time: string;
  service_duration_hours: number;
  expected_delivery_date: string;
  expected_delivery_time: string;
  garment_details: string;
  garment_qty: number;
  garment_amount: number;
  no_of_bag: number;
  no_of_bag_outward: number;
  no_of_bag_return: number;
  ord_status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingSubOrderListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  subOrders: PendingSubOrder[];
}

export interface ProcessAssignRequest {
  order_id: string;
  sub_order_id: string;
  vendor_id: string;
}

export interface ProcessAssignResponse {
  assign_id: string;
}