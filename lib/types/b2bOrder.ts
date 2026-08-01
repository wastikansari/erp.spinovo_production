export interface B2BOrderGarmentLine {
  garmentId: string;
  garmentName: string;
  qty: number;
  amount: number;
}

export interface B2BOrderLineItem {
  serviceId: string;
  serviceName: string;
  garment: B2BOrderGarmentLine[];
}

export type B2BOrderStatus =
  | 'Pending'
  | 'Pickup Assigned'
  | 'Processing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface B2BOrder {
  id: string;
  orderNo: string;
  company: { id: string; companyName: string; mobile: number; city: string };
  items: B2BOrderLineItem[];
  bookingDate: string;
  bookingTime: string;
  serviceCharges: number;
  slotCharges: number;
  deliveryCharge: number;
  offerCode: string;
  offerAmount: number;
  totalBilling: number;
  paymentMode: 'Online' | 'Wallet' | 'Monthly';
  paymentStatus: 'Paid' | 'Unpaid';
  orderStatus: B2BOrderStatus;
  settlementStatus: 'Unbilled' | 'Billed';
  createdAt: string;
  // Pipeline fields (Phase 3) — optional until adminB2BOrderController's
  // sanitize() is updated to expose them; UI degrades gracefully without.
  orderStageId?: number;
  qualityCheck?: boolean;
  qcNote?: string;
  qcPhotoUrl?: string;
}

// order_stage_id values, mirrored from the backend B2B_ORDER_STAGE enum.
export const B2B_ORDER_STAGE_LABELS: Record<number, string> = {
  0: 'Cancelled',
  1: 'Pending',
  2: 'Pickup Assigned',
  3: 'Pickup In Progress',
  4: 'Pickup Completed',
  5: 'Processing Assigned',
  6: 'Processing In Progress',
  7: 'Processing Completed',
  8: 'Delivery Assigned',
  9: 'Out for Delivery',
  10: 'Delivered',
};
