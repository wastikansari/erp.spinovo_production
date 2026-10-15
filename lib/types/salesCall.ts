// Types for the Sales Call page (app/dashboard/sales-call) — mirrors
// spinovo_api/features/salesCall/salesCallNoteModel.js.
import type { CustomerListAddress } from './customer';

export type SalesCallResponse =
  | 'interested'
  | 'not_interested'
  | 'no_answer'
  | 'call_back'
  | 'wrong_number'
  | 'complaint'
  | 'other';

export const SALES_CALL_RESPONSE_OPTIONS: { value: SalesCallResponse; label: string; className: string }[] = [
  { value: 'interested', label: 'Interested', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' },
  { value: 'call_back', label: 'Call back later', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  { value: 'no_answer', label: 'No answer', className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  { value: 'not_interested', label: 'Not interested', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
  { value: 'complaint', label: 'Complaint', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' },
  { value: 'wrong_number', label: 'Wrong number', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  { value: 'other', label: 'Other', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
];

export interface SalesCallNote {
  _id: string;
  customer_id: string;
  mobile: string;
  response: SalesCallResponse;
  note: string;
  follow_up_date: string; // "YYYY-MM-DD" or ""
  staff_id: string;
  staff_name: string;
  createdAt: string;
}

export interface SalesCallCustomer {
  _id: string;
  name: string;
  mobile: string;
  wallet_balance: number;
  living_type: string;
  createdAt: string;
  total_orders: number;
  total_spending: number;
  last_order_date: string | null;
  call_count: number;
  last_call: SalesCallNote | null;
  address?: CustomerListAddress | null;
}

export type SalesCallStatusFilter = '' | 'never' | 'called' | 'follow_up_due';

export type SalesCallSortField = 'createdAt' | 'total_orders' | 'total_spending' | 'last_order_date' | 'last_call_at';

export interface SalesCallFilters {
  search: string;
  callStatus: SalesCallStatusFilter;
  response: SalesCallResponse | '';
  minOrders: string;
  maxOrders: string;
}

export interface SalesCallCustomerListData {
  customers: SalesCallCustomer[];
  total: number;
  page: number;
  total_pages: number;
}

export interface SalesCallSummary {
  total_customers: number;
  called: number;
  never_called: number;
  follow_up_due: number;
  calls_today: number;
}

export interface SalesCallNoteRequest {
  response: SalesCallResponse;
  note: string;
  follow_up_date: string;
}
