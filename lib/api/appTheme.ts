import { AuthService } from '../auth';
import { API_URL } from '../config/constants';

// ERP → App Theme (festive Splash + Home). Backend: spinovo_api/features/appTheme.

export type EffectStyle = 'none' | 'petals' | 'sparkles' | 'stars' | 'snow' | 'confetti';
export type Density = 'low' | 'medium' | 'high';
export type LightSpeed = 'slow' | 'normal' | 'fast';

export type ServiceOrnament = 'line' | 'line_dot' | 'diamond' | 'flower' | 'diya' | 'star' | 'snowflake';
export type TileCorner = 'none' | 'flower' | 'diya' | 'star' | 'snowflake';
export type FooterOrnament = 'none' | 'diyas' | 'marigolds' | 'snowflakes' | 'stars' | 'confetti';
export type TileStyle = 'classic' | 'card_arrow';

// Fine-tuning of the card_arrow service box (app ≥ 1.0.17).
export interface ServiceCardStyle {
  radius: number;
  border_width: number;
  bg_color: string | null; // null = tile tint
  shadow: boolean;
  height: 'short' | 'normal' | 'tall';
  image_size: number;
  name_size: number;
  name_weight: 'bold' | 'normal';
  name_align: 'left' | 'center';
  arrow_show: boolean;
  arrow_shape: 'circle' | 'rounded';
  arrow_size: number;
  arrow_icon_size: number;
  badge_bg: string | null; // null = accent
  badge_text: string;
}

export const DEFAULT_CARD_STYLE: ServiceCardStyle = {
  radius: 16,
  border_width: 1,
  bg_color: null,
  shadow: true,
  height: 'normal',
  image_size: 58,
  name_size: 13.5,
  name_weight: 'bold',
  name_align: 'left',
  arrow_show: true,
  arrow_shape: 'circle',
  arrow_size: 28,
  arrow_icon_size: 16,
  badge_bg: null,
  badge_text: '#FFFFFF',
};

export interface ThemeSections {
  service: {
    title: string;
    subtitle: string;
    title_color: string;
    ornament: ServiceOrnament;
    tile_border_color: string | null;
    tile_corner: TileCorner;
    // app ≥ 1.0.17
    tile_style: TileStyle;
    name_color: string;
    arrow_bg: string | null; // null = light accent
    arrow_color: string | null; // null = accent
    card: ServiceCardStyle;
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
    tile_style: 'classic',
    name_color: '#1A1A1A',
    arrow_bg: null,
    arrow_color: null,
    card: DEFAULT_CARD_STYLE,
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

export type GradientDirection = 'diagonal' | 'horizontal' | 'vertical';
export type HeaderLayout = 'classic' | 'stacked';
export type WalletStyle = 'auto' | 'frosted' | 'solid' | 'outline';

// Home header fine-tuning (app ≥ 1.0.17). Defaults = the 1.0.16 header.
export interface HeaderExtras {
  gradient_direction: GradientDirection;
  layout: HeaderLayout;
  greeting_size: number;
  greeting_color: string | null; // null = header text color
  address_color: string | null; // null = soft header text color
  icon_color: string | null; // null = header text color
  sheet_radius: number;
  wallet: { style: WalletStyle; bg_color: string; text_color: string; border_color: string; show_arrow: boolean };
  hanging: {
    enabled: boolean;
    side: 'right' | 'left' | 'both';
    count: number;
    length: 'short' | 'medium' | 'long';
    flower_colors: string[];
    diya_color: string;
    flame_color: string;
    top_garland: boolean;
    animate: boolean;
  };
}

export const DEFAULT_HEADER_EXTRAS: HeaderExtras = {
  gradient_direction: 'diagonal',
  layout: 'classic',
  greeting_size: 20,
  greeting_color: null,
  address_color: null,
  icon_color: null,
  sheet_radius: 25,
  wallet: { style: 'auto', bg_color: '#33C362', text_color: '#FFFFFF', border_color: '#FFFFFF', show_arrow: false },
  hanging: {
    enabled: false,
    side: 'right',
    count: 3,
    length: 'medium',
    flower_colors: ['#FFB300', '#FF8F00'],
    diya_color: '#BF360C',
    flame_color: '#FFC107',
    top_garland: true,
    animate: true,
  },
};

export interface AppTheme {
  _id: string;
  name: string;
  preset_key: string | null;
  splash: { gradient: string[]; text_color: string; tagline: string };
  header: { gradient: string[]; text_color: string; image_url: string } & HeaderExtras;
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
  // Festive Home greeting while live; template uses {name}.
  header_greeting: { enabled: boolean; template: string };
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  updatedAt: string;
}

// Everything the editor can send (image is uploaded separately).
export type AppThemeEditable = Omit<AppTheme, '_id' | 'preset_key' | 'updatedAt' | 'header'> & {
  header: { gradient: string[]; text_color: string } & HeaderExtras;
};

// Themes saved before app 1.0.17 options existed come back without them —
// fill in the defaults (= the old look) so the editor and preview work.
export function withThemeDefaults<T extends Pick<AppTheme, 'header'> & { sections?: ThemeSections }>(t: T): T {
  const h = t.header as Partial<HeaderExtras> & AppTheme['header'];
  const sections = t.sections ?? DEFAULT_SECTIONS;
  return {
    ...t,
    header: {
      ...DEFAULT_HEADER_EXTRAS,
      ...h,
      wallet: { ...DEFAULT_HEADER_EXTRAS.wallet, ...h.wallet },
      hanging: { ...DEFAULT_HEADER_EXTRAS.hanging, ...h.hanging },
    },
    sections: {
      ...sections,
      service: {
        ...DEFAULT_SECTIONS.service,
        ...sections.service,
        card: { ...DEFAULT_CARD_STYLE, ...sections.service?.card },
      },
    },
  };
}

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
