import { BaseEntity } from './index';

export interface AttemptReason extends BaseEntity {
  reason: string;
  is_active: number; // 0 = inactive, 1 = active
  sort_order: number;
}

export interface AttemptReasonListData {
  reasons: AttemptReason[];
}

export interface AttemptReasonCreateRequest {
  reason: string;
  sort_order?: number;
}

export interface AttemptReasonUpdateRequest {
  reason?: string;
  sort_order?: number;
  is_active?: number;
}

export interface OrderAttemptLog {
  _id: string;
  attempt_reason_id: string;
  reason_text: string;
  message: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  attempt_no: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptedOrder {
  _id: string;
  type: 'pickup' | 'delivery';
  order_id: string;
  sub_order_id?: string;
  copilot_id: string;
  status: number;
  order_attempt: OrderAttemptLog[];
  order_display_no: string;
  copilot_name: string;
  copilot_mobile: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptedOrderListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  list: AttemptedOrder[];
}
