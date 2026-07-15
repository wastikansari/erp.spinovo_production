export interface B2BOrderLineItem {
  serviceId: string;
  categoryId: number;
  serviceName: string;
  categoryName: string;
  qty: number;
  amount: number;
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
}
