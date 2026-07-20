export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Spinovo Admin Panel',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ||
    // "http://[IP_ADDRESS]/api/v1",
    'https://api.spinovo.in/api/v1',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export const API_URL = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.spinovo.in/api/v1",

  // Order related endpoints
  PICKUP_PENDING: '/admin/order/pickup/pending',
  PICKUP_ASSIGN: '/admin/order/pickup/assign',
  PICKUP_LIST: '/admin/order/pickup/assigned/list',
  QUALITY_CHECK_LIST: '/admin/order/quality-check/suborder/pending',
  QUALITY_CHECK_MAIN_PENDING: '/admin/order/quality-check/mainorder/pending',
  PROCESS_ASSIGN: '/admin/order/process/assign',
  PROCESS_LIST: '/admin/order/process/assigned/list',
  PROCESS_COMPLETED: '/admin/order/process/completed',
  PROCESS_SUBORDER_PENDING: '/admin/order/process/suborder/pending',
  DELIVERY_ASSIGN: '/admin/order/delivery/assign',
  DELIVERY_LIST: '/admin/order/delivery/assigned/list',
  DELIVERED_LIST: '/admin/order/delivery/delivered/list',
  DELIVERY_SUBORDER_PENDING: '/admin/order/delivery/suborder/pending',
  QUALITY_CHECK_COMPLETED: '/admin/order/quality-check/suborder/completed',
  ORDER_QC_COMPLETED: '/admin/order/qc/completed',
  ADD_SERVICE: '/admin/order/update/addService',
  GARMENT_UPDATE: '/admin/suborder/garment/update',
  CANCEL_SUBORDER_PENDING: '/admin/order/cancel/suborder/delivery/pending',

  // Service management endpoints
  SERVICE_CATEGORY_LIST: '/admin/service/category',
  SERVICE_CATEGORY_BASE: '/admin/service/category',

  // B2B service management endpoints (separate catalog, admin-controlled pricing)
  B2B_SERVICE_BASE: '/admin/b2b/service',
  B2B_COMPANY_BASE: '/admin/b2b/companies',
  B2B_ORDER_BASE: '/admin/b2b/orders',

  // Vendor order management
  VENDOR_ORDERS: '/admin/vendor/orders',
  VENDOR_ORDERS_STATS: '/admin/vendor/orders/stats',
  VENDOR_ORDERS_REJECTED: '/admin/vendor/orders/rejected',
  VENDOR_LIST_ACTIVE: '/admin/vendor/list/active',

  // Vendor Outward / Inward (service_id-driven routing, no hardcoded names)
  VENDOR_OUTWARD: '/admin/vendor/orders/outward',
  VENDOR_INWARD_PENDING: '/admin/vendor/orders/inward-pending',

  // Process Pending service summary
  PROCESS_PENDING_SUMMARY: '/admin/orders/process-pending/summary',
  WASH_DC_PENDING: '/admin/order/washDc/suborder/pending',
  // Ironing workflow
  IRONING_PENDING: '/admin/order/ironing/suborder/pending',

  // Service vendor config
  SERVICE_VENDOR_CONFIG: '/admin/service/vendor-config',

  // Add this entry inside API_URL in your existing constants.ts:

  ORDER_TIMELINE: '/admin/orders/pickup/process/time/details',

} as const;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/admin/auth/login',
  PROFILE: '/admin/profile',

  // Dashboard
  DASHBOARD: '/admin/dashboard',

  // Customers
  CUSTOMERS: '/admin/customer/list',
  CUSTOMER_EXPORT: '/admin/customer/export',
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
    // Require at least one lowercase, one uppercase, one digit, and one special
    // character. Any non-alphanumeric counts as special (e.g. # @ $ ! etc.) and
    // all printable characters are allowed in the password.
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
  },
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s]+$/,
  },
} as const;