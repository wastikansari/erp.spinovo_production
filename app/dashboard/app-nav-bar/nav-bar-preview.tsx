'use client';

import { CalendarDays, Home, House, ListChecks, Receipt, Smile, User, UserCircle } from 'lucide-react';
import { AppNavBar, NavTab } from '@/lib/api/appNavBar';
import { appContentImageUrl } from '@/lib/utils';

// CSS look-alike of the app's bottom bar (AppBottomBar in the Flutter app).

type PreviewBar = Pick<
  AppNavBar,
  'style' | 'background' | 'selected_color' | 'unselected_color' | 'indicator_color' | 'labels' | 'decoration' | 'decoration_colors' | 'icon_set' | 'custom_icons'
>;

const TABS: { key: NavTab; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'booking', label: 'Booking' },
  { key: 'account', label: 'Account' },
];

const ICONS = {
  classic: { home: Home, booking: ListChecks, account: UserCircle },
  filled: { home: Home, booking: Receipt, account: User },
  rounded: { home: House, booking: CalendarDays, account: Smile },
} as const;

function bg(colors: string[]) {
  if (colors.length > 1) return `linear-gradient(90deg, ${colors.join(', ')})`;
  return colors[0] || '#FFFFFF';
}

function TabIcon({ bar, tab, selected, color, size }: { bar: PreviewBar; tab: NavTab; selected: boolean; color: string; size: number }) {
  const custom = bar.custom_icons?.[tab]?.[selected ? 'selected' : 'normal'];
  const url = appContentImageUrl(custom);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  const Icon = ICONS[bar.icon_set]?.[tab] ?? ICONS.classic[tab];
  return <Icon style={{ width: size, height: size, color }} strokeWidth={selected ? 2.6 : 2} fill={bar.icon_set === 'filled' || (selected && bar.icon_set !== 'classic') ? color : 'none'} fillOpacity={bar.icon_set === 'filled' ? 1 : 0.25} />;
}

function Strip({ bar }: { bar: PreviewBar }) {
  if (bar.decoration === 'none') return null;
  const colors = bar.decoration_colors.length ? bar.decoration_colors : ['#FFEB3B', '#FF5722'];
  return (
    <div className="flex justify-between px-2 pb-0.5">
      {Array.from({ length: 16 }, (_, i) =>
        bar.decoration === 'lights' ? (
          <span key={i} className="block h-[6px] w-[5px] rounded-full" style={{ background: colors[i % colors.length], boxShadow: `0 0 5px ${colors[i % colors.length]}`, marginTop: i % 3 === 1 ? 4 : 0 }} />
        ) : (
          <span key={i} className="block h-[7px] w-[7px] rounded-full" style={{ background: i % 2 ? '#2E7D32' : colors[i % colors.length] }} />
        )
      )}
    </div>
  );
}

export function NavBarPreview({ bar, selectedIndex = 0 }: { bar: PreviewBar; selectedIndex?: number }) {
  const showLabel = (sel: boolean) => bar.labels === 'always' || (bar.labels === 'selected' && sel);
  const floating = bar.style === 'floating' || bar.style === 'bubble';

  const items = TABS.map((t, i) => {
    const sel = i === selectedIndex;
    const color = sel ? bar.selected_color : bar.unselected_color;
    const label = showLabel(sel) && (
      <span className="text-[10px] leading-none" style={{ color: bar.style === 'lifted' && sel ? bar.indicator_color : color, fontWeight: sel ? 700 : 500 }}>
        {t.label}
      </span>
    );

    if (bar.style === 'bubble' && sel)
      return (
        <div key={t.key} className="flex flex-1 justify-center">
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1.5" style={{ background: bar.indicator_color }}>
            <TabIcon bar={bar} tab={t.key} selected color={bar.selected_color} size={16} />
            {label}
          </span>
        </div>
      );
    if (bar.style === 'lifted')
      return (
        <div key={t.key} className="relative flex flex-1 flex-col items-center justify-end pb-1.5 h-full">
          <span
            className="absolute flex items-center justify-center rounded-full transition-all"
            style={
              sel
                ? { top: -16, width: 38, height: 38, background: bar.indicator_color, border: '3px solid white', boxShadow: `0 3px 8px ${bar.indicator_color}66` }
                : { top: 6, width: 22, height: 22 }
            }
          >
            <TabIcon bar={bar} tab={t.key} selected={sel} color={color} size={sel ? 17 : 18} />
          </span>
          {label}
        </div>
      );
    if (bar.style === 'underline')
      return (
        <div key={t.key} className="flex flex-1 flex-col items-center h-full">
          <span className="block h-[3px] rounded-b" style={{ width: sel ? 22 : 0, background: bar.indicator_color }} />
          <div className="flex flex-1 flex-col items-center justify-center gap-0.5">
            <TabIcon bar={bar} tab={t.key} selected={sel} color={color} size={18} />
            {label}
          </div>
        </div>
      );
    return (
      <div key={t.key} className="flex flex-1 flex-col items-center justify-center gap-1">
        <TabIcon bar={bar} tab={t.key} selected={sel} color={color} size={19} />
        {label}
      </div>
    );
  });

  return (
    <div className="w-[260px] rounded-[22px] bg-gray-100 dark:bg-gray-800 pt-10 overflow-hidden border-[5px] border-gray-900">
      {floating ? (
        <div className="px-3 pb-2">
          <Strip bar={bar} />
          <div className="flex h-[50px] items-center rounded-[20px] shadow-md" style={{ background: bg(bar.background) }}>
            {items}
          </div>
        </div>
      ) : (
        <div>
          <Strip bar={bar} />
          <div className="flex h-[48px] items-stretch rounded-t-[14px] shadow-[0_-3px_10px_rgba(0,0,0,0.08)]" style={{ background: bg(bar.background) }}>
            {items}
          </div>
        </div>
      )}
    </div>
  );
}
