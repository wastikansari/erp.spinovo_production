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
  pickup_qty: number;
  no_of_garments_picked: number;
  no_of_garments_processed: number;
  no_of_garments_delivered: number;
  extra_garments_amount: number;
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

// ── Service summary (for process-pending summary cards) ───────────────────────
export interface ProcessServiceSummary {
  service_id: number;
  service_name: string;
  count: number;
  is_vendor_eligible: boolean;
  post_vendor_workflow: string | null;
}

// ── Vendor Outward / Inward order item ───────────────────────────────────────
export interface VendorInwardOutwardOrder {
  _id: string;
  process_status: number;
  order_id: string;
  sub_order_id: string;
  order_number: string;
  service_id: number;
  service: string;
  booking_date: string;
  booking_time: string;
  garment_qty: number;
  ord_status: string;
  vendor: { _id: string; name: string; mobile: string; city: string } | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  processing_completed_at: string | null;
  service_deadline: string | null;
  inward_otp: string | null;
  inward_otp_verified: boolean;
  inward_verified_at: string | null;
  garments_returned_qty: number;
  createdAt: string;
}

export interface VendorInwardOutwardData {
  orders: VendorInwardOutwardOrder[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Ironing order item ────────────────────────────────────────────────────────
export interface IroningOrder {
  _id: string;
  sub_order_no: string;
  order_no: string;
  service_id: number;
  service_name: string;
  booking_date: string;
  booking_time: string;
  garment_qty: number;
  ord_status: string;
  order_id: string;
}

// ── Service vendor config ─────────────────────────────────────────────────────
export interface ServiceVendorConfig {
  service_id: number;
  service: string;
  is_vendor_eligible: boolean;
  post_vendor_workflow: string | null;
  service_duration_hours: number;
}