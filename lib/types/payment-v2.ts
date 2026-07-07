export type PendingPaymentV2Status =
  | 'created'
  | 'paid'
  | 'processing'
  | 'order_created'
  | 'failed';

export interface PendingPaymentV2 {
  _id: string;
  customer_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  currency: string;
  status: PendingPaymentV2Status;
  order_id: string | null;
  order_display_no: string | null;
  failure_reason: string;
  customer: { _id: string; name: string; mobile: string } | null;
  is_stuck: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PendingPaymentV2ListData {
  total: number;
  total_pages: number;
  page: number;
  paymentList: PendingPaymentV2[];
}
