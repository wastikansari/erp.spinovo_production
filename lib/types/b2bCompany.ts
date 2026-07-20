export interface B2BTransaction {
  id: string;
  date: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  reason: string;
  orderNo?: string;
}

export type B2BSettlementPaymentMethod = 'razorpay' | 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'other';

export interface B2BSettlement {
  id: string;
  amount: number;
  status: 'created' | 'paid' | 'failed';
  paymentMethod: B2BSettlementPaymentMethod;
  notes: string;
  orderCount: number;
  paidAt: string | null;
  createdAt: string;
}

export interface B2BCompany {
  _id: string;
  companyName: string;
  ownerName: string;
  mobile: number;
  ownerAddress: string;
  registeredCompanyName?: string;
  gstNumber?: string;
  companyAddress: string;
  city: string;
  pincode: string;
  creditLimit: number;
  walletBalance: number; // negative = amount due
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
