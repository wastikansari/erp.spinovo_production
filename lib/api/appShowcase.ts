import { AuthService } from '../auth';
import { API_URL } from '../config/constants';

// ERP → Home Showcase. Backend: spinovo_api/features/appShowcase.
// Admin-built Home sections of category cards (app ≥ 1.0.17).

export type ShowcasePosition = 'after_banner' | 'after_services' | 'after_bookings';
export type LineKey = 'price' | 'duration' | 'name' | 'extra';
export type DurationMode = 'service' | 'custom' | 'hide';

export const POSITION_LABELS: Record<ShowcasePosition, string> = {
  after_banner: 'After the banner',
  after_services: 'After the services',
  after_bookings: 'After the bookings card',
};

export const LINE_LABELS: Record<LineKey, string> = {
  price: 'Price (with MRP & % OFF)',
  duration: 'Duration line',
  name: 'Name',
  extra: 'Extra text',
};

export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface ShowcaseStyle {
  heading: {
    title: string;
    subtitle: string;
    show_title: boolean;
    show_subtitle: boolean;
    title_color: string;
    subtitle_color: string;
    title_size: number;
    subtitle_size: number;
    align: 'center' | 'left';
    ornament: 'none' | 'diamond' | 'line_dot';
    ornament_color: string;
  };
  background: {
    style: 'none' | 'color' | 'gradient' | 'image';
    color: string;
    gradient_from: string;
    gradient_to: string;
    image_url: string;
    radius: number;
  };
  layout: {
    style: 'scroll' | 'grid';
    card_width: 's' | 'm' | 'l' | 'custom';
    card_width_px: number; // when card_width is 'custom'
    gap: number;
    image_ratio: '1:1' | '4:3' | '3:4';
    max_cards: number;
  };
  card: {
    bg_color: string;
    radius: number;
    border_width: number;
    border_color: string;
    shadow: boolean;
    image_radius: number;
    padding: number | null; // null = automatic
  };
  add_button: {
    text: string;
    position: 'on_image' | 'below';
    bg_color: string;
    border_color: string;
    text_color: string;
    width: number; // minimum width
    height: number;
    font_size: number;
    radius: number;
    border_width: number;
  };
  badge: { bg_color: string; text_color: string; font_size: number; padding_h: number; padding_v: number };
  text: {
    price_color: string;
    price_size: number;
    price_weight: FontWeight;
    mrp_color: string;
    mrp_size: number;
    off_bg_color: string;
    off_text_color: string;
    off_size: number;
    name_color: string;
    name_size: number;
    name_weight: FontWeight;
    name_max_lines: number;
    line_color: string;
    duration_size: number;
    show_duration_icon: boolean;
    extra_size: number;
  };
  price_row: { show_mrp: boolean; show_off: boolean };
  lines: { key: LineKey; show: boolean }[];
}

export interface ShowcaseItem {
  _id: string;
  service_id: number;
  category_id: number;
  image_url: string;
  custom_name: string;
  mrp: number | null;
  duration_mode: DurationMode;
  duration_text: string;
  extra_text: string;
  badge_text: string;
  is_active: boolean;
  // Added by the API for the ERP view (live from ERP → Services).
  service_name: string;
  category_name: string;
  price: string;
  service_duration: string;
  warning: string; // non-empty → the app skips this card
}

export interface ShowcaseSection extends ShowcaseStyle {
  _id: string;
  name: string;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  position: ShowcasePosition;
  sort_order: number;
  items: ShowcaseItem[];
  updatedAt: string;
}

export interface CatalogService {
  service_id: number;
  service: string;
  duration: string;
  is_active: boolean;
  // Bundle services (Home Curtain Bundle) come with one virtual category 0
  // priced from the bundle settings; the app opens the bundle popup.
  is_bundle?: boolean;
  categories: { category_id: number; category: string; price: string }[];
}

// Section fields the editor saves — any subset; style groups may be partial
// (the API applies them leaf by leaf). Background image has its own upload.
type Editable = Omit<ShowcaseSection, '_id' | 'items' | 'sort_order' | 'updatedAt'>;
export type SectionPatch = {
  [K in keyof Editable]?: Editable[K] extends unknown[]
    ? Editable[K]
    : Editable[K] extends object
      ? Partial<Editable[K]>
      : Editable[K];
};

// Card form values, sent as multipart (image optional on edit).
export interface ItemFields {
  service_id: string;
  category_id: string;
  custom_name: string;
  mrp: string; // '' = no MRP
  duration_mode: DurationMode;
  duration_text: string;
  extra_text: string;
  badge_text: string;
  is_active: boolean;
}

type Result<T> = { success: boolean; message: string; data?: T };

const BASE = `${API_URL.BASE_URL}/admin/app-showcase`;

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
    console.error('appShowcase API error:', error);
    return { success: false, message: 'Network error' };
  }
}

function toForm(fields: Partial<ItemFields>, image?: File | null): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(key, String(value));
  }
  if (image) form.append('image', image);
  return form;
}

type SectionResult = Result<{ section: ShowcaseSection }>;
const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const getCatalog = () => call<{ services: CatalogService[] }>('/catalog');

// ── Sections ──
export const listSections = () => call<{ sections: ShowcaseSection[] }>('/sections');
export const getSection = async (id: string): Promise<SectionResult> => {
  const r = await listSections();
  const section = r.data?.sections.find((s) => s._id === id);
  if (!r.success) return { success: false, message: r.message };
  return section ? { success: true, message: 'Done', data: { section } } : { success: false, message: 'Section not found' };
};
export const createSection = (fields: SectionPatch & { name: string }) =>
  call<{ section: ShowcaseSection }>('/sections', json('POST', fields));
export const updateSection = (id: string, fields: SectionPatch) =>
  call<{ section: ShowcaseSection }>(`/sections/${id}`, json('PATCH', fields));
export const deleteSection = (id: string) => call(`/sections/${id}`, json('DELETE'));
export const duplicateSection = (id: string) =>
  call<{ section: ShowcaseSection }>(`/sections/${id}/duplicate`, json('POST'));
export const reorderSections = (order: string[]) => call('/sections/reorder', json('PATCH', { order }));

export const uploadBackground = (id: string, image: File) =>
  call<{ section: ShowcaseSection }>(`/sections/${id}/background`, { method: 'POST', body: toForm({}, image) });
export const removeBackground = (id: string) =>
  call<{ section: ShowcaseSection }>(`/sections/${id}/background`, json('DELETE'));

// ── Cards ──
export const createItem = (sectionId: string, fields: ItemFields, image: File) =>
  call<{ section: ShowcaseSection }>(`/sections/${sectionId}/items`, { method: 'POST', body: toForm(fields, image) });
export const updateItem = (sectionId: string, itemId: string, fields: Partial<ItemFields>, image?: File | null) =>
  call<{ section: ShowcaseSection }>(`/sections/${sectionId}/items/${itemId}`, {
    method: 'PATCH',
    body: toForm(fields, image),
  });
export const deleteItem = (sectionId: string, itemId: string) =>
  call<{ section: ShowcaseSection }>(`/sections/${sectionId}/items/${itemId}`, json('DELETE'));
export const reorderItems = (sectionId: string, order: string[]) =>
  call<{ section: ShowcaseSection }>(`/sections/${sectionId}/items/reorder`, json('PATCH', { order }));

// "Live" = active and inside its schedule right now.
export function sectionStatus(s: Pick<ShowcaseSection, 'is_active' | 'start_at' | 'end_at'>):
  | 'live'
  | 'scheduled'
  | 'ended'
  | 'off' {
  if (!s.is_active) return 'off';
  const now = Date.now();
  if (s.start_at && new Date(s.start_at).getTime() > now) return 'scheduled';
  if (s.end_at && new Date(s.end_at).getTime() < now) return 'ended';
  return 'live';
}

// Category prices are strings ("199").
export const priceNumber = (price: string | number | null | undefined) =>
  Number.parseFloat(String(price ?? '').replace(/[^\d.]/g, ''));

export const FONT_WEIGHT_CSS: Record<FontWeight, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };

// One-click size sets for the editor. "standard" = the original defaults.
type SizeFields = {
  layout: Pick<ShowcaseStyle['layout'], 'card_width' | 'gap'>;
  add_button: Pick<ShowcaseStyle['add_button'], 'width' | 'height' | 'font_size' | 'radius' | 'border_width'>;
  badge: Pick<ShowcaseStyle['badge'], 'font_size' | 'padding_h' | 'padding_v'>;
  text: Pick<
    ShowcaseStyle['text'],
    'price_size' | 'mrp_size' | 'off_size' | 'name_size' | 'duration_size' | 'extra_size'
  >;
};
export const SIZE_PRESETS: Record<'compact' | 'standard' | 'large', SizeFields> = {
  compact: {
    layout: { card_width: 's', gap: 10 },
    add_button: { width: 72, height: 30, font_size: 13, radius: 8, border_width: 1.5 },
    badge: { font_size: 10, padding_h: 6, padding_v: 2 },
    text: { price_size: 16, mrp_size: 11, off_size: 9, name_size: 13, duration_size: 11, extra_size: 11 },
  },
  standard: {
    layout: { card_width: 'm', gap: 12 },
    add_button: { width: 84, height: 34, font_size: 15, radius: 10, border_width: 1.5 },
    badge: { font_size: 11, padding_h: 8, padding_v: 3 },
    text: { price_size: 20, mrp_size: 12, off_size: 10, name_size: 15, duration_size: 12, extra_size: 12 },
  },
  large: {
    layout: { card_width: 'l', gap: 14 },
    add_button: { width: 96, height: 38, font_size: 16, radius: 12, border_width: 2 },
    badge: { font_size: 12, padding_h: 9, padding_v: 3 },
    text: { price_size: 22, mrp_size: 13, off_size: 11, name_size: 16, duration_size: 13, extra_size: 13 },
  },
};

// ── Home Layout ──
// Order of everything on Home below the header (app 1.0.17+): the four
// built-in sections and every showcase section. A built-in carries its own
// ON/OFF, schedule and box; a showcase only its place and outer margin.
export type BuiltinKey = 'banner' | 'services' | 'bookings' | 'footer';
export type BoxBgStyle = 'none' | 'color' | 'gradient';

export interface LayoutBox {
  padding_top: number;
  padding_bottom: number;
  padding_left: number;
  padding_right: number;
  bg_style: BoxBgStyle;
  bg_color: string;
  gradient_from: string;
  gradient_to: string;
  radius: number;
  border_width: number;
  border_color: string;
  shadow: boolean;
}

export interface LayoutBlock {
  kind: 'builtin' | 'showcase';
  key: BuiltinKey | null;
  section_id: string | null;
  margin_top: number;
  margin_bottom: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  box?: LayoutBox;
  // Display only (sent by the API).
  label: string;
  live: boolean;
  cards?: number;
}

export const getLayout = () => call<{ blocks: LayoutBlock[] }>('/layout');
export const saveLayout = (blocks: LayoutBlock[]) =>
  call<{ blocks: LayoutBlock[] }>('/layout', json('PUT', { blocks }));
