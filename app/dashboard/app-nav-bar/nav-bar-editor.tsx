'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, appContentImageUrl } from '@/lib/utils';
import {
  AppNavBar,
  AppNavBarEditable,
  NavBarStyleKind,
  NavIconVariant,
  NavTab,
  updateNavBar,
  uploadNavIcon,
  removeNavIcon,
} from '@/lib/api/appNavBar';
import { NavBarPreview } from './nav-bar-preview';
import { toLocalInput } from '../app-content/content-form-dialog';
import { ColorInput, ColorList, Section } from '../app-theme/theme-editor';

const STYLES: { key: NavBarStyleKind; label: string; hint: string }[] = [
  { key: 'floating', label: 'Floating', hint: 'Rounded pill above the bottom (original)' },
  { key: 'solid', label: 'Solid', hint: 'Full-width bar on the bottom edge' },
  { key: 'bubble', label: 'Bubble', hint: 'Selected tab in a colored pill' },
  { key: 'lifted', label: 'Lifted', hint: 'Selected icon pops up in a circle' },
  { key: 'underline', label: 'Underline', hint: 'A line marks the selected tab' },
];

const TABS: { key: NavTab; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'booking', label: 'Booking' },
  { key: 'account', label: 'Account' },
];

function IconSlot({
  bar,
  tab,
  variant,
  onChanged,
  onError,
}: {
  bar: AppNavBar;
  tab: NavTab;
  variant: NavIconVariant;
  onChanged: (bar: AppNavBar) => void;
  onError: (msg: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = appContentImageUrl(bar.custom_icons?.[tab]?.[variant]);

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|webp)$/i.test(file.type)) return onError('Icons must be PNG or WEBP (transparent background).');
    setBusy(true);
    const result = await uploadNavIcon(bar._id, tab, variant, file);
    setBusy(false);
    if (!result.success || !result.data) return onError(result.message);
    onChanged(result.data.bar);
  }

  async function remove() {
    setBusy(true);
    const result = await removeNavIcon(bar._id, tab, variant);
    setBusy(false);
    if (!result.success || !result.data) return onError(result.message);
    onChanged(result.data.bar);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
        title={`Upload ${tab} (${variant}) icon`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-7 w-7 object-contain" />
        ) : (
          <ImagePlus className="h-4 w-4 text-gray-400" />
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <span className="text-xs text-muted-foreground w-14">{variant === 'normal' ? 'Normal' : 'Selected'}</span>
      {url && (
        <button type="button" onClick={remove} disabled={busy} className="text-gray-400 hover:text-red-600" aria-label="Remove icon">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface NavBarEditorProps {
  bar: AppNavBar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function NavBarEditor({ bar, open, onOpenChange, onSaved }: NavBarEditorProps) {
  const [draft, setDraft] = useState<AppNavBar | null>(null);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);

  useEffect(() => {
    if (!open || !bar) return;
    setDraft(structuredClone(bar));
    setStartAt(toLocalInput(bar.start_at));
    setEndAt(toLocalInput(bar.end_at));
    setError(null);
    setPreviewTab(0);
  }, [open, bar]);

  if (!draft) return null;

  const set = <K extends keyof AppNavBar>(key: K, value: AppNavBar[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  async function save() {
    if (!draft) return;
    if (draft.name.trim().length < 2) return setError('Enter a name.');
    if (startAt && endAt && endAt < startAt) return setError('End date must be after the start date.');
    setSaving(true);
    setError(null);
    const body: Partial<AppNavBarEditable> = {
      name: draft.name.trim(),
      style: draft.style,
      background: draft.background,
      selected_color: draft.selected_color,
      unselected_color: draft.unselected_color,
      indicator_color: draft.indicator_color,
      labels: draft.labels,
      decoration: draft.decoration,
      decoration_colors: draft.decoration_colors,
      icon_set: draft.icon_set,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      ...(startAt || endAt ? { is_active: true } : bar?.start_at || bar?.end_at ? { is_active: false } : {}),
    };
    const result = await updateNavBar(draft._id, body);
    setSaving(false);
    if (!result.success) return setError(result.message);
    onSaved();
    onOpenChange(false);
  }

  const filled = draft.style === 'bubble' || draft.style === 'lifted';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit bottom bar — {draft.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Section title="Name">
              <Input value={draft.name} maxLength={40} onChange={(e) => set('name', e.target.value)} />
            </Section>

            <Section title="Design">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => set('style', s.key)}
                    className={cn(
                      'rounded-lg border p-2 text-left text-sm',
                      draft.style === s.key ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900' : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <p className="font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.hint}</p>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Colors">
              <div className="space-y-1">
                <Label className="text-xs">Bar background (1 color, or 2 for a gradient)</Label>
                <ColorList colors={draft.background} onChange={(c) => set('background', c)} max={2} />
              </div>
              <ColorInput
                label={filled ? 'Selected icon/text (on the colored bubble)' : 'Selected tab'}
                value={draft.selected_color}
                onChange={(v) => set('selected_color', v)}
              />
              <ColorInput label="Other tabs" value={draft.unselected_color} onChange={(v) => set('unselected_color', v)} />
              {draft.style !== 'floating' && draft.style !== 'solid' && (
                <ColorInput
                  label={draft.style === 'underline' ? 'Underline' : draft.style === 'lifted' ? 'Lifted circle' : 'Bubble'}
                  value={draft.indicator_color}
                  onChange={(v) => set('indicator_color', v)}
                />
              )}
            </Section>

            <Section title="Labels & icons">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tab names</Label>
                  <Select value={draft.labels} onValueChange={(v) => set('labels', v as AppNavBar['labels'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always show</SelectItem>
                      <SelectItem value="selected">Only selected tab</SelectItem>
                      <SelectItem value="never">Hide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Built-in icons</Label>
                  <Select value={draft.icon_set} onValueChange={(v) => set('icon_set', v as AppNavBar['icon_set'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic (original)</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">
                  Your own icons (optional, replace the built-in ones) — square PNG, transparent background. Saved right away.
                </Label>
                {TABS.map((t) => (
                  <div key={t.key} className="flex flex-wrap items-center gap-4">
                    <span className="w-16 text-sm font-medium">{t.label}</span>
                    {(['normal', 'selected'] as NavIconVariant[]).map((v) => (
                      <IconSlot
                        key={v}
                        bar={draft}
                        tab={t.key}
                        variant={v}
                        onError={setError}
                        onChanged={(updated) => {
                          set('custom_icons', updated.custom_icons);
                          onSaved();
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Festive strip on top of the bar">
              <Select value={draft.decoration} onValueChange={(v) => set('decoration', v as AppNavBar['decoration'])}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="lights">Twinkling lights</SelectItem>
                  <SelectItem value="toran">Marigold toran</SelectItem>
                </SelectContent>
              </Select>
              {draft.decoration !== 'none' && (
                <ColorList
                  colors={draft.decoration_colors.length ? draft.decoration_colors : ['#FFEB3B', '#FF5722']}
                  onChange={(c) => set('decoration_colors', c)}
                />
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
                A theme that picks its own bar (App Theme → Edit) overrides this while the theme is live.
              </p>
            </Section>
          </div>

          <div className="lg:sticky lg:top-0 self-start space-y-3">
            <p className="text-sm font-semibold">Live preview</p>
            <NavBarPreview bar={draft} selectedIndex={previewTab} />
            <div className="flex gap-1">
              {TABS.map((t, i) => (
                <Button key={t.key} type="button" size="sm" variant={previewTab === i ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setPreviewTab(i)}>
                  {t.label}
                </Button>
              ))}
            </div>
            <p className="max-w-[260px] text-xs text-muted-foreground">Tap a tab name to preview it selected.</p>
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
