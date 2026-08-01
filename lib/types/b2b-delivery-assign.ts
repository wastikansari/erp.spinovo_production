// Types for the B2B order pipeline — delivery leg.
// Mirrors lib/types/delivery-assign.ts (retail) in shape/naming.

import { B2BOrderSummary, B2BCompanySummary } from './b2b-pickup-assign';

export interface B2BDeliveryPendingListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  orders: B2BOrderSummary[];
}

export interface B2BDeliveryCopilotDetails {
  _id: string;
  name: string;
  mobile: string;
  email: string;
  status: number;
}

export interface B2BDeliveryAssignBooking {
  _id: string;
  b2b_order_id: string;
  copilot_id: string;
  status: number; // 0 cancel / 1 assign / 2 start / 3 complete / 4 attempted
  isStarted: number;
  order_details: B2BOrderSummary;
  company_details: B2BCompanySummary;
  copilot_details: B2BDeliveryCopilotDetails;
  createdAt: string;
  updatedAt: string;
}

export interface B2BDeliveryAssignedListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  assignList: B2BDeliveryAssignBooking[];
}

export interface B2BDeliveryAssignRequest {
  b2b_order_id: string;
  copilot_id: string;
}

export interface B2BDeliveryAssignResponse {
  assign_id: string;
}

export interface B2BDeliveryReassignRequest {
  b2b_order_id: string;
  new_copilot_id: string;
}

export interface B2BDeliveryReassignResponse {
  assign_id: string;
  copilot_name: string;
}

export interface B2BDeliveredListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  assignList: B2BDeliveryAssignBooking[];
}
