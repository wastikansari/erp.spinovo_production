import { BaseEntity } from './index';
import { Booking, SubOrder } from './booking';
import { Copilot } from './copilot';
import { Address } from './customer';

export interface DeliveryPendingSubOrder {
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
  order_details: Booking;
  address_details: Address;
}

export interface DeliveryPendingSubOrderListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  subOrders: DeliveryPendingSubOrder[];
}

export interface DeliveryAssignBooking extends BaseEntity {
  order_id: string;
  sub_order_id: string;
  copilot_id: string;
  status: number;
  isStarted: number;
  orderObjectId: string;
  subOrderObjectId: string;
  copilotObjectId: string;
  order_details: Booking;
  sub_order_details: SubOrder;
  address_details: Address;
  copilot_details: Copilot;
}

export interface DeliveryAssignBookingListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  assignList: DeliveryAssignBooking[];
}

export interface DeliveryAssignBookingRequest {
  order_id: string;
  sub_order_id: string;
  copilot_id: string;
}

export interface DeliveryAssignBookingResponse {
  assign_id: string;
}