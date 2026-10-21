'use client';

import { CSSProperties, useMemo } from 'react';
import { AppTheme, DEFAULT_SECTIONS, withThemeDefaults } from '@/lib/api/appTheme';
import { appContentImageUrl } from '@/lib/utils';

// A close-enough phone mock of the app's themed Splash and Home screens, so
// the admin sees colors/effects before applying. The app draws the real
// effects in Flutter; these are CSS look-alikes.

type PreviewTheme = Pick<
  AppTheme,
  'splash' | 'header' | 'accent_color' | 'greeting' | 'effect' | 'lights' | 'toran' | 'tile_tint'
> & { preset_key?: string | null; sections?: AppTheme['sections'] };

const ORNAMENT_EMOJI: Record<string, string> = {
  diamond: '◆',
  flower: '🌼',
  diya: '🪔',
  star: '⭐',
  snowflake: '❄️',
  diyas: '🪔',
  marigolds: '🌼',
  snowflakes: '❄️',
  stars: '⭐',
  confetti: '🎉',
};

const KEYFRAMES = `
@keyframes ap-fall { from { transform: translateY(-20px) rotate(0deg); } to { transform: translateY(260px) rotate(300deg); } }
@keyframes ap-twinkle { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
@keyframes ap-sway { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
`;

function gradientCss(colors: string[], dir = '135deg') {
  if (colors.length === 0) return '#071F0F';
  if (colors.length === 1) return colors[0];
  return `linear-gradient(${dir}, ${colors.join(', ')})`;
}

function Particles({ theme, count }: { theme: PreviewTheme; count: number }) {
  // Stable pseudo-random layout so the preview doesn't jump on re-render.
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 37) % 100,
        delay: -((i * 1.7) % 6),
        duration: 5 + (i % 4),
        size: 5 + (i % 4) * 2,
      })),
    [count]
  );
  const colors = theme.effect.colors.length ? theme.effect.colors : ['#FFFFFF'];
  const style = theme.effect.style;
  if (style === 'none') return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] overflow-hidden">
      {items.map((p, i) => {
        const color = colors[i % colors.length];
        const shape: CSSProperties =
          style === 'petals'
            ? { width: p.size, height: p.size * 0.55, borderRadius: '50%', background: color }
            : style === 'snow'
              ? { width: p.size * 0.7, height: p.size * 0.7, borderRadius: '50%', background: color, filter: 'blur(0.5px)' }
              : style === 'confetti'
                ? { width: p.size, height: p.size * 0.4, background: color }
                : { width: p.size, height: p.size, background: color, clipPath: 'polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%)' };
        return (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${p.left}%`,
              top: 0,
              animation: `ap-fall ${p.duration}s linear ${p.delay}s infinite${style === 'sparkles' || style === 'stars' ? `, ap-twinkle 1.6s ease-in-out ${p.delay}s infinite` : ''}`,
              ...shape,
            }}
          />
        );
      })}
    </div>
  );
}

function Lights({ colors }: { colors: string[] }) {
  const list = colors.length ? colors : ['#FFEB3B'];
  return (
    <div className="relative h-[18px]">
      <div className="absolute inset-x-0 top-[3px] border-t border-black/40" />
      <div className="absolute inset-x-1 top-[2px] flex justify-between">
        {Array.from({ length: 14 }, (_, i) => {
          const c = list[i % list.length];
          return (
            <span
              key={i}
              className="mt-[2px] block h-[8px] w-[6px] rounded-full"
              style={{
                background: c,
                boxShadow: `0 0 6px 2px ${c}AA`,
                animation: `ap-twinkle 1.4s ease-in-out ${-(i * 0.37)}s infinite`,
                marginTop: i % 3 === 1 ? 6 : 2,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Toran({ flowers, leaf }: { flowers: string[]; leaf: string }) {
  const list = flowers.length ? flowers : ['#FF9800'];
  return (
    <div className="relative h-[22px]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-red-800" />
      <div className="absolute inset-x-1 top-0 flex justify-between">
        {Array.from({ length: 13 }, (_, i) =>
          i % 2 === 0 ? (
            <span key={i} className="flex flex-col items-center">
              <span className="h-[8px] w-px bg-amber-800/60" />
              <span className="block h-[8px] w-[8px] rounded-full" style={{ background: list[(i / 2) % list.length] }} />
            </span>
          ) : (
            <span key={i} className="mt-px block h-[11px] w-[5px] rounded-b-full" style={{ background: leaf }} />
          )
        )}
      </div>
    </div>
  );
}

const GRADIENT_DIR: Record<string, string> = { diagonal: '135deg', horizontal: '90deg', vertical: '180deg' };

function Marigold({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <span
      className="block rounded-full"
      style={{ width: size, height: size, background: `radial-gradient(circle, #8D4A00 0 22%, ${color} 35%)` }}
    />
  );
}

// CSS look-alike of the app's hanging marigold strings + diyas.
function HangingDiyas({ hanging }: { hanging: AppTheme['header']['hanging'] }) {
  const flowers = hanging.flower_colors.length ? hanging.flower_colors : ['#FFB300'];
  const full = { short: 40, medium: 58, long: 82 }[hanging.length];
  const stagger = [1, 0.72, 0.88, 0.62, 0.8];
  const sides = hanging.side === 'both' ? ['left', 'right'] : [hanging.side];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      {hanging.top_garland && (
        <div className="absolute inset-x-0 top-0 flex">
          {Array.from({ length: 3 }, (_, s) => (
            <div key={s} className="relative h-[14px] flex-1">
              {Array.from({ length: 9 }, (_, j) => {
                const u = j / 8;
                return (
                  <span key={j} className="absolute" style={{ left: `${u * 100}%`, top: 4 * 9 * u * (1 - u), marginLeft: -3 }}>
                    <Marigold color={flowers[(s + j) % flowers.length]} size={6} />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {sides.flatMap((side) =>
        Array.from({ length: hanging.count }, (_, i) => {
          const len = full * stagger[i % stagger.length];
          return (
            <div
              key={`${side}-${i}`}
              className="absolute top-0 flex flex-col items-center"
              style={{
                [side]: 6 + i * 11,
                transformOrigin: 'top center',
                animation: hanging.animate ? `ap-sway ${3 + (i % 3) * 0.4}s ease-in-out ${-i}s infinite alternate` : undefined,
              }}
            >
              <div className="flex flex-col items-center" style={{ height: len, overflow: 'hidden' }}>
                {Array.from({ length: Math.floor(len / 6) }, (_, k) => (
                  <Marigold key={k} color={flowers[(k + i) % flowers.length]} size={6} />
                ))}
              </div>
              {/* diya */}
              <span
                className="block h-[6px] w-[3px] rounded-t-full"
                style={{
                  background: hanging.flame_color,
                  boxShadow: `0 0 6px 2px ${hanging.flame_color}99`,
                  animation: hanging.animate ? 'ap-twinkle 0.9s ease-in-out infinite' : undefined,
                }}
              />
              <span className="block h-[5px] w-[12px] rounded-b-full" style={{ background: hanging.diya_color }} />
            </div>
          );
        })
      )}
    </div>
  );
}

function WalletPill({ theme, isDefault }: { theme: PreviewTheme; isDefault: boolean }) {
  const w = theme.header.wallet;
  const custom = !isDefault && (w.style === 'solid' || w.style === 'outline');
  const style: CSSProperties = isDefault
    ? { background: '#33C362', color: '#fff' }
    : w.style === 'solid'
      ? { background: w.bg_color, color: w.text_color }
      : w.style === 'outline'
        ? { background: `${w.border_color}14`, border: `1px solid ${w.border_color}`, color: w.text_color }
        : { background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.55)', color: '#fff' };
  return (
    <span className={`shrink-0 rounded-md px-2 text-[10px] font-semibold ${custom ? 'py-1' : 'py-0.5'}`} style={style}>
      👛 ₹53{!isDefault && w.show_arrow && ' ›'}
    </span>
  );
}

export function HomePreview({ theme: raw }: { theme: PreviewTheme }) {
  const theme = withThemeDefaults(raw);
  const isDefault = theme.preset_key === 'default';
  const sec = theme.sections ?? DEFAULT_SECTIONS;
  const h = theme.header;
  const headerImage = appContentImageUrl(h.image_url);
  const bottomColor = h.gradient[h.gradient.length - 1] || '#071F0F';
  const fg = h.text_color;
  const greetingColor = (!isDefault && h.greeting_color) || fg;
  const addressColor = (!isDefault && h.address_color) || `${fg}BB`;
  const pinColor = (!isDefault && h.icon_color) || fg;
  const stacked = !isDefault && h.layout === 'stacked';
  const cards = !isDefault && sec.service.tile_style === 'card_arrow';
  // The preview phone is ~2/3 of a real one.
  const scale = 0.66;
  const greetingPx = (isDefault ? 20 : h.greeting_size) * scale;
  const subtitle = isDefault ? DEFAULT_SECTIONS.service.subtitle : sec.service.subtitle;
  const radius = (isDefault ? 25 : h.sheet_radius) * 0.72;
  return (
    <div className="relative w-[260px] overflow-hidden rounded-[28px] border-[6px] border-gray-900 bg-white shadow-xl">
      <style>{KEYFRAMES}</style>
      {!isDefault && h.hanging.enabled && <HangingDiyas hanging={h.hanging} />}
      {/* HEADER */}
      <div
        className="relative px-3 pb-2 pt-6"
        style={{
          background: headerImage
            ? `linear-gradient(rgba(0,0,0,.3), rgba(0,0,0,.3)), url(${headerImage}) center/cover`
            : gradientCss(h.gradient, isDefault ? '135deg' : GRADIENT_DIR[h.gradient_direction]),
          color: fg,
        }}
      >
        {stacked ? (
          <div>
            <p className="font-semibold leading-tight" style={{ color: greetingColor, fontSize: greetingPx * 0.72 }}>
              Good Evening,
            </p>
            <p className="font-extrabold leading-tight" style={{ color: greetingColor, fontSize: greetingPx }}>
              Nipul 👋
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span style={{ color: pinColor }} className="text-[11px]">●</span>
              <p className="flex-1 text-[8px] leading-tight" style={{ color: addressColor }}>
                Home: BB13, Twpovan Society, Opp Yash complex… ⌄
              </p>
              <WalletPill theme={theme} isDefault={isDefault} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span style={{ color: pinColor }} className="text-[12px]">●</span>
              <div>
                <p className="font-bold leading-tight" style={{ color: greetingColor, fontSize: Math.max(12, greetingPx) }}>
                  Home
                </p>
                <p className="text-[9px]" style={{ color: addressColor }}>
                  401, Vadiwadi, Vadodara…
                </p>
              </div>
            </div>
            <WalletPill theme={theme} isDefault={isDefault} />
          </div>
        )}
        {theme.lights.enabled && !isDefault && (
          <div className="mt-2">
            <Lights colors={theme.lights.colors} />
          </div>
        )}
      </div>

      {/* SHEET */}
      <div style={{ background: bottomColor }}>
        <div className="bg-white px-3 pb-3" style={{ borderTopLeftRadius: radius, borderTopRightRadius: radius }}>
          {theme.toran.enabled && !isDefault ? (
            <Toran flowers={theme.toran.flower_colors} leaf={theme.toran.leaf_color} />
          ) : (
            <div className="h-[14px]" />
          )}
          {theme.greeting.text && !isDefault && (
            <p className="mb-1.5 text-[13px] font-extrabold" style={{ color: theme.greeting.color }}>
              {theme.greeting.text}
            </p>
          )}
          <div className="h-[62px] rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 text-center text-[9px] leading-[62px] text-gray-500">
            Banner
          </div>
          <p className="mt-3 text-[12px] font-bold" style={{ color: isDefault ? '#10183F' : sec.service.title_color }}>
            {isDefault ? 'Our Service' : sec.service.title}
          </p>
          {subtitle && <p className="text-[7px] text-gray-400">{subtitle}</p>}
          {isDefault || sec.service.ornament === 'line' ? (
            <div className="mt-1 h-[2px] w-6 rounded" style={{ background: theme.accent_color }} />
          ) : sec.service.ornament === 'line_dot' ? (
            <div className="mt-1 flex items-center gap-[3px]">
              <span className="block h-[2px] w-4 rounded" style={{ background: theme.accent_color }} />
              <span className="block h-[4px] w-[4px] rounded-full" style={{ background: theme.accent_color }} />
            </div>
          ) : (
            <p className="mt-0.5 text-[8px] leading-none" style={{ color: theme.accent_color }}>
              ── {ORNAMENT_EMOJI[sec.service.ornament]} ──
            </p>
          )}
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(cards ? ['Quick Dry Cleaning', 'Quick Ironing', 'Ironing'] : ['Quick Dry', 'Ironing', 'Wash']).map((label, i) => (
              <div
                key={label}
                className={`relative rounded-lg border ${cards ? 'flex flex-col px-1.5 pb-1 pt-2' : 'py-3 text-center'} text-[8px] font-semibold text-gray-700`}
                style={{
                  background: isDefault ? '#fff' : theme.tile_tint || '#fff',
                  borderColor: (!isDefault && sec.service.tile_border_color) || '#E5E7EB',
                }}
              >
                {!isDefault && sec.service.tile_corner !== 'none' && (
                  <span className="absolute left-0.5 top-0 text-[7px]">{ORNAMENT_EMOJI[sec.service.tile_corner]}</span>
                )}
                {i === 0 && (
                  <span
                    className="absolute -right-1 -top-1.5 rounded-full px-1 text-[7px] text-white"
                    style={{ background: isDefault ? '#F59E0B' : theme.accent_color }}
                  >
                    8 Hrs
                  </span>
                )}
                {cards ? (
                  <>
                    <span className="mx-auto mb-1 block h-[22px] w-[26px] rounded bg-gray-200" />
                    <span className="text-[8px] font-bold leading-tight" style={{ color: sec.service.name_color }}>
                      {label}
                    </span>
                    <span
                      className="mt-0.5 flex h-[13px] w-[13px] items-center justify-center self-end rounded-full text-[8px] leading-none"
                      style={{
                        background: sec.service.arrow_bg || `${theme.accent_color}1F`,
                        color: sec.service.arrow_color || theme.accent_color,
                      }}
                    >
                      →
                    </span>
                  </>
                ) : (
                  label
                )}
              </div>
            ))}
          </div>
          {/* Bookings card */}
          <div
            className="mt-2.5 flex justify-between rounded-lg border px-2 py-1.5 text-[8px] font-bold"
            style={{
              background: (!isDefault && sec.bookings.card_tint) || '#fff',
              borderColor: (!isDefault && sec.bookings.border_color) || '#E5E7EB',
              color: isDefault ? '#10183F' : sec.bookings.title_color,
            }}
          >
            <span>Bookings</span>
            <span style={{ color: isDefault ? '#33C362' : sec.bookings.link_color }}>View All ›</span>
          </div>
          {/* Footer */}
          <div className="mt-2.5">
            {!isDefault && sec.footer.ornament !== 'none' && (
              <p className="text-[9px] tracking-[3px]">{ORNAMENT_EMOJI[sec.footer.ornament].repeat(5)}</p>
            )}
            <p className="text-[17px] font-black leading-tight" style={{ color: isDefault ? '#ADD6BE' : sec.footer.title_color }}>
              {isDefault ? 'Live it up!' : sec.footer.title}
            </p>
            <p className="text-[7px]" style={{ color: isDefault ? '#8F8F8F' : sec.footer.text_color }}>
              {isDefault ? DEFAULT_SECTIONS.footer.subtitle : sec.footer.subtitle}
            </p>
          </div>
        </div>
      </div>
      {!isDefault && <Particles theme={theme} count={theme.effect.density === 'low' ? 8 : theme.effect.density === 'high' ? 20 : 13} />}
    </div>
  );
}

export function SplashPreview({ theme }: { theme: PreviewTheme }) {
  const isDefault = theme.preset_key === 'default';
  const g = theme.splash.gradient.length ? theme.splash.gradient : ['#33C162', '#20783E'];
  return (
    <div
      className="relative flex h-[300px] w-[150px] flex-col overflow-hidden rounded-[22px] border-[5px] border-gray-900 shadow-xl"
      style={{ background: gradientCss(g.length === 1 ? [g[0], g[0]] : g, '180deg'), color: theme.splash.text_color }}
    >
      <style>{KEYFRAMES}</style>
      {!isDefault && (
        <div className="px-1 pt-1">
          {theme.lights.enabled && <Lights colors={theme.lights.colors} />}
          {theme.toran.enabled && <Toran flowers={theme.toran.flower_colors} leaf={theme.toran.leaf_color} />}
        </div>
      )}
      <div className="flex flex-1 flex-col items-center justify-center px-3 text-center">
        <p className="text-[24px] font-bold leading-none">Spinovo</p>
        <div className="my-1.5 h-px w-full bg-white/40" />
        <p className="text-[8px] leading-snug">{theme.splash.tagline}</p>
      </div>
      {!isDefault && <Particles theme={theme} count={8} />}
    </div>
  );
}
