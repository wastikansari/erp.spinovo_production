import { BaseEntity } from './index';

export interface Customer extends BaseEntity {
  name: string;
  mobile: string;
  email: string;
  wallet_balance: number;
  spinovo_bonus: number;
  familly_member: number;
  living_type: string;
  gender: string;
  dob: string;
  profile_pic: string;
  access_token: string;
  fcmToken: string;
  city_id: number;
  isActive: boolean;
  soures: number;
  lastActive: string;
}

export interface CustomerListData {
  totalCustomers: number;
  total_pages: number;
  page: number;
  customerList: Customer[];
}

export interface CustomerDetailsData {
  user: Customer;
  orders: Booking[];
  transactions: Transaction[];
  addresses: Address[];
  otps: OTP[];
}

export interface Address extends BaseEntity {
  customer_id: string;
  address_type: string;
  address_label: string;
  flat_no: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  format_address: string;
  isPrimary: boolean;
}

export interface OTP extends BaseEntity {
  mobile_no: string;
  otp_code: string;
  otp_request: string;
  otp_send_response: string;
}

// Import from other type files to avoid circular dependencies
import { Booking } from './booking';
import { Transaction } from './transaction';