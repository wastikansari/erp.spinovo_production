// Staff roles and their default page permissions. Role list mirrors
// spinovo_api/constants/staffRoles.js — keep the two in sync manually.
//
// A role's defaults only pre-fill the permission grid on the Add/Edit Staff
// form; the super admin can still change any page before saving. Access is
// always decided by the saved permissions (plus the two backend role gates:
// super_admin → everything incl. Staff, admin → B2B pricing approval).
//
// Level note: on the backend, "edit" only covers changing existing records
// (PATCH/PUT) — creating anything (POST: assign an order, add an offer, send
// a campaign) needs "all". So roles whose job is to create things get "all".
import { ERP_PAGES, type PermissionLevel } from './erpPages';
import type { StaffPermission } from '../types/staff';

export type StaffRole =
  | 'super_admin'
  | 'admin'
  | 'supervisor'
  | 'sales_executive'
  | 'intern'
  | 'customer_support'
  | 'operations'
  | 'delivery_manager'
  | 'accountant'
  | 'marketing'
  | 'b2b_manager'
  | 'developer'
  | 'viewer';

export interface StaffRoleInfo {
  value: StaffRole;
  label: string;
  description: string;
  defaultPermissions: () => StaffPermission[];
}

// Every page the grid can assign — Staff is super_admin-only, never assignable.
const ASSIGNABLE_KEYS = ERP_PAGES.map((p) => p.key).filter((k) => k !== 'staff');

const pages = (level: PermissionLevel, keys: string[]): StaffPermission[] =>
  keys.map((key) => ({ key, level }));

const everyPage = (level: PermissionLevel) => pages(level, ASSIGNABLE_KEYS);

const DEVELOPER_SETTINGS = [
  'app-content',
  'app-theme',
  'app-nav-bar',
  'app-home-header',
  'app-showcase',
  'settings-slot-management',
  'settings-service-duration',
  'settings-attempt-reasons',
  'settings-whatsapp-notifications',
];

export const STAFF_ROLES: StaffRoleInfo[] = [
  {
    value: 'super_admin',
    label: 'Super Admin (full access)',
    description: 'Owner — every page, including Staff management.',
    defaultPermissions: () => [],
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Business manager — every page except Staff. Can approve B2B pricing.',
    defaultPermissions: () => everyPage('all'),
  },
  {
    value: 'supervisor',
    label: 'Supervisor',
    description: 'Floor / shift in-charge — choose their pages below.',
    defaultPermissions: () => [],
  },
  {
    value: 'sales_executive',
    label: 'Sales Executive',
    description: 'Salesman / telecaller — Sales Call, and can look up customers.',
    defaultPermissions: () => [...pages('edit', ['sales-call']), ...pages('view', ['customers'])],
  },
  {
    value: 'intern',
    label: 'Intern',
    description: 'Interns and trainees — Sales Call only.',
    defaultPermissions: () => pages('edit', ['sales-call']),
  },
  {
    value: 'customer_support',
    label: 'Customer Support',
    description: 'Handles customer complaints and calls — reads orders and customers, logs calls.',
    defaultPermissions: () => [
      ...pages('view', ['orders', 'bookings', 'bundle-bookings', 'order-timeline', 'customers', 'otp-requests', 'feedback']),
      ...pages('edit', ['sales-call']),
    ],
  },
  {
    value: 'operations',
    label: 'Operations Staff',
    description: 'QC, washing and processing team — works on orders and inventory.',
    defaultPermissions: () => [
      ...pages('all', ['orders', 'inventory']),
      ...pages('edit', ['bundle-bookings']),
      ...pages('view', ['order-timeline']),
    ],
  },
  {
    value: 'delivery_manager',
    label: 'Delivery Manager',
    description: 'Manages pickup and delivery riders.',
    defaultPermissions: () => [
      ...pages('all', ['orders', 'bookings', 'copilots', 'bundle-bookings']),
      ...pages('view', ['locations', 'order-timeline']),
    ],
  },
  {
    value: 'accountant',
    label: 'Accountant',
    description: 'Finance — payments, transactions, revenue and exports (read-only).',
    defaultPermissions: () =>
      pages('view', ['payments-v2', 'transactions', 'revenue', 'export', 'daily-report', 'settings-payment-recovery']),
  },
  {
    value: 'marketing',
    label: 'Marketing',
    description: 'Offers, WhatsApp / push campaigns and app banners.',
    defaultPermissions: () => [
      ...pages('all', ['whatsapp-marketing', 'notification-campaigns', 'offers', 'app-content', 'app-theme']),
      ...pages('view', ['customers', 'export']),
    ],
  },
  {
    value: 'b2b_manager',
    label: 'B2B Manager',
    description: 'Corporate clients — B2B companies, orders, services and pricing (approval stays with Admin).',
    defaultPermissions: () => pages('all', ['b2b-companies', 'b2b-orders', 'b2b-services', 'b2b-pricing']),
  },
  {
    value: 'developer',
    label: 'Developer',
    description: 'Tech person — full access to app settings, view-only everywhere else. No Staff page.',
    defaultPermissions: () => [
      ...pages('all', DEVELOPER_SETTINGS),
      ...pages('view', ASSIGNABLE_KEYS.filter((k) => !DEVELOPER_SETTINGS.includes(k))),
    ],
  },
  {
    value: 'viewer',
    label: 'Viewer (read-only)',
    description: 'Can look at every page but cannot change anything.',
    defaultPermissions: () => everyPage('view'),
  },
];

export const STAFF_ROLE_VALUES = STAFF_ROLES.map((r) => r.value) as [StaffRole, ...StaffRole[]];

export const getStaffRole = (role: string | undefined | null): StaffRoleInfo | undefined =>
  STAFF_ROLES.find((r) => r.value === role);

// Short name for badges/lists (drops the "(full access)" style suffix).
export const staffRoleLabel = (role: string | undefined | null): string =>
  getStaffRole(role)?.label.replace(/\s*\(.*\)$/, '') ?? (role || '—');
