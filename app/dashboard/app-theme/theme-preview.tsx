'use client';

import { CSSProperties, useMemo } from 'react';
import { AppTheme, DEFAULT_SECTIONS } from '@/lib/api/appTheme';
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

export function HomePreview({ theme }: { theme: PreviewTheme }) {
  const isDefault = theme.preset_key === 'default';
  const sec = theme.sections ?? DEFAULT_SECTIONS;
  const headerImage = appContentImageUrl(theme.header.image_url);
  const bottomColor = theme.header.gradient[theme.header.gradient.length - 1] || '#071F0F';
  return (
    <div className="relative w-[260px] overflow-hidden rounded-[28px] border-[6px] border-gray-900 bg-white shadow-xl">
      <style>{KEYFRAMES}</style>
      {/* HEADER */}
      <div
        className="relative px-3 pb-2 pt-4"
        style={{
          background: headerImage
            ? `linear-gradient(rgba(0,0,0,.3), rgba(0,0,0,.3)), url(${headerImage}) center/cover`
            : gradientCss(theme.header.gradient),
          color: theme.header.text_color,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-bold leading-tight">📍 Home</p>
            <p className="text-[9px] opacity-75">401, Vadiwadi, Vadodara…</p>
          </div>
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
            style={
              isDefault
                ? { background: '#33C362', color: '#fff' }
                : { background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.55)', color: '#fff' }
            }
          >
            ₹53
          </span>
        </div>
        {theme.lights.enabled && !isDefault && (
          <div className="mt-2">
            <Lights colors={theme.lights.colors} />
          </div>
        )}
      </div>

      {/* SHEET */}
      <div style={{ background: bottomColor }}>
        <div className="rounded-t-[18px] bg-white px-3 pb-3">
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
          <p className="text-[7px] text-gray-400">{isDefault ? DEFAULT_SECTIONS.service.subtitle : sec.service.subtitle}</p>
          {isDefault || sec.service.ornament === 'line' ? (
            <div className="mt-1 h-[2px] w-6 rounded" style={{ background: theme.accent_color }} />
          ) : (
            <p className="mt-0.5 text-[8px] leading-none" style={{ color: theme.accent_color }}>
              ── {ORNAMENT_EMOJI[sec.service.ornament]} ──
            </p>
          )}
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {['Quick Dry', 'Ironing', 'Wash'].map((label, i) => (
              <div
                key={label}
                className="relative rounded-lg border py-3 text-center text-[8px] font-semibold text-gray-700"
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
                {label}
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
