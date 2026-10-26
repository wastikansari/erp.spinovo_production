'use client';

import { Clock } from 'lucide-react';
import { appContentImageUrl } from '@/lib/utils';
import { FONT_WEIGHT_CSS, ShowcaseItem, ShowcaseStyle, priceNumber } from '@/lib/api/appShowcase';

// Phone preview of one Home Showcase section. Sizes match the app widget
// (spinovo_app lib/widget/showcase/showcase_section.dart) — keep in sync.
export const CARD_WIDTH_PX = { s: 130, m: 160, l: 200 } as const;

// Card width for the side-scroll layout ("custom" → card_width_px).
export function cardWidth(layout: ShowcaseStyle['layout']): number {
  return layout.card_width === 'custom' ? layout.card_width_px : CARD_WIDTH_PX[layout.card_width];
}
export const RATIO = { '1:1': 1, '4:3': 4 / 3, '3:4': 3 / 4 } as const;
const PHONE_WIDTH = 360;
const SIDE_PADDING = 16;

function Ornament({ kind, color, flip }: { kind: ShowcaseStyle['heading']['ornament']; color: string; flip?: boolean }) {
  if (kind === 'none') return null;
  if (kind === 'line_dot')
    return (
      <span className="inline-flex items-center gap-1" style={{ flexDirection: flip ? 'row-reverse' : 'row' }}>
        <span style={{ width: 22, height: 2, background: color, borderRadius: 2 }} />
        <span style={{ width: 6, height: 6, background: color, borderRadius: 6 }} />
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1" style={{ flexDirection: flip ? 'row-reverse' : 'row' }}>
      <span style={{ width: 7, height: 7, border: `1.5px solid ${color}`, transform: 'rotate(45deg)' }} />
      <span style={{ width: 10, height: 10, background: color, transform: 'rotate(45deg)' }} />
    </span>
  );
}

function PreviewCard({ style, item, width }: { style: ShowcaseStyle; item: ShowcaseItem; width: number }) {
  const { card, add_button: btn, badge, text, price_row, layout } = style;
  const price = priceNumber(item.price);
  const mrp = item.mrp != null && Number.isFinite(price) && item.mrp > price ? item.mrp : null;
  const off = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const duration =
    item.duration_mode === 'service' ? item.service_duration : item.duration_mode === 'custom' ? item.duration_text : '';
  const name = item.custom_name || item.category_name;
  const image = appContentImageUrl(item.image_url);
  const padded = card.border_width > 0 || card.shadow || card.bg_color.toUpperCase() !== '#FFFFFF';
  const padding = card.padding ?? (padded ? 6 : 0);
  const overhang = Math.round(btn.height * 0.4);

  const addButton = (
    <span
      className="inline-flex items-center justify-center font-bold"
      style={{
        background: btn.bg_color,
        border: `${btn.border_width}px solid ${btn.border_color}`,
        color: btn.text_color,
        borderRadius: btn.radius,
        fontSize: btn.font_size,
        minWidth: btn.width,
        height: btn.height,
        padding: '0 12px',
        boxSizing: 'border-box',
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
      }}
    >
      {btn.text}
    </span>
  );

  const lines = style.lines
    .filter((l) => l.show)
    .map((l) => {
      if (l.key === 'price')
        return (
          <div key="price" className="flex flex-wrap items-baseline gap-1.5">
            <span style={{ color: text.price_color, fontSize: text.price_size, fontWeight: FONT_WEIGHT_CSS[text.price_weight] }}>
              ₹{item.price}
            </span>
            {price_row.show_mrp && mrp && (
              <span style={{ color: text.mrp_color, fontSize: text.mrp_size, textDecoration: 'line-through' }}>₹{mrp}</span>
            )}
            {price_row.show_off && off > 0 && (
              <span
                style={{
                  background: text.off_bg_color,
                  color: text.off_text_color,
                  fontSize: text.off_size,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 4,
                }}
              >
                {off}% OFF
              </span>
            )}
          </div>
        );
      if (l.key === 'duration')
        return duration ? (
          <div key="duration" className="flex items-center gap-1" style={{ color: text.line_color, fontSize: text.duration_size }}>
            {text.show_duration_icon && <Clock style={{ width: text.duration_size + 1, height: text.duration_size + 1 }} />}
            <span className="truncate">{duration}</span>
          </div>
        ) : null;
      if (l.key === 'name')
        return (
          <div
            key="name"
            style={{
              color: text.name_color,
              fontSize: text.name_size,
              fontWeight: FONT_WEIGHT_CSS[text.name_weight],
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: text.name_max_lines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {name}
          </div>
        );
      return item.extra_text ? (
        <div key="extra" style={{ color: text.line_color, fontSize: text.extra_size }} className="line-clamp-2">
          {item.extra_text}
        </div>
      ) : null;
    });

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        background: card.bg_color,
        borderRadius: card.radius,
        border: card.border_width ? `${card.border_width}px solid ${card.border_color}` : undefined,
        boxShadow: card.shadow ? '0 3px 10px rgba(0,0,0,0.10)' : undefined,
        padding,
        opacity: item.is_active && !item.warning ? 1 : 0.35,
      }}
    >
      <div className="relative" style={{ paddingBottom: btn.position === 'on_image' ? overhang : 0 }}>
        <div
          className="overflow-hidden bg-gray-100"
          style={{ aspectRatio: String(RATIO[layout.image_ratio]), borderRadius: card.image_radius }}
        >
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="h-full w-full object-cover" />
          )}
        </div>
        {item.badge_text && (
          <span
            className="absolute left-0 top-2 font-bold"
            style={{
              background: badge.bg_color,
              color: badge.text_color,
              fontSize: badge.font_size,
              padding: `${badge.padding_v}px ${badge.padding_h}px`,
              borderRadius: '0 8px 8px 0',
            }}
          >
            {item.badge_text}
          </span>
        )}
        {btn.position === 'on_image' && <span className="absolute bottom-0 right-1.5">{addButton}</span>}
      </div>
      <div className="mt-2 space-y-1" style={{ paddingLeft: 2, paddingRight: 2 }}>
        {lines}
        {btn.position === 'below' && <div className="pt-1">{addButton}</div>}
      </div>
    </div>
  );
}

export function ShowcasePreview({ style, items }: { style: ShowcaseStyle; items: ShowcaseItem[] }) {
  const { heading, background, layout } = style;
  const visible = items.slice(0, layout.max_cards);
  const grid = layout.style === 'grid';
  const inner = PHONE_WIDTH - SIDE_PADDING * 2;
  const gap = layout.gap;
  const width = grid ? (inner - gap) / 2 : cardWidth(layout);
  const bgImage = appContentImageUrl(background.image_url);

  const bg: React.CSSProperties =
    background.style === 'color'
      ? { background: background.color }
      : background.style === 'gradient'
        ? { background: `linear-gradient(180deg, ${background.gradient_from}, ${background.gradient_to})` }
        : background.style === 'image' && bgImage
          ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {};
  const hasBg = background.style !== 'none';

  return (
    <div className="mx-auto overflow-hidden rounded-[28px] border-[6px] border-gray-800 bg-white" style={{ width: PHONE_WIDTH + 12 }}>
      <div className="h-16 bg-gradient-to-b from-emerald-700 to-emerald-600 px-4 pt-3 text-xs text-white/80">Banner area</div>
      <div style={{ padding: `16px ${SIDE_PADDING}px` }}>
        <div style={{ ...bg, borderRadius: hasBg ? background.radius : 0, padding: hasBg ? '14px 10px' : 0 }}>
          {(heading.show_title || heading.show_subtitle) && (
            <div className="mb-3" style={{ textAlign: heading.align }}>
              {heading.show_title && heading.title && (
                <div
                  className="flex items-center gap-2"
                  style={{ justifyContent: heading.align === 'center' ? 'center' : 'flex-start' }}
                >
                  {heading.align === 'center' && <Ornament kind={heading.ornament} color={heading.ornament_color} />}
                  <span style={{ color: heading.title_color, fontSize: heading.title_size, fontWeight: 700 }}>
                    {heading.title}
                  </span>
                  <Ornament kind={heading.ornament} color={heading.ornament_color} flip />
                </div>
              )}
              {heading.show_subtitle && heading.subtitle && (
                <div style={{ color: heading.subtitle_color, fontSize: heading.subtitle_size, marginTop: 2 }}>
                  {heading.subtitle}
                </div>
              )}
            </div>
          )}

          {visible.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-gray-400">
              Add cards — a section with no cards is hidden in the app.
            </div>
          ) : grid ? (
            <div className="grid grid-cols-2" style={{ columnGap: gap, rowGap: 18 }}>
              {visible.map((item) => (
                <PreviewCard key={item._id} style={style} item={item} width={width} />
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto pb-1" style={{ gap }}>
              {visible.map((item) => (
                <PreviewCard key={item._id} style={style} item={item} width={width} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="px-4 pb-4 text-xs text-gray-400">Services…</div>
    </div>
  );
}
