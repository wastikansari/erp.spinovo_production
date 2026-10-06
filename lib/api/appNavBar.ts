import { AuthService } from '../auth';
import { API_URL } from '../config/constants';

// ERP → Bottom Bar (customer app navigation bar). Backend: spinovo_api/features/appNavBar.

export type NavBarStyleKind = 'floating' | 'solid' | 'bubble' | 'lifted' | 'underline';
export type NavTab = 'home' | 'booking' | 'account';
export type NavIconVariant = 'normal' | 'selected';

export interface AppNavBar {
  _id: string;
  name: string;
  preset_key: string | null;
  style: NavBarStyleKind;
  background: string[];
  selected_color: string;
  unselected_color: string;
  indicator_color: string;
  labels: 'always' | 'selected' | 'never';
  decoration: 'none' | 'lights' | 'toran';
  decoration_colors: string[];
  icon_set: 'classic' | 'filled' | 'rounded';
  custom_icons: Record<NavTab, Record<NavIconVariant, string>>;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  updatedAt: string;
}

export type AppNavBarEditable = Omit<AppNavBar, '_id' | 'preset_key' | 'updatedAt' | 'custom_icons'>;

type Result<T> = { success: boolean; message: string; data?: T };

const BASE = `${API_URL.BASE_URL}/admin/app-nav-bar`;

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
      message: json.data?.error || json.msg || (res.ok ? 'Done' : `HTTP ${res.status}`),
      data: json.data,
    };
  } catch (error) {
    console.error('appNavBar API error:', error);
    return { success: false, message: 'Network error' };
  }
}

export const listNavBars = () => call<{ bars: AppNavBar[]; live_bar_id: string }>('');
export const updateNavBar = (id: string, body: Partial<AppNavBarEditable>) =>
  call<{ bar: AppNavBar }>(`/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const applyNavBar = (id: string) => call<{ bar: AppNavBar }>(`/${id}/apply`, { method: 'POST' });
export const duplicateNavBar = (id: string) => call<{ bar: AppNavBar }>(`/${id}/duplicate`, { method: 'POST' });
export const resetNavBar = (id: string) => call<{ bar: AppNavBar }>(`/${id}/reset`, { method: 'POST' });
export const deleteNavBar = (id: string) => call(`/${id}`, { method: 'DELETE' });
export function uploadNavIcon(id: string, tab: NavTab, variant: NavIconVariant, file: File) {
  const form = new FormData();
  form.append('image', file);
  return call<{ bar: AppNavBar }>(`/${id}/icon/${tab}/${variant}`, { method: 'POST', body: form });
}
export const removeNavIcon = (id: string, tab: NavTab, variant: NavIconVariant) =>
  call<{ bar: AppNavBar }>(`/${id}/icon/${tab}/${variant}`, { method: 'DELETE' });
