'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AppTheme,
  AppThemeEditable,
  DEFAULT_SECTIONS,
  ThemeSections,
  readabilityWarnings,
  updateTheme,
  uploadThemeHeaderImage,
  removeThemeHeaderImage,
} from '@/lib/api/appTheme';
import { HomePreview, SplashPreview } from './theme-preview';
import { AppNavBar, listNavBars } from '@/lib/api/appNavBar';
import { NavBarPreview } from '../app-nav-bar/nav-bar-preview';
import { toLocalInput } from '../app-content/content-form-dialog';

// ── Small building blocks ──────────────────────────────────────────────────

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-8 w-10 cursor-pointer rounded border border-gray-300 bg-transparent p-0.5"
      />
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className="font-mono text-xs text-muted-foreground">{value}</span>
    </label>
  );
}

export function ColorList({
  colors,
  onChange,
  min = 1,
  max = 6,
}: {
  colors: string[];
  onChange: (c: string[]) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((c, i) => (
        <div key={i} className="flex items-center gap-1 rounded-md border px-1.5 py-1">
          <input
            type="color"
            value={c}
            onChange={(e) => onChange(colors.map((x, j) => (j === i ? e.target.value.toUpperCase() : x)))}
            className="h-6 w-8 cursor-pointer bg-transparent p-0"
          />
          {colors.length > min && (
            <button
              type="button"
              onClick={() => onChange(colors.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-red-600"
              aria-label="Remove color"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {colors.length < max && (
        <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => onChange([...colors, colors[colors.length - 1] || '#FFFFFF'])}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────

interface ThemeEditorProps {
  theme: AppTheme | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ThemeEditor({ theme, open, onOpenChange, onSaved }: ThemeEditorProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<AppTheme | null>(null);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [bars, setBars] = useState<AppNavBar[]>([]);
  const [liveBarId, setLiveBarId] = useState('');

  useEffect(() => {
    if (!open) return;
    listNavBars().then((r) => {
      if (r.success && r.data) {
        setBars(r.data.bars);
        setLiveBarId(r.data.live_bar_id);
      }
    });
  }, [open]);

  useEffect(() => {
    if (!open || !theme) return;
    setDraft({ ...structuredClone(theme), sections: structuredClone(theme.sections ?? DEFAULT_SECTIONS) });
    setStartAt(toLocalInput(theme.start_at));
    setEndAt(toLocalInput(theme.end_at));
    setError(null);
  }, [open, theme]);

  if (!draft) return null;
  const isDefault = draft.preset_key === 'default';

  function patch<K extends keyof AppTheme>(key: K, value: AppTheme[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }
  function patchIn<K extends 'splash' | 'header' | 'greeting' | 'effect' | 'lights' | 'toran'>(
    key: K,
    value: Partial<AppTheme[K]>
  ) {
    setDraft((d) => (d ? { ...d, [key]: { ...d[key], ...value } } : d));
  }

  function patchSection<S extends keyof ThemeSections>(section: S, value: Partial<ThemeSections[S]>) {
    setDraft((d) => (d ? { ...d, sections: { ...d.sections, [section]: { ...d.sections[section], ...value } } } : d));
  }

  const warnings = readabilityWarnings(draft);
  const sec = draft.sections;
  // Bar the app will show with this theme (before recoloring).
  const previewBar = bars.find((b) => b._id === (draft.nav_bar_id || liveBarId));
  const tintedBar =
    previewBar && draft.nav_tint && !isDefault
      ? {
          ...previewBar,
          ...(previewBar.style === 'bubble' || previewBar.style === 'lifted'
            ? { indicator_color: draft.accent_color }
            : { selected_color: draft.accent_color, indicator_color: draft.accent_color }),
          decoration_colors: draft.lights.colors.length ? draft.lights.colors : previewBar.decoration_colors,
        }
      : previewBar;

  async function save() {
    if (!draft) return;
    if (draft.name.trim().length < 2) return setError('Enter a theme name.');
    if (startAt && endAt && endAt < startAt) return setError('End date must be after the start date.');
    setSaving(true);
    setError(null);
    const body: Partial<AppThemeEditable> = {
      name: draft.name.trim(),
      splash: draft.splash,
      header: { gradient: draft.header.gradient, text_color: draft.header.text_color },
      accent_color: draft.accent_color,
      greeting: draft.greeting,
      effect: draft.effect,
      lights: draft.lights,
      toran: draft.toran,
      tile_tint: draft.tile_tint,
      sections: draft.sections,
      nav_bar_id: draft.nav_bar_id,
      nav_tint: draft.nav_tint,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      // Setting a schedule means "turn on during that window". Clearing a
      // schedule turns the theme off rather than making it live forever.
      ...(startAt || endAt
        ? { is_active: true }
        : theme?.start_at || theme?.end_at
          ? { is_active: false }
          : {}),
    };
    const result = await updateTheme(draft._id, body);
    setSaving(false);
    if (!result.success) return setError(result.message);
    onSaved();
    onOpenChange(false);
  }

  async function pickImage(file: File | undefined) {
    if (!file || !draft) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return setError('Image must be PNG, JPG or WEBP.');
    if (file.size > 10 * 1024 * 1024) return setError('Image must be under 10 MB.');
    setImageBusy(true);
    const result = await uploadThemeHeaderImage(draft._id, file);
    setImageBusy(false);
    if (!result.success || !result.data) return setError(result.message);
    patchIn('header', { image_url: result.data.theme.header.image_url });
    onSaved();
  }

  async function removeImage() {
    if (!draft) return;
    setImageBusy(true);
    const result = await removeThemeHeaderImage(draft._id);
    setImageBusy(false);
    if (!result.success) return setError(result.message);
    patchIn('header', { image_url: '' });
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit theme — {draft.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          {/* ── FORM ── */}
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {warnings.length > 0 && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {warnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <Section title="Name">
              <Input value={draft.name} maxLength={40} onChange={(e) => patch('name', e.target.value)} />
              {isDefault && (
                <p className="text-xs text-muted-foreground">
                  The Default theme is the app&apos;s normal look — decorations are never shown with it.
                </p>
              )}
            </Section>

            <Section title="Splash screen (app opening)">
              <div className="space-y-1">
                <Label className="text-xs">Background (top → bottom)</Label>
                <ColorList colors={draft.splash.gradient} onChange={(c) => patchIn('splash', { gradient: c })} max={3} />
              </div>
              <ColorInput label="Text color" value={draft.splash.text_color} onChange={(v) => patchIn('splash', { text_color: v })} />
              <div className="space-y-1">
                <Label className="text-xs">Tagline (under “Spinovo”)</Label>
                <Input value={draft.splash.tagline} maxLength={60} onChange={(e) => patchIn('splash', { tagline: e.target.value })} />
              </div>
            </Section>

            <Section title="Home header">
              <div className="space-y-1">
                <Label className="text-xs">Background colors (left → right)</Label>
                <ColorList colors={draft.header.gradient} onChange={(c) => patchIn('header', { gradient: c })} max={3} />
              </div>
              <ColorInput label="Text color" value={draft.header.text_color} onChange={(v) => patchIn('header', { text_color: v })} />
              {!isDefault && (
                <div className="space-y-1">
                  <Label className="text-xs">Artwork (optional — replaces the colors, slightly darkened)</Label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        pickImage(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                    <Button type="button" size="sm" variant="outline" disabled={imageBusy} onClick={() => fileInput.current?.click()}>
                      {imageBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                      {draft.header.image_url ? 'Change artwork' : 'Upload artwork'}
                    </Button>
                    {draft.header.image_url && (
                      <Button type="button" size="sm" variant="outline" disabled={imageBusy} onClick={removeImage}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Wide image, about 1440×600. Saved right away.</p>
                </div>
              )}
            </Section>

            {!isDefault && (
              <>
                <Section title="Accent & greeting">
                  <ColorInput label="Accent (lines, badges)" value={draft.accent_color} onChange={(v) => patch('accent_color', v)} />
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Greeting above the banners (empty = hidden)</Label>
                      <Input
                        value={draft.greeting.text}
                        maxLength={40}
                        placeholder="Happy Navratri 🪔"
                        onChange={(e) => patchIn('greeting', { text: e.target.value })}
                      />
                    </div>
                    <ColorInput value={draft.greeting.color} onChange={(v) => patchIn('greeting', { color: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Tint behind service tiles</Label>
                    <div className="flex items-center gap-3">
                      {draft.tile_tint && <ColorInput value={draft.tile_tint} onChange={(v) => patch('tile_tint', v)} />}
                      <Switch checked={draft.tile_tint !== null} onCheckedChange={(on) => patch('tile_tint', on ? '#FFF3E0' : null)} />
                    </div>
                  </div>
                </Section>

                <Section title="Falling effect">
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={draft.effect.style} onValueChange={(v) => patchIn('effect', { style: v as AppTheme['effect']['style'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="petals">🌼 Marigold petals</SelectItem>
                        <SelectItem value="sparkles">✨ Sparkles</SelectItem>
                        <SelectItem value="stars">⭐ Stars</SelectItem>
                        <SelectItem value="snow">❄️ Snow</SelectItem>
                        <SelectItem value="confetti">🎉 Confetti</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={draft.effect.density} onValueChange={(v) => patchIn('effect', { density: v as AppTheme['effect']['density'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Light</SelectItem>
                        <SelectItem value="medium">Normal</SelectItem>
                        <SelectItem value="high">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {draft.effect.style !== 'none' && (
                    <ColorList colors={draft.effect.colors.length ? draft.effect.colors : ['#FFFFFF']} onChange={(c) => patchIn('effect', { colors: c })} />
                  )}
                </Section>

                <Section title="Festival lights (under the header)">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show lights</Label>
                    <Switch checked={draft.lights.enabled} onCheckedChange={(v) => patchIn('lights', { enabled: v })} />
                  </div>
                  {draft.lights.enabled && (
                    <>
                      <ColorList colors={draft.lights.colors.length ? draft.lights.colors : ['#FFEB3B']} onChange={(c) => patchIn('lights', { colors: c })} />
                      <Select value={draft.lights.speed} onValueChange={(v) => patchIn('lights', { speed: v as AppTheme['lights']['speed'] })}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow twinkle</SelectItem>
                          <SelectItem value="normal">Normal twinkle</SelectItem>
                          <SelectItem value="fast">Fast twinkle</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </Section>

                <Section title="Marigold toran">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show toran</Label>
                    <Switch checked={draft.toran.enabled} onCheckedChange={(v) => patchIn('toran', { enabled: v })} />
                  </div>
                  {draft.toran.enabled && (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Flowers</Label>
                        <ColorList colors={draft.toran.flower_colors} onChange={(c) => patchIn('toran', { flower_colors: c })} max={4} />
                      </div>
                      <ColorInput label="Leaves" value={draft.toran.leaf_color} onChange={(v) => patchIn('toran', { leaf_color: v })} />
                    </div>
                  )}
                </Section>
                <Section title="“Our Service” section">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input value={sec.service.title} maxLength={30} onChange={(e) => patchSection('service', { title: e.target.value })} />
                    </div>
                    <ColorInput value={sec.service.title_color} onChange={(v) => patchSection('service', { title_color: v })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subtitle</Label>
                    <Input value={sec.service.subtitle} maxLength={60} onChange={(e) => patchSection('service', { subtitle: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Under the title</Label>
                      <Select value={sec.service.ornament} onValueChange={(v) => patchSection('service', { ornament: v as ThemeSections['service']['ornament'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="line">Plain line</SelectItem>
                          <SelectItem value="diamond">─◆─ Diamond</SelectItem>
                          <SelectItem value="flower">─🌼─ Marigold</SelectItem>
                          <SelectItem value="diya">─🪔─ Diya</SelectItem>
                          <SelectItem value="star">─⭐─ Star</SelectItem>
                          <SelectItem value="snowflake">─❄️─ Snowflake</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tile corner decoration</Label>
                      <Select value={sec.service.tile_corner} onValueChange={(v) => patchSection('service', { tile_corner: v as ThemeSections['service']['tile_corner'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="flower">🌼 Marigold</SelectItem>
                          <SelectItem value="diya">🪔 Diya</SelectItem>
                          <SelectItem value="star">⭐ Star</SelectItem>
                          <SelectItem value="snowflake">❄️ Snowflake</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Tile border color</Label>
                    <div className="flex items-center gap-3">
                      {sec.service.tile_border_color && (
                        <ColorInput value={sec.service.tile_border_color} onChange={(v) => patchSection('service', { tile_border_color: v })} />
                      )}
                      <Switch
                        checked={sec.service.tile_border_color !== null}
                        onCheckedChange={(on) => patchSection('service', { tile_border_color: on ? '#FFCC80' : null })}
                      />
                    </div>
                  </div>
                </Section>

                <Section title="Bookings card">
                  <div className="flex flex-wrap gap-4">
                    <ColorInput label="Title" value={sec.bookings.title_color} onChange={(v) => patchSection('bookings', { title_color: v })} />
                    <ColorInput label="“View All”" value={sec.bookings.link_color} onChange={(v) => patchSection('bookings', { link_color: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Card tint</Label>
                    <div className="flex items-center gap-3">
                      {sec.bookings.card_tint && <ColorInput value={sec.bookings.card_tint} onChange={(v) => patchSection('bookings', { card_tint: v })} />}
                      <Switch checked={sec.bookings.card_tint !== null} onCheckedChange={(on) => patchSection('bookings', { card_tint: on ? '#FFF8F0' : null })} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Card border</Label>
                    <div className="flex items-center gap-3">
                      {sec.bookings.border_color && <ColorInput value={sec.bookings.border_color} onChange={(v) => patchSection('bookings', { border_color: v })} />}
                      <Switch checked={sec.bookings.border_color !== null} onCheckedChange={(on) => patchSection('bookings', { border_color: on ? '#FFCC80' : null })} />
                    </div>
                  </div>
                </Section>

                <Section title="Footer (“Live it up!” area)">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Big title (empty = hidden)</Label>
                      <Input value={sec.footer.title} maxLength={30} onChange={(e) => patchSection('footer', { title: e.target.value })} />
                    </div>
                    <ColorInput value={sec.footer.title_color} onChange={(v) => patchSection('footer', { title_color: v })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Line 1</Label>
                      <Input value={sec.footer.subtitle} maxLength={60} onChange={(e) => patchSection('footer', { subtitle: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Line 2</Label>
                      <Input value={sec.footer.credit} maxLength={60} onChange={(e) => patchSection('footer', { credit: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <ColorInput label="Lines color" value={sec.footer.text_color} onChange={(v) => patchSection('footer', { text_color: v })} />
                    <Select value={sec.footer.ornament} onValueChange={(v) => patchSection('footer', { ornament: v as ThemeSections['footer']['ornament'] })}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No decoration row</SelectItem>
                        <SelectItem value="diyas">🪔 Row of diyas</SelectItem>
                        <SelectItem value="marigolds">🌼 Row of marigolds</SelectItem>
                        <SelectItem value="snowflakes">❄️ Row of snowflakes</SelectItem>
                        <SelectItem value="stars">⭐ Row of stars</SelectItem>
                        <SelectItem value="confetti">🎉 Confetti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Section>
              </>
            )}

            <Section title="Bottom bar with this theme">
              <Select
                value={draft.nav_bar_id ?? 'live'}
                onValueChange={(v) => patch('nav_bar_id', v === 'live' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Keep the bar applied in Bottom Bar</SelectItem>
                  {bars.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      Use “{b.name}”
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isDefault && (
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Recolor the bar with this theme (accent + lights colors)</Label>
                  <Switch checked={draft.nav_tint} onCheckedChange={(v) => patch('nav_tint', v)} />
                </div>
              )}
              {tintedBar && (
                <div className="pt-1">
                  <NavBarPreview bar={tintedBar} />
                </div>
              )}
            </Section>

            <Section title="Schedule (optional)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Start</Label>
                  <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End</Label>
                  <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                With dates set, this theme turns on and off by itself and wins over any “Apply now” theme during
                its window. Leave empty to use “Apply now”.
              </p>
            </Section>
          </div>

          {/* ── LIVE PREVIEW ── */}
          <div className="lg:sticky lg:top-0 self-start space-y-3">
            <p className="text-sm font-semibold">Live preview</p>
            <div className="flex gap-3 items-start">
              <HomePreview theme={draft} />
              <SplashPreview theme={draft} />
            </div>
            <p className="max-w-[420px] text-xs text-muted-foreground">
              Close approximation — the app draws smoother lights, petals and toran.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
