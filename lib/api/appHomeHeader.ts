import { AuthService } from '../auth';
import { API_URL } from '../config/constants';

// ERP → Home Header (greeting + customer name on the app's Home screen).
// Backend: spinovo_api/features/appHomeHeader.

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export interface HomeHeaderSettings {
  mode: 'greeting' | 'address_type' | 'none';
  greeting_style: 'fixed' | 'time';
  fixed_template: string;
  time_templates: Record<DayPart, string>;
  name_format: 'first' | 'full';
  fallback_name: string;
  updatedAt?: string;
}

type Result<T> = { success: boolean; message: string; data?: T };

const BASE = `${API_URL.BASE_URL}/admin/app-home-header`;

async function call<T>(init: RequestInit = {}): Promise<Result<T>> {
  try {
    const res = await fetch(BASE, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AuthService.getToken()}` },
    });
    const json = await res.json();
    return {
      success: json.status === true,
      message: json.data?.error || json.msg || (res.ok ? 'Done' : `HTTP ${res.status}`),
      data: json.data,
    };
  } catch (error) {
    console.error('appHomeHeader API error:', error);
    return { success: false, message: 'Network error' };
  }
}

export const getHomeHeader = () => call<{ settings: HomeHeaderSettings }>();
export const updateHomeHeader = (body: Partial<HomeHeaderSettings>) =>
  call<{ settings: HomeHeaderSettings }>({ method: 'PATCH', body: JSON.stringify(body) });

// Same rules as the app (HomeHeaderStyle.greeting in festive_theme_model.dart).
export function dayPartFor(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export function renderGreeting(template: string, fullName: string, s: Pick<HomeHeaderSettings, 'name_format' | 'fallback_name'>): string {
  const name = fullName.trim();
  const shown = name ? (s.name_format === 'full' ? name : name.split(/\s+/)[0]) : s.fallback_name;
  const text = template.split('{name}').join(shown);
  return shown ? text : text.replace(/\s*,\s*(?=[!.?]|\s|$)/g, '').trim();
}
