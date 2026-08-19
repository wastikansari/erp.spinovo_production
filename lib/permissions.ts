import { PERMISSION_LEVEL_RANK, type PermissionLevel } from './constants/erpPages';

export interface PermissionEntry {
  key: string;
  level: PermissionLevel;
}

export interface PermissionedUser {
  role?: 'super_admin' | 'admin' | 'supervisor' | string;
  status?: 'active' | 'inactive' | string;
  permissions?: PermissionEntry[];
}

// Longest-prefix-first match from a dashboard pathname to its pageKey.
// Covers dynamic sub-routes (e.g. /dashboard/customers/[id],
// /dashboard/orders/pickup-pending) automatically since we match on the
// leading path segment(s), not an exact href list.
// Order matters — more specific prefixes must come before their parents
// (e.g. settings/service-duration before a hypothetical bare /settings).
const ROUTE_PAGE_MAP: [string, string][] = [
  ['/dashboard/settings/service-duration', 'settings-service-duration'],
  ['/dashboard/settings/attempt-reasons', 'settings-attempt-reasons'],
  ['/dashboard/b2b-pricing', 'b2b-pricing'],
  ['/dashboard/b2b-orders', 'b2b-orders'],
  ['/dashboard/b2b-services', 'b2b-services'],
  ['/dashboard/b2b-companies', 'b2b-companies'],
  ['/dashboard/orders', 'orders'],
  ['/dashboard/customers', 'customers'],
  ['/dashboard/inventory', 'inventory'],
  ['/dashboard/feedback', 'feedback'],
  ['/dashboard/order-timeline', 'order-timeline'],
  ['/dashboard/copilots', 'copilots'],
  ['/dashboard/vendor', 'vendor'],
  ['/dashboard/transactions', 'transactions'],
  ['/dashboard/payments-v2', 'payments-v2'],
  ['/dashboard/otp-requests', 'otp-requests'],
  ['/dashboard/locations', 'locations'],
  ['/dashboard/package', 'package'],
  ['/dashboard/services', 'services'],
  ['/dashboard/offers', 'offers'],
  ['/dashboard/notification-campaigns', 'notification-campaigns'],
  ['/dashboard/export', 'export'],
  ['/dashboard/revenue', 'revenue'],
  ['/dashboard/notifications', 'notifications'],
  ['/dashboard/staff', 'staff'],
  ['/dashboard', 'dashboard'], // exact home page — must stay last (shortest prefix)
];

export function pageKeyForPath(pathname: string): string | null {
  for (const [prefix, key] of ROUTE_PAGE_MAP) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return key;
  }
  return null;
}

// `/dashboard/settings` (the plain links-hub page) intentionally has no
// entry above — it's just a menu of links, each of which is gated on
// arrival, so it doesn't need its own permission.

export function getLevel(
  user: PermissionedUser | null | undefined,
  pageKey: string,
): PermissionLevel | null {
  if (!user) return null;
  if (user.role === 'super_admin') return 'all';
  if (pageKey === 'staff') return null; // hardcoded super_admin-only, see backend
  const entry = user.permissions?.find((p) => p.key === pageKey);
  return entry?.level ?? null;
}

export function hasAccess(
  user: PermissionedUser | null | undefined,
  pageKey: string,
  required: PermissionLevel = 'view',
): boolean {
  const level = getLevel(user, pageKey);
  if (!level) return false;
  return PERMISSION_LEVEL_RANK[level] >= PERMISSION_LEVEL_RANK[required];
}

export function canAccessPath(user: PermissionedUser | null | undefined, pathname: string): boolean {
  const pageKey = pageKeyForPath(pathname);
  if (!pageKey) return true; // ungated page (e.g. the Settings links hub)
  return hasAccess(user, pageKey, 'view');
}

// B2B pricing approve/reject/reset is role-gated only (mirrors
// middleware/requireRole.js on the backend) — a supervisor never sees
// these actions regardless of their own b2b-pricing permission level.
export function canApproveB2BPricing(user: PermissionedUser | null | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}
