import { BaseEntity } from './index';
import { Booking } from './booking';
import { Copilot } from './copilot';
import { Address } from './customer';

export interface DeliveryAssignBooking extends BaseEntity {
  booking_id: string;
  copilot_id: string;
  status: number;
  bookingObjectId: string;
  copilotObjectId: string;
  customerObjectId: string;
  order_details: Booking;
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
  booking_id: string;
  copilot_id: string;
}

export interface DeliveryAssignBookingResponse {
  assign_id: string;
}