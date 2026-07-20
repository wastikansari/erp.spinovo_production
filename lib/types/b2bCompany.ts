export interface B2BTransaction {
  id: string;
  date: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  reason: string;
  orderNo?: string;
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
