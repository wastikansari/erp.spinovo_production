import { AuthService } from '../auth';
import { API_URL } from '../config/constants';

// ERP → App Theme (festive Splash + Home). Backend: spinovo_api/features/appTheme.

export type EffectStyle = 'none' | 'petals' | 'sparkles' | 'stars' | 'snow' | 'confetti';
export type Density = 'low' | 'medium' | 'high';
export type LightSpeed = 'slow' | 'normal' | 'fast';

export type ServiceOrnament = 'line' | 'diamond' | 'flower' | 'diya' | 'star' | 'snowflake';
export type TileCorner = 'none' | 'flower' | 'diya' | 'star' | 'snowflake';
export type FooterOrnament = 'none' | 'diyas' | 'marigolds' | 'snowflakes' | 'stars' | 'confetti';

export interface ThemeSections {
  service: {
    title: string;
    subtitle: string;
    title_color: string;
    ornament: ServiceOrnament;
    tile_border_color: string | null;
    tile_corner: TileCorner;
  };
  bookings: { title_color: string; link_color: string; card_tint: string | null; border_color: string | null };
  footer: {
    title: string;
    subtitle: string;
    credit: string;
    title_color: string;
    text_color: string;
    ornament: FooterOrnament;
  };
}

export const DEFAULT_SECTIONS: ThemeSections = {
  service: {
    title: 'Our Service',
    subtitle: 'All your laundry needs, just a tap away.',
    title_color: '#10183F',
    ornament: 'line',
    tile_border_color: null,
    tile_corner: 'none',
  },
  bookings: { title_color: '#10183F', link_color: '#33C362', card_tint: null, border_color: null },
  footer: {
    title: 'Live it up!',
    subtitle: 'India’s first quick laundry service',
    credit: 'Crafted with ❤️ in India',
    title_color: '#ADD6BE',
    text_color: '#8F8F8F',
    ornament: 'none',
  },
};

export interface AppTheme {
  _id: string;
  name: string;
  preset_key: string | null;
  splash: { gradient: string[]; text_color: string; tagline: string };
  header: { gradient: string[]; text_color: string; image_url: string };
  accent_color: string;
  greeting: { text: string; color: string };
  effect: { style: EffectStyle; density: Density; colors: string[] };
  lights: { enabled: boolean; colors: string[]; speed: LightSpeed };
  toran: { enabled: boolean; flower_colors: string[]; leaf_color: string };
  tile_tint: string | null;
  sections: ThemeSections;
  // null = use the bar applied in ERP → Bottom Bar.
  nav_bar_id: string | null;
  // Recolor the bottom bar with this theme's accent / lights colors.
  nav_tint: boolean;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  updatedAt: string;
}

// Everything the editor can send (image is uploaded separately).
export type AppThemeEditable = Omit<AppTheme, '_id' | 'preset_key' | 'updatedAt' | 'header'> & {
  header: { gradient: string[]; text_color: string };
};

type Result<T> = { success: boolean; message: string; data?: T };

const BASE = `${API_URL.BASE_URL}/admin/app-theme`;

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
    console.error('appTheme API error:', error);
    return { success: false, message: 'Network error' };
  }
}

export const listThemes = () => call<{ themes: AppTheme[]; live_theme_id: string }>('');
export const updateTheme = (id: string, body: Partial<AppThemeEditable>) =>
  call<{ theme: AppTheme }>(`/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const applyTheme = (id: string) => call<{ theme: AppTheme }>(`/${id}/apply`, { method: 'POST' });
export const duplicateTheme = (id: string) => call<{ theme: AppTheme }>(`/${id}/duplicate`, { method: 'POST' });
export const resetTheme = (id: string) => call<{ theme: AppTheme }>(`/${id}/reset`, { method: 'POST' });
export const deleteTheme = (id: string) => call(`/${id}`, { method: 'DELETE' });
export function uploadThemeHeaderImage(id: string, file: File) {
  const form = new FormData();
  form.append('image', file);
  return call<{ theme: AppTheme }>(`/${id}/header-image`, { method: 'POST', body: form });
}
export const removeThemeHeaderImage = (id: string) =>
  call<{ theme: AppTheme }>(`/${id}/header-image`, { method: 'DELETE' });

// ── Readability helpers (WCAG contrast ratio) ──
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrastRatio(a: string, b: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return 21;
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Plain-language warnings shown in the editor when text may be hard to read.
export function readabilityWarnings(t: Pick<AppTheme, 'splash' | 'header' | 'accent_color' | 'greeting'>): string[] {
  const warnings: string[] = [];
  const worst = (fg: string, bgs: string[]) => Math.min(...bgs.map((bg) => contrastRatio(fg, bg)));
  if (worst(t.header.text_color, t.header.gradient) < 3)
    warnings.push('Header text is hard to read on these header colors.');
  if (worst(t.splash.text_color, t.splash.gradient) < 3)
    warnings.push('Splash text is hard to read on these splash colors.');
  if (t.greeting.text && contrastRatio(t.greeting.color, '#FFFFFF') < 3)
    warnings.push('Greeting color is too light to read on the white Home sheet.');
  if (contrastRatio(t.accent_color, '#FFFFFF') < 2.5)
    warnings.push('Accent color is very light — badges and lines may be hard to see.');
  return warnings;
}
