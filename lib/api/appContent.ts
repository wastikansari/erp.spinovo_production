import { AuthService } from '../auth';
import { API_URL } from '../config/constants';

// ERP → App Banners & Popup. Backend: spinovo_api/features/appContent.

export type AppActionType = 'none' | 'service' | 'link';

export interface AppBanner {
  _id: string;
  title: string;
  image_url: string;
  action_type: AppActionType;
  service_id: number | null;
  link_url: string;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  sort_order: number;
  updatedAt: string;
}

export interface AppPopup extends Omit<AppBanner, 'sort_order'> {
  button_text: string;
}

// Form values sent as multipart (image optional on edit).
export interface AppContentFields {
  title: string;
  action_type: AppActionType;
  service_id: string;
  link_url: string;
  is_active: boolean;
  start_at: string; // datetime-local value or ''
  end_at: string;
  button_text?: string;
}

type Result<T> = { success: boolean; message: string; data?: T };

const BASE = `${API_URL.BASE_URL}/admin/app-content`;

async function call<T>(path: string, init: RequestInit = {}): Promise<Result<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${AuthService.getToken()}`,
      },
    });
    const json = await res.json();
    return {
      success: json.status === true,
      // Joi validation details come back in data.error.
      message: json.data?.error || json.msg || (res.ok ? 'Done' : `HTTP ${res.status}`),
      data: json.data,
    };
  } catch (error) {
    console.error('appContent API error:', error);
    return { success: false, message: 'Network error' };
  }
}

function toForm(fields: Partial<AppContentFields>, image?: File | null): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (key === 'start_at' || key === 'end_at') {
      // datetime-local has no timezone — send it as the admin's local time.
      form.append(key, value ? new Date(String(value)).toISOString() : '');
    } else {
      form.append(key, String(value));
    }
  }
  if (image) form.append('image', image);
  return form;
}

// ── Banners ──
export const listBanners = () => call<{ banners: AppBanner[] }>('/banners');
export const createBanner = (fields: AppContentFields, image: File) =>
  call<{ banner: AppBanner }>('/banners', { method: 'POST', body: toForm(fields, image) });
export const updateBanner = (id: string, fields: Partial<AppContentFields>, image?: File | null) =>
  call<{ banner: AppBanner }>(`/banners/${id}`, { method: 'PATCH', body: toForm(fields, image) });
export const deleteBanner = (id: string) => call(`/banners/${id}`, { method: 'DELETE' });
export const reorderBanners = (order: string[]) =>
  call('/banners/reorder', { method: 'PATCH', body: JSON.stringify({ order }) });

// ── Popups ──
export const listPopups = () => call<{ popups: AppPopup[] }>('/popups');
export const createPopup = (fields: AppContentFields, image: File) =>
  call<{ popup: AppPopup }>('/popups', { method: 'POST', body: toForm(fields, image) });
export const updatePopup = (id: string, fields: Partial<AppContentFields>, image?: File | null) =>
  call<{ popup: AppPopup }>(`/popups/${id}`, { method: 'PATCH', body: toForm(fields, image) });
export const deletePopup = (id: string) => call(`/popups/${id}`, { method: 'DELETE' });

// "Live" = active and inside its schedule right now (what the app shows).
export function scheduleStatus(item: { is_active: boolean; start_at: string | null; end_at: string | null }):
  | 'live'
  | 'scheduled'
  | 'ended'
  | 'off' {
  if (!item.is_active) return 'off';
  const now = Date.now();
  if (item.start_at && new Date(item.start_at).getTime() > now) return 'scheduled';
  if (item.end_at && new Date(item.end_at).getTime() < now) return 'ended';
  return 'live';
}
