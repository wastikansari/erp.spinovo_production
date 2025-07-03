export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Spinovo Admin Panel',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.spinovo.in/api/v1',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/admin/auth/login',
  PROFILE: '/admin/profile',
  
  // Dashboard
  DASHBOARD: '/admin/dashboard',
  
  // Customers
  CUSTOMERS: '/admin/customer/list',
  CUSTOMER_DETAILS: '/admin/customer/details',
  CUSTOMER_TRANSACTIONS: '/admin/customer/transactions',
  CUSTOMER_OTP_REQUESTS: '/admin/customer/otpreques',
  
  // Bookings
  BOOKINGS: '/admin/booking/list',
  BOOKING_DETAILS: '/admin/booking/details',
  BOOKING_ASSIGN: '/admin/booking/assign',
  
  // Copilots
  COPILOTS: '/admin/copilot/list',
  COPILOT_DETAILS: '/admin/copilot/profile',
  COPILOT_CREATE: '/admin/copilot/create',
  
  // Assignments
  ASSIGNMENTS: '/admin/assign/list',
} as const;

export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

export const UI_CONFIG = {
  toastDuration: 5000,
  loadingDebounce: 300,
  searchDebounce: 500,
} as const;

export const VALIDATION_RULES = {
  mobile: {
    minLength: 10,
    maxLength: 15,
    pattern: /^[0-9]+$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s]+$/,
  },
} as const;