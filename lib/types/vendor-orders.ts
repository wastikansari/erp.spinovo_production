export type VendorOrderStatus =
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'processing'
  | 'completed'
  | 'rejected';

export interface VendorOrderVendor {
  _id: string;
  name: string;
  mobile: string;
  city: string;
}

export interface VendorOrder {
  _id: string;
  status: VendorOrderStatus;
  order_number: string;
  service: string;
  garment_qty: number;
  booking_date: string;
  booking_time: string;
  service_duration_hours: number;
  vendor: VendorOrderVendor | null;
  assigned_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  service_deadline: string | null;
  reject_reason: string | null;
  sub_order_id: string;
  order_id: string;
}

export interface VendorOrderStats {
  assigned: number;
  accepted: number;
  picked_up: number;
  processing: number;
  completed: number;
  rejected: number;
  overdue: number;
  active: number;
  total: number;
}

export interface VendorOrderListData {
  orders: VendorOrder[];
  total: number;
  page: number;
  totalPages: number;
}

export interface VendorOrderStatsData {
  stats: VendorOrderStats;
}

export interface ActiveVendor {
  _id: string;
  name: string;
  mobile: string;
  cityName: string;
}

export interface ActiveVendorListData {
  vendors: ActiveVendor[];
}

export interface ReassignResponse {
  new_process_id: string;
  vendor_name: string;
}

export interface OverdueOrder extends VendorOrder {
  overdue_by: string;
  overdue_ms: number;
}

export interface OverdueOrderListData {
  orders: OverdueOrder[];
  total: number;
  page: number;
  totalPages: number;
}

export interface VendorPerformance {
  vendor_id: string;
  vendor_name: string;
  vendor_mobile: string;
  vendor_city: string;
  vendor_active: boolean;
  total_assigned: number;
  accepted: number;
  rejected: number;
  completed: number;
  in_progress: number;
  overdue_count: number;
  acceptance_rate: number;
  completion_rate: number;
  avg_completion_hours: string | null;
  last_activity: string;
}

export interface VendorPerformanceListData {
  vendors: VendorPerformance[];
  total: number;
  page: number;
  totalPages: number;
}

export interface VendorOrderSummaryData {
  stats: {
    total: number;
    assigned: number;
    accepted: number;
    in_progress: number;
    completed: number;
    rejected: number;
  };
  recent_orders: VendorOrder[];
}
