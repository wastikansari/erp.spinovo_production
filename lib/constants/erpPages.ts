// Frontend mirror of spinovo_api/constants/erpPages.js — keep the two in
// sync manually (no shared package between the repos). Used for the Staff
// permission-grid UI, sidebar filtering, and route guarding.

export type PermissionLevel = 'view' | 'edit' | 'all';

export const PERMISSION_LEVELS: PermissionLevel[] = ['view', 'edit', 'all'];

export const PERMISSION_LEVEL_RANK: Record<PermissionLevel, number> = {
  view: 1,
  edit: 2,
  all: 3,
};

export interface ErpPage {
  key: string;
  label: string;
  group: string;
}

// `staff` is intentionally listed (for labeling only) — access to it is
// hardcoded to role === 'super_admin' regardless of any permission entry.
export const ERP_PAGES: ErpPage[] = [
  { key: 'dashboard', label: 'Dashboard (home overview)', group: 'Retail' },
  { key: 'orders', label: 'Orders', group: 'Retail' },
  { key: 'order-timeline', label: 'Order Timeline', group: 'Retail' },
  { key: 'otp-requests', label: 'OTP Requests', group: 'Retail' },
  { key: 'bookings', label: 'Bookings', group: 'Retail' },
  { key: 'customers', label: 'Customers', group: 'Retail' },
  { key: 'feedback', label: 'Feedback', group: 'Retail' },
  { key: 'services', label: 'Services', group: 'Retail' },
  { key: 'package', label: 'Package', group: 'Retail' },
  { key: 'offers', label: 'Offers', group: 'Retail' },
  { key: 'inventory', label: 'Inventory', group: 'Retail' },
  { key: 'vendor', label: 'Vendor', group: 'Retail' },
  { key: 'copilots', label: 'Copilots', group: 'Retail' },
  { key: 'locations', label: 'Locations', group: 'Retail' },

  { key: 'b2b-companies', label: 'B2B Companies', group: 'B2B' },
  { key: 'b2b-orders', label: 'B2B Orders', group: 'B2B' },
  { key: 'b2b-services', label: 'B2B Services (master catalog)', group: 'B2B' },
  { key: 'b2b-pricing', label: 'B2B Company Pricing', group: 'B2B' },

  { key: 'payments-v2', label: 'Payments', group: 'Finance' },
  { key: 'transactions', label: 'Transactions', group: 'Finance' },
  { key: 'revenue', label: 'Revenue', group: 'Finance' },
  { key: 'export', label: 'Export', group: 'Finance' },

  { key: 'notifications', label: 'Notifications', group: 'Comms' },
  { key: 'notification-campaigns', label: 'Notification Campaigns', group: 'Comms' },

  { key: 'settings-attempt-reasons', label: 'Settings — Attempt Reasons', group: 'Settings' },
  { key: 'settings-service-duration', label: 'Settings — Service Duration', group: 'Settings' },

  { key: 'staff', label: 'Staff Management', group: 'Admin' },
];

export const ERP_PAGE_KEYS = ERP_PAGES.map((p) => p.key);
