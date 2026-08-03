// Types for the B2B order pipeline — pickup leg.
// Mirrors lib/types/pickup-assign.ts (retail) in shape/naming, adapted to the
// B2B schema: order-level pickup (no sub-orders), company instead of
// address+consumer.

export interface B2BGarmentLine {
  garmentId: string;
  garmentName: string;
  qty: number;
  amount: number;
}

export interface B2BOrderItem {
  serviceId: string;
  serviceName: string;
  garment: B2BGarmentLine[];
}

// Company as populated/looked-up onto pipeline responses. A superset isn't
// guaranteed on every route (some populate a subset of fields) so most
// fields are optional except the identifying ones.
export interface B2BCompanySummary {
  _id: string;
  companyName: string;
  ownerName?: string;
  mobile: number;
  companyAddress: string;
  city: string;
  pincode?: string;
  creditLimit?: number;
  walletBalance?: number;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  siteContactName?: string;
  siteContactMobile?: string;
}

// Raw b2b_orders document shape as returned across the pipeline routes.
export interface B2BOrderSummary {
  _id: string;
  company_id: B2BCompanySummary | string;
  orderNo: string;
  items: B2BOrderItem[];
  original_items?: B2BOrderItem[];
  bookingDate: string;
  bookingTime: string;
  // Present on the raw document but not every route selects them explicitly
  // — optional so existing callers that don't need them are unaffected.
  serviceCharges?: number;
  slotCharges?: number;
  deliveryCharge?: number;
  offerAmount?: number;
  totalBilling: number;
  orderStatus: string;
  settlementStatus: string;
  order_stage_id: number;
  quality_check: boolean;
  qc_note?: string;
  qc_photo_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface B2BPickupPendingListData {
  totalOrders: number;
  total_pages: number;
  currentPage: number;
  bookingList: B2BOrderSummary[];
}

export interface B2BPickupCopilotDetails {
  _id: string;
  name: string;
  mobile: string;
  email: string;
  profile_pic: string;
  status: number;
}

export interface B2BOrderAttempt {
  reason?: string;
  note?: string;
  photo_url?: string;
  attempted_at?: string;
}

export interface B2BPickupAssignBooking {
  _id: string;
  b2b_order_id: string;
  copilot_id: string;
  status: number; // 0 cancel / 1 assign / 2 start / 3 complete / 4 attempted
  isStarted: number;
  order_attempt?: B2BOrderAttempt[];
  order_details: B2BOrderSummary;
  company_details: B2BCompanySummary;
  copilot_details: B2BPickupCopilotDetails;
  createdAt: string;
  updatedAt: string;
}

export interface B2BPickupAssignedListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  assignList: B2BPickupAssignBooking[];
}

export interface B2BPickupAssignRequest {
  b2b_order_id: string;
  copilot_id: string;
}

export interface B2BPickupAssignResponse {
  assign_id: string;
}

export interface B2BPickupReassignRequest {
  b2b_order_id: string;
  new_copilot_id: string;
}

export interface B2BPickupReassignResponse {
  assign_id: string;
  copilot_name: string;
}
