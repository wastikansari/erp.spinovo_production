// Types for bundle services (fixed-price home visits, e.g. Home Curtain
// Bundle) — mirrors spinovo_api/features/bundleService.

export type BundleStatus =
  | 'payment_pending'
  | 'booked'
  | 'visit_scheduled'
  | 'visit_done'
  | 'completed'
  | 'cancelled';

export type BundleOutcome = '' | 'converted' | 'consultation';

export const BUNDLE_STATUS_META: Record<BundleStatus, { label: string; className: string }> = {
  payment_pending: { label: 'Payment pending', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  booked: { label: 'Booked', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
  visit_scheduled: { label: 'Visit Scheduled', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  visit_done: { label: 'Visit Done', className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
};

export interface BundleHistoryEntry {
  status: BundleStatus;
  note: string;
  by_type: 'customer' | 'admin' | 'system';
  by_name: string;
  by_role: string;
  at: string;
}

export interface BundleBooking {
  _id: string;
  booking_no: number;
  booking_display_no: string;
  service_id: number;
  service_name: string;
  customer_id: string;
  customer_name?: string;
  customer_mobile?: string;
  address_id: string;
  address_text: string;
  pincode: string;
  booking_date: string;
  booking_time: string;
  amount: number;
  payment_mode: 'Wallet' | 'Online';
  // Split of amount (online bookings can use part of the wallet).
  wallet_amount?: number;
  online_amount?: number;
  razorpay_payment_id: string;
  paid_at: string | null;
  status: BundleStatus;
  outcome: BundleOutcome;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: '' | 'customer' | 'admin';
  refund_amount: number;
  converted_order_id: string | null;
  converted_order_no: string;
  terms_version: number;
  terms_rules?: string[];
  terms_agreed_at: string | null;
  status_history?: BundleHistoryEntry[];
  createdAt: string;
}

export interface BundleListData {
  bookings: BundleBooking[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export type BundleCounts = Partial<Record<BundleStatus | 'all', number>>;

export interface BundleConvertCategory {
  category_id: number;
  category: string;
  price: number;
}

export interface BundleBookingDetailsData {
  booking: BundleBooking;
  customer: { _id: string; name: string; mobile: string; wallet_balance: number } | null;
  order: {
    _id: string;
    order_display_no: string;
    ord_status: string;
    total_billing: number;
    paid_amount: number;
    handling_charges: number;
    order_amount: number;
  } | null;
  convert: {
    service: { service_id: number; service: string; categories: BundleConvertCategory[] } | null;
    handling_charge: number;
  };
}

export interface BundleConvertItem {
  custom: boolean;
  category_id?: number;
  category?: string;
  price?: number;
  qty: number;
}

export interface BundleConvertRequest {
  booking_date: string; // DD/MM/YYYY
  booking_time: string;
  items: BundleConvertItem[];
}

export interface BundlePoint {
  icon: string;
  text: string;
}

export interface BundleConfig {
  price: number;
  subtitle: string;
  banner_url: string;
  points: BundlePoint[];
  rules: string[];
  terms_version: number;
  agree_text: string;
  button_text: string;
  max_per_slot: number;
  convert_service_id: number | null;
}

export interface BundleConfigHistory {
  _id: string;
  changes: string[];
  admin_name: string;
  admin_email: string;
  admin_role: string;
  createdAt: string;
}

export interface BundleConfigData {
  service: {
    service_id: number;
    service: string;
    is_active: boolean;
    show_on_home: boolean;
    image_url: string;
    home_title: string;
    badge_text: string;
  };
  config: BundleConfig;
  icons: string[];
  convert_services: { service_id: number; service: string; is_active: boolean }[];
  history: BundleConfigHistory[];
}

export type BundleConfigUpdate = Partial<
  Pick<BundleConfig, 'price' | 'subtitle' | 'points' | 'rules' | 'agree_text' | 'button_text' | 'max_per_slot' | 'convert_service_id'>
>;
