// Types for the B2B order pipeline — quality check + vendor process leg.
// Mirrors lib/types/process-assign.ts (retail) in shape/naming.

import { B2BOrderSummary, B2BCompanySummary } from './b2b-pickup-assign';

// ── Quality Check (simple boolean gate — v1 scope, no per-garment detail) ──

export interface B2BQualityCheckPendingListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  orders: B2BOrderSummary[];
}

export interface B2BQcCompletedResponse {
  order: B2BOrderSummary;
}

// ── Vendor process assignment ───────────────────────────────────────────────

export interface B2BProcessPendingListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  orders: B2BOrderSummary[];
}

export interface B2BVendorSummary {
  _id: string;
  name: string;
  mobile: number;
  cityName?: string;
  isOnline?: boolean;
  accountIsActive?: boolean;
}

export interface B2BProcessAssignRecord {
  _id: string;
  b2b_order_id: string;
  vendor_id: string;
  status: number; // 0 rejected / 1 assigned / 2 accepted / 3 picked_up / 4 processing / 5 completed(otp pending) / 6 inward_done
  reject_reason?: string;
  accepted_at?: string | null;
  picked_up_at?: string | null;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
  service_deadline?: string | null;
  inward_otp?: string | null;
  inward_otp_verified?: boolean;
  inward_verified_at?: string | null;
  garments_returned_qty?: number;
  order_details: B2BOrderSummary;
  company_details: B2BCompanySummary;
  vendor_details: B2BVendorSummary;
  createdAt: string;
  updatedAt: string;
}

export interface B2BProcessAssignedListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  assignList: B2BProcessAssignRecord[];
}

export interface B2BProcessAssignRequest {
  b2b_order_id: string;
  vendor_id: string;
}

export interface B2BProcessAssignResponse {
  assign_id: string;
}

export interface B2BProcessCompletedResponse {
  assignRecord: B2BProcessAssignRecord;
}

export interface B2BProcessInwardPendingListData {
  orders: B2BProcessAssignRecord[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface B2BVerifyInwardOtpResponse {
  next_status: string;
}
