import { BaseEntity } from './index';
import { Booking, SubOrder } from './booking';

export interface PickupCopilotDetails {
  _id: string;
  name: string;
  mobile: string;
  email: string;
  profile_pic: string;
  city_id: number;
  role: number;
  status: number;
  is_deleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface PickupAssignBooking extends BaseEntity {
  order_id: string;
  copilot_id: string;
  status: number;
  isStarted: number;
  orderObjectId: string;
  copilotObjectId: string;
  order_details: Booking;
  sub_orders: SubOrder[];
  copilot_details: PickupCopilotDetails;
}

export interface PickupAssignBookingListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  assignList: PickupAssignBooking[];
}

export interface PickupAssignBookingRequest {
  order_id: string;
  copilot_id: string;
}

export interface PickupAssignBookingResponse {
  assign_id: string;
}

export interface PickupReassignRequest {
  order_id: string;
  new_copilot_id: string;
}

export interface PickupReassignResponse {
  assign_id: string;
  copilot_name: string;
}
