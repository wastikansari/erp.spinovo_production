import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_URL } from './config/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Host that serves static /uploads (API base minus the /api/v1 suffix).
// e.g. https://api.spinovo.in/api/v1 → https://api.spinovo.in
export function getUploadsHost(): string {
  return API_URL.BASE_URL.replace(/\/api\/v1\/?$/, '');
}

// Build a full URL for a vendor KYC photo stored under uploads/vendor-kyc.
// Returns null when no filename is set so callers can show a placeholder.
export function vendorKycImageUrl(filename?: string | null): string | null {
  if (!filename) return null;
  // If the backend ever stores a full URL, use it as-is.
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${getUploadsHost()}/uploads/vendor-kyc/${filename}`;
}
