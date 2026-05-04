import { BaseEntity } from './index';
import { Booking } from './booking';
import { Copilot } from './copilot';
import { Address } from './customer';

export interface PickupAssignBooking extends BaseEntity {
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

export interface PickupAssignBookingListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  assignList: PickupAssignBooking[];
}

export interface PickupAssignBookingRequest {
  booking_id: string;
  copilot_id: string;
}

export interface PickupAssignBookingResponse {
  assign_id: string;
}