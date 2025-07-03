import { BaseEntity } from './index';

export interface Transaction extends BaseEntity {
  customer_id: string;
  transaction_id: string;
  wallet_type: string;
  amount: number;
  transaction_type: string;
  gateway_response: string;
  reason: string;
  message: string;
  status: number;
}

export interface TransactionListData {
  totalTransaction: number;
  total_pages: number;
  page: number;
  transactionList: Transaction[];
}