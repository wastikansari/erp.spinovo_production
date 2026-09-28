export type PaymentAlertStatus = 'unresolved' | 'resolved';

export type PaymentAlertResolution =
  | 'pending'
  | 'wallet_credited'
  | 'wallet_refunded'
  | 'already_safe'
  | 'no_customer_match'
  | 'credit_failed';

export interface PaymentAlert {
  _id: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  method: string;
  contact: string;
  email: string;
  captured_at: string;
  status: PaymentAlertStatus;
  resolution: PaymentAlertResolution;
  resolution_detail: string;
  resolved_amount: number;
  customer_id: string | null;
  customer_name: string;
  customer_mobile: string;
  auto_resolved_at: string | null;
  first_detected_at: string;
  last_alerted_at: string | null;
  alert_count: number;
  resolved_at: string | null;
}

export interface PaymentAlertListData {
  list: PaymentAlert[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  summaryByResolution: Partial<Record<PaymentAlertResolution, number>>;
}
