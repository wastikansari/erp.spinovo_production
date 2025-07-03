// Common types and interfaces
export interface ApiResponse<T> {
  status: boolean;
  msg: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  total_pages: number;
  page: number;
  [key: string]: T[] | number;
}

// Base entity interface
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// Status types
export type OrderStatus = 'pending' | 'completed' | 'processing' | 'cancelled';
export type TransactionType = 'credit' | 'debit';
export type AddressType = 'home' | 'office' | 'other';
export type OTPRequestType = 'signup' | 'login' | 'forgot' | 'verify';